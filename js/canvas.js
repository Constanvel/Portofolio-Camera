// ══ portfolio · the canvas of work ══════════════════════════════════════════
// An endless plane of project images you drag through. Images, the seven
// text cards and the cursor grid are composited into one 2D canvas, because
// the grid effect has to sample the frame underneath it. Two passes:
//
//   pass 1  draw the tiled plane into an offscreen buffer
//   pass 2  blit that buffer, then re-draw the cells around the cursor from
//           a shrinking source rect, so the pointer magnifies what it is over
//
// Cell size is ~3× a cursor (54 CSS px). Adapted from creativeocean's
// "Canvas Grid Mouse Effect" (CodePen emBOove); GSAP's quickTo is replaced
// with a plain critically-damped lerp so the site carries no CDN.

import { WORKS, CARDS, SLOTS, COLS, ROWS } from './data.js';
// the cards are the only text this file owns, and the plane is redrawn from
// scratch every frame — so reading the label through t() is the whole of what
// switching language costs here. Nothing has to tell the canvas about it.
import { t } from './i18n.js';
import { Trackers } from './track.js';

/* The same stack css/style.css sets on <body>, because canvas type and page
   type are the same voice and must not drift apart. Written once here: it was
   three copies of a literal, and the third had already lost a fallback.
   No webfont — the operating system's own UI face is resident before this
   module runs, so there is nothing to wait for and nothing to ship. */
const UI = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

/* ── touch ──────────────────────────────────────────────────────────────
   A finger leaves no cursor behind it, so on a coarse pointer the lens has
   nothing to follow. Instead of the cursor grid plus the soft edge, a touch
   device gets ONE treatment on the periphery: the grid magnification itself,
   absent at the centre of the frame and fading in toward the corners. It
   replaces `softenEdges` rather than joining it — a frame gets one edge
   treatment, not two. Flip EDGE_GRID to true unconditionally to put the same
   viewfinder edge on the desktop build. */
const COARSE     = matchMedia('(pointer: coarse)').matches;
const EDGE_GRID  = COARSE;
const MAX_DECODE = COARSE ? 3 : 99;   // concurrent hardware decoders to ask for
const TAP        = COARSE ? 12 : 8;   // a finger wanders; a mouse does not
/* ── the idle frame rate on touch ────────────────────────────────────────
   A frame here is four full-screen operations: the buffer is cleared and
   repapered, then the screen is cleared and the buffer blitted onto it. At
   750x1624 that is the whole cost of this file, and it was being paid sixty
   times a second whether or not anything had moved.
   At rest the only thing still moving is the tracker ornament, and its blobs
   take between twenty-five and forty-seven seconds to go round once — about
   thirty pixels a second. Redrawing that twenty times a second is
   indistinguishable and costs a third as much, which on a phone is the
   difference between a warm gpu and an idle one.
   Zero on a mouse: the desktop has the headroom, and it has a cursor to chase
   that moves as fast as a hand does. 50ms also sits under the 64ms clamp on
   dt below, so a skipped frame never loses time out of the easing. */
const IDLE_MS    = COARSE ? 50 : 0;
/* And nothing caps the moving frame rate. There used to be a ceiling here, on
   the theory that a mid-range Android running its panel at 90 or 120 was being
   asked for twice the work it could give. Then a meter went on the phone that
   started this and reported 56 Hz, so the ceiling was never doing anything for
   the device it was written for — and it carried a real risk: it measured the
   panel once, across the first twenty frames, which is exactly when a page is
   still loading and its frames are least regular. One sample reading high and
   it would have halved that visitor's frame rate for the whole session with
   nothing to correct it. A phone that can draw every frame now draws every
   frame; a phone that cannot drops them on its own, which is the browser's job
   and it is better at it than a guess made at load time. */

/* ── ?fps ────────────────────────────────────────────────────────────────
   A phone I cannot hold is a phone I cannot profile. Everything above this
   line was chosen from a desktop measurement multiplied by a guess about a
   gpu, and a guess is what keeps being wrong. Add ?fps to the url and the
   plane says what it is actually doing, on the device actually doing it:
   frames a second, how long one costs, what the panel is asking for, and the
   size being filled.
   The flag is read once at load, so with it absent this costs a boolean. */
const METER = new URLSearchParams(location.search).has('fps');

/* ── ?nogrid ─────────────────────────────────────────────────────────────
   One experiment, so the next decision is not another guess. The peripheral
   lattice issues sixty-eight drawImage calls that READ from the buffer canvas
   this same frame wrote to, and on a tile-based mobile gpu a read from a
   surface you just rendered can force a flush. That costs almost nothing in
   javascript — which is exactly what the meter reports, two milliseconds — and
   can cost the whole frame budget on the gpu, where no timer here can see it.
   Add &nogrid alongside ?fps and the lattice is skipped. If the frame rate
   climbs, that is the answer; if it does not, the lattice is innocent and the
   cost is somewhere else. Off by default, and read once at load. */
const NOGRID = new URLSearchParams(location.search).has('nogrid');

/* ── ?bare ───────────────────────────────────────────────────────────────
   The floor: the least this file can possibly do and still be the plane.
   No ornament, and no second canvas — everything goes straight to the screen
   rather than being drawn into a buffer and copied over, which is two
   full-screen passes where one would do. The buffer only exists so the
   peripheral lattice has something to sample from; with the lattice gone it
   is pure overhead, and this is what measures how much.
   It answers the one question left. If the frame rate reaches the panel here,
   the budget exists and the cost is in what was removed, one piece at a time.
   If it does not, then this device cannot repaint a canvas of this size at
   this rate at all, and the answer is a smaller canvas or a lower target —
   not another thing to shave. */
const BARE   = new URLSearchParams(location.search).has('bare');

/* The block repeats in both directions. SLOTS and its dimensions live beside
   WORKS and CARDS in data.js; column offsets keep rows staggered. */
const COL_GAP = 0.34, ROW_GAP = 0.42;
const TILE_AR = 9 / 16;
const COL_OFF = [0, 0.30, 0.12, 0.44];

/* Each slot indexes WORKS or CARDS. The static checker reports missing,
   out-of-range or overlapping slots before deployment. */


/* data.js is hand-edited every time a work is added or dropped. A slot left
   pointing past the end of WORKS or CARDS would throw inside the draw loop —
   not a missing tile but a blank plane, sixty times a second — so the table
   is trimmed once, here, rather than guarded on every frame. */
const LIVE = SLOTS.filter(s => (s.kind === 'work' ? WORKS : CARDS)[s.i] !== undefined);

/* Edge softness. Real glass is sharp on axis and falls off toward the corner
   of the image circle; this is that, not a decorative blur. Done at a third
   of the resolution — the upscale is itself a blur, so a small radius down
   there buys a large, smooth one up here for a fraction of the cost. */
const BLUR_SCALE = 0.34;
const BLUR_PX    = 3.3;   // radius in the small buffer
const BLUR_START = 0.50;  // fraction of the image circle that stays sharp

/* The peripheral grid. Same lattice and the same dot as the cursor lens, but
   the strength is radial from the centre of the frame rather than from the
   pointer, and the magnification is capped — an uncapped corner blows a
   single pixel up to a whole cell. */
const EDGE_START = 0.50;  // exactly BLUR_START: it lands where the blur did
const EDGE_FALL  = 1.90;  // stays at nothing for longer, then arrives quickly
const EDGE_MAX   = 0.42;  // hardest magnification at the corner (≈ 1.7×)
const EDGE_DOT   = 0.30;  // the dot is a permanent resident here, not a cursor
const EDGE_STEPS = 6;     // alpha buckets the dots are batched into

const GRID_BOX   = 54;    // ≈ 3 × a cursor
const GRID_R     = 285;   // reach of the effect, CSS px
const GRID_FALL  = 1.5;   // steeper than linear: a tight core, a soft edge
const DOT_ALPHA  = 0.62;

export class WorkCanvas {
  constructor(canvas, opts = {}){
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.buf = document.createElement('canvas');
    this.bctx = this.buf.getContext('2d');
    /* Every colour on this plane used to be a literal, which meant the canvas
       could not follow a theme the CSS already knew about. They are read off
       the custom properties instead, once, and re-read when the theme changes
       — see readPalette(). The soft-edge mask is the one exception and stays a
       literal: it composites on ALPHA, so its colour is never seen. */
    this.pal = {};
    this.readPalette();
    this.onRoute = opts.onRoute || (() => {});
    this.onWork = opts.onWork || (() => {});
    this.onFirstDrag = opts.onFirstDrag || (() => {});
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.coarse = COARSE;
    this.edgeGrid = EDGE_GRID;

    this.x = 0; this.y = 0;          // rendered offset
    this.tx = 0; this.ty = 0;        // target offset
    this.vx = 0; this.vy = 0;
    this.drag = null;
    this.dragged = false;
    this.hotCard = null;

    this.mx = -9999; this.my = -9999;   // smoothed cursor
    this.px = -9999; this.py = -9999;   // raw cursor
    this.spread = 1;

    /* Films and stills share the plane. An <img> is handed the four bits of the
       <video> interface the rest of this file reads — play, pause, the natural
       size and readyState — so nothing downstream has to ask which one it got.
       Stills are served at one size: they cost a fraction of a film, which is
       the whole reason the five works here are screenshots. */
    this.media = WORKS.map(w => {
      const loaded = () => { this.ready = true; };
      if (/\.(png|jpe?g|webp|gif|avif)$/i.test(w.src)){
        const im = new Image();
        im.decoding = 'async';
        im.play = () => Promise.resolve();
        im.pause = () => {};
        Object.defineProperties(im, {
          videoWidth:  { get(){ return im.naturalWidth;  } },
          videoHeight: { get(){ return im.naturalHeight; } },
          readyState:  { get(){ return im.complete && im.naturalWidth ? 4 : 0; } }
        });
        im.addEventListener('load', loaded);
        im.src = w.src;
        return im;
      }
      const v = document.createElement('video');
      /* Video sources, if added, use the same URL on all devices. */
      v.src = w.src;
      v.muted = true; v.loop = true; v.playsInline = true;
      v.preload = 'auto'; v.setAttribute('playsinline','');
      v.addEventListener('loadeddata', loaded);
      return v;
    });
    this.playing = new Array(this.media.length).fill(false);

    this.trackers = new Trackers();
    this.blurCv = document.createElement('canvas');
    this.bl = this.blurCv.getContext('2d');
    this.maskCv = document.createElement('canvas');
    this.running = false;
    this._bind();
    this.resize();
  }

  /* ── geometry ─────────────────────────────────────────────────────── */
  resize(){
    const w = window.innerWidth, h = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    /* Two full-frame passes every frame, and on touch the gpu doing them is a
       phone's. The ceiling used to be 3.2 Mpx, which no phone ever reached —
       a 393x803 viewport at the capped dpr of 2 is 1.26 — so the step-down
       below had never once run and the constant was decoration.
       One megapixel is a ceiling phones actually stand under: it takes that
       393x803 to dpr 1.75, and a taller or denser one to 1.5. What it costs is
       type on the plane being resolved a little softer; what it buys is a
       fifth to nearly half of every fill, on the devices that were dropping
       frames. A tablet lands at dpr 1 under this, which is the one place the
       trade is uncomfortable — but a tablet is `pointer: coarse` too and this
       is one number, not a table of them. */
    if (COARSE) while (this.dpr > 1 && w * h * this.dpr * this.dpr > 1.0e6) this.dpr -= 0.25;
    /* Nothing to do when nothing changed, and it often has not: window resize
       and visualViewport resize both fire for the same url bar sliding away,
       and orientationchange fires alongside them. Setting canvas.width at all
       reallocates the bitmap and clears it, twice over at 786x1606 here, so
       the no-op cost a real stall and a blank frame. */
    if (w === this.w && h === this.h && this.dpr === this._dpr) return;
    this._dpr = this.dpr;
    for (const c of [this.cv, this.buf]){
      c.width = Math.round(w * this.dpr);
      c.height = Math.round(h * this.dpr);
    }
    this.cv.style.width = w + 'px'; this.cv.style.height = h + 'px';
    this.w = w; this.h = h;

    // a narrow viewport wants a bigger share of its width per tile and
    // tighter gutters, or you get one lonely column in a field of paper
    const narrow = w < 640;
    this.tileW = narrow ? clamp(w * 0.66, 180, 320) : clamp(w * 0.30, 230, 460);
    this.tileH = this.tileW * TILE_AR;
    const cg = narrow ? 0.24 : COL_GAP, rg = narrow ? 0.30 : ROW_GAP;
    this.colPitch = this.tileW * (1 + cg);
    this.rowPitch = this.tileH + this.tileW * rg;
    this.blockW = COLS * this.colPitch;
    this.blockH = ROWS * this.rowPitch;
    this.trackers.resize(w, h);

    // the soft-edge buffer and its falloff mask — not allocated at all when
    // the periphery is carrying the grid instead
    if (this.edgeGrid){ this.blurCv.width = this.blurCv.height = 1; return; }
    const bw = Math.max(2, Math.round(w * BLUR_SCALE));
    const bh = Math.max(2, Math.round(h * BLUR_SCALE));
    this.blurCv.width = this.maskCv.width = bw;
    this.blurCv.height = this.maskCv.height = bh;
    const m = this.maskCv.getContext('2d');
    const half = Math.hypot(bw, bh) / 2;          // the image circle
    const g = m.createRadialGradient(bw / 2, bh / 2, half * BLUR_START, bw / 2, bh / 2, half);
    g.addColorStop(0.00, 'rgba(0,0,0,0)');
    g.addColorStop(0.45, 'rgba(0,0,0,0.30)');
    g.addColorStop(0.78, 'rgba(0,0,0,0.74)');
    g.addColorStop(1.00, 'rgba(0,0,0,1)');
    m.clearRect(0, 0, bw, bh);
    m.fillStyle = g; m.fillRect(0, 0, bw, bh);
  }

  /* ── input ────────────────────────────────────────────────────────── */
  _bind(){
    const cv = this.cv;
    cv.addEventListener('pointerdown', e => {
      cv.focus({ preventScroll: true });
      cv.setPointerCapture(e.pointerId);
      this.drag = { x:e.clientX, y:e.clientY, ox:this.tx, oy:this.ty, moved:0, t:performance.now() };
      cv.classList.add('is-drag');
    });
    cv.addEventListener('pointermove', e => {
      this.px = e.clientX; this.py = e.clientY;
      if (this.drag){
        const dx = e.clientX - this.drag.x, dy = e.clientY - this.drag.y;
        this.drag.moved = Math.max(this.drag.moved, Math.hypot(dx, dy));
        this.tx = this.drag.ox + dx;
        this.ty = this.drag.oy + dy;
        if (this.drag.moved > TAP && !this.dragged){ this.dragged = true; this.onFirstDrag(); }
      } else {
        this._hover(e.clientX, e.clientY);
      }
    });
    const end = (e) => {
      if (!this.drag) return;
      const d = this.drag; this.drag = null;
      cv.classList.remove('is-drag');
      // flick
      const dt = Math.max(16, performance.now() - d.t);
      if (d.moved > TAP){
        if (!this.reduced){
          this.tx += this.vx * 90 / dt * 4;
          this.ty += this.vy * 90 / dt * 4;
        }
      } else {
        /* The same tap that opens a card opens a work — `d.moved > TAP` above
           has already separated a tap from a drag, so this costs nothing but
           the lookup. Cards win a tie: they sit in their own slots, but a
           fingertip's padding can reach across into a neighbouring tile. */
        const card = this._cardAt(e.clientX, e.clientY);
        if (card) this.onRoute(card.route);
        else {
          const tile = this._tileAt(e.clientX, e.clientY);
          if (tile) this.onWork(tile.i);
        }
      }
    };
    cv.addEventListener('pointerup', e => {
      end(e);
      // a finger leaves no cursor behind it, so the lens must be put away
      if (e.pointerType === 'touch'){ this.px = this.py = -9999; this.mx = this.my = -9999; }
    });
    cv.addEventListener('pointercancel', () => { this.drag = null; cv.classList.remove('is-drag'); });
    cv.addEventListener('wheel', e => {
      e.preventDefault();
      this.tx -= e.deltaX; this.ty -= e.deltaY;
      if (!this.dragged){ this.dragged = true; this.onFirstDrag(); }
    }, { passive:false });
    cv.addEventListener('pointerleave', () => { this.px = this.py = -9999; });

    // keyboard: the plane must be reachable without a pointer
    window.addEventListener('keydown', e => {
      if (!this.running || e.defaultPrevented || e.target !== cv) return;
      const step = this.tileW * 0.6;
      if (e.key === 'ArrowLeft')  { this.tx += step; e.preventDefault(); }
      if (e.key === 'ArrowRight') { this.tx -= step; e.preventDefault(); }
      if (e.key === 'ArrowUp')    { this.ty += step; e.preventDefault(); }
      if (e.key === 'ArrowDown')  { this.ty -= step; e.preventDefault(); }
    });
  }

  _hover(x, y){
    const card = this._cardAt(x, y);
    // tiles open too now, so they light the cursor as the cards do. is-hot is
    // only cursor:pointer — it does not touch the lens or the grid.
    const hot = !!card || !!this._tileAt(x, y);
    if (hot !== this._hot){ this._hot = hot; this.cv.classList.toggle('is-hot', hot); }
  }

  /** Pulls the theme's colours off :root. Cheap, and only ever called on a
      theme change — getComputedStyle in the draw loop would be a per-frame
      style resolution for four strings that change twice a visit. */
  readPalette(){
    const cs = getComputedStyle(document.body);
    const v = (n, fallback) => (cs.getPropertyValue(n).trim() || fallback);
    this.pal = {
      paper: v('--paper',  '#ffffff'),
      ink:   v('--ink',    '#111014'),
      ink2:  v('--ink-2',  '#5d5b63'),
      ink3:  v('--ink-3',  '#a9a7b0'),
      sunk:  v('--sunk',   '#f2f1f4')
    };
  }

  _cardAt(x, y){
    // a fingertip is about 9 mm across; the type is not
    const p = this.coarse ? 16 : 0;
    for (const r of (this._cardRects || [])){
      if (x >= r.x - p && x <= r.x + r.w + p && y >= r.y - p && y <= r.y + r.h + p) return r;
    }
    return null;
  }

  // no padding here: a tile is already the size of a photograph, and growing
  // its hit area would only let it steal taps from the card beside it
  _tileAt(x, y){
    for (const r of (this._tileRects || [])){
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r;
    }
    return null;
  }

  /* ── run ──────────────────────────────────────────────────────────── */
  start(){
    if (this.running) return;
    this.running = true;
    this._last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      this._raf = requestAnimationFrame(loop);
      /* How often the browser OFFERS a frame. Reported, not acted on: it is
         the number that proved a phone assumed to be 120 Hz was running at 56,
         which is the only reason the pacing that used to live here is gone.
         Intervals are kept raw and reduced to a median in the meter, the same
         as every other number there. This used to hold a moving average of
         1000/interval instead, and the average of a reciprocal is not the
         reciprocal of the average: one short gap becomes a huge Hz reading and
         drags the mean up for a second behind it. It showed 50 next to a draw
         rate of 30 — two numbers measured two different ways, which is not a
         comparison, and the gap between them was read as dropped frames. */
      if (METER && this._pt){
        (this._rg || (this._rg = [])).push(now - this._pt);
        if (this._rg.length > 60) this._rg.shift();
      }
      this._pt = now;
      this.frame(now);
    };
    this._raf = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', this._vis = () => {
      if (document.hidden) this.media.forEach(v => v.pause());
      else this.playing.forEach((p, i) => { if (p) this.media[i].play().catch(()=>{}); });
    });
  }
  stop(){
    this.running = false;
    cancelAnimationFrame(this._raf);
    this.media.forEach(v => v.pause());
    this.playing.fill(false);
    if (this._vis) document.removeEventListener('visibilitychange', this._vis);
  }

  frame(now){
    const raw = now - this._last;
    /* Moving means a finger is down, the plane is still easing toward its
       target — a flick decays here rather than in the handler, so this covers
       momentum too — or a cursor is on the glass. `_last` is deliberately NOT
       advanced when the draw is skipped, so the dt that finally arrives is the
       real elapsed time: the easing and the trackers are both written against
       dt, so they run at the same speed however few frames they are given. */
    if (IDLE_MS && raw < IDLE_MS && !this.drag && this.px < -9998
        && Math.abs(this.tx - this.x) < 0.05 && Math.abs(this.ty - this.y) < 0.05) return;
    const dt = Math.min(64, raw); this._last = now;
    const t0 = METER ? performance.now() : 0;
    const k = this.reduced ? 1 : 1 - Math.pow(0.0009, dt / 1000);
    const nx = this.x + (this.tx - this.x) * k;
    const ny = this.y + (this.ty - this.y) * k;
    this.vx = nx - this.x; this.vy = ny - this.y;
    this.x = nx; this.y = ny;

    // cursor: same easing family, a touch looser
    const ck = 1 - Math.pow(0.002, dt / 1000);
    if (this.px > -9998){
      if (this.mx < -9998){ this.mx = this.px; this.my = this.py; }
      this.mx += (this.px - this.mx) * ck;
      this.my += (this.py - this.my) * ck;
    }
    const chase = Math.hypot(this.px - this.mx, this.py - this.my);
    this.spread += (clamp(1 + chase / 260, 1, 2.1) - this.spread) * 0.12;

    this.drawPlane(dt);
    this.drawGrid();
    // on touch the trackers are laid down UNDER the images, inside
    // drawPlane — see there
    if (!this.coarse && !BARE) this.drawTrackers(dt);
    this.softenEdges();
    if (METER) this._meter(now, performance.now() - t0);
  }

  /* Rolling medians, redrawn four times a second into one <pre>. A median and
     not a mean: one long frame is what you feel, but an average of sixty hides
     it, and the number that matters here is what a typical frame costs. */
  _meter(now, ms){
    const m = this._m || (this._m = { draw: [], gap: [], last: 0, el: null });
    m.draw.push(ms);
    if (m.prev) m.gap.push(now - m.prev);
    m.prev = now;
    if (m.draw.length > 60) m.draw.shift();
    if (m.gap.length > 60) m.gap.shift();
    if (now - m.last < 250) return;
    m.last = now;
    if (!m.el){
      m.el = document.createElement('pre');
      m.el.style.cssText = 'position:fixed;left:8px;top:8px;z-index:9999;margin:0;'
        + 'padding:6px 8px;background:#000c;color:#0f0;font:11px/1.35 ui-monospace,monospace;'
        + 'border-radius:6px;pointer-events:none;white-space:pre';
      document.body.appendChild(m.el);
    }
    const mid = a => a.length ? [...a].sort((x, y) => x - y)[a.length >> 1] : 0;
    const gap = mid(m.gap), drawn = gap ? 1000 / gap : 0;
    /* The one number that separates the two questions. A frame rate below the
       panel means nothing on its own: the browser may be offering fewer, or it
       may be offering plenty and this file may be throwing them away. Both
       sides are now a median of the same quantity, so the difference between
       them is real rather than an artefact of two different averages. */
    const offer = mid(this._rg || []);
    const skip  = offer && gap ? Math.max(0, Math.round((1 - offer / gap) * 100)) : 0;
    m.el.textContent =
      `fps  ${drawn.toFixed(0)}  (${gap.toFixed(1)}ms antar gambar)
` +
      `draw ${mid(m.draw).toFixed(2)}ms  terburuk ${Math.max(...m.draw).toFixed(1)}
` +
      `dpr  ${this.dpr}  ${this.cv.width}x${this.cv.height}
` +
      `panel ${offer ? (1000 / offer).toFixed(0) : '?'}Hz  dilewati ${skip}%  ` +
      `tile ${(this._tileRects || []).length}`;
  }

  /* ── pass 1 ───────────────────────────────────────────────────────── */
  drawPlane(dt){
    const c = BARE ? this.ctx : this.bctx, dpr = this.dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    /* The clear is not redundant next to the fill that follows it, however it
       reads. Measured both ways: a clear that covers the WHOLE surface lets
       the driver discard the previous frame instead of loading it back in to
       be painted over, and dropping it made the frame slower, not faster. */
    c.clearRect(0, 0, this.w, this.h);
    c.fillStyle = this.pal.paper;
    c.fillRect(0, 0, this.w, this.h);

    /* On touch the overlay goes down FIRST, on the paper, and the images are
       painted over it — so the blobs and the bracket read as something the
       viewfinder is drawing behind the work rather than scribbling across it.
       Akif's call. On a mouse they stay on top, where they have always been.
       The rects are the previous frame's; the bracket is lerped anyway, and a
       frame of lag is invisible on something that drifts this slowly. */
    if (this.coarse && !BARE) this.drawTrackers(dt, c);

    const need = new Array(this.media.length).fill(false);
    const near = new Array(this.media.length).fill(Infinity);
    const cards = [];
    const tiles = [];
    const fcx = this.w / 2, fcy = this.h / 2;

    const i0 = Math.floor((-this.x - this.blockW) / this.blockW);
    const i1 = Math.ceil((-this.x + this.w + this.blockW) / this.blockW);
    const j0 = Math.floor((-this.y - this.blockH) / this.blockH);
    const j1 = Math.ceil((-this.y + this.h + this.blockH) / this.blockH);

    for (let i = i0; i <= i1; i++){
      for (let j = j0; j <= j1; j++){
        const ox = this.x + i * this.blockW;
        const oy = this.y + j * this.blockH;
        for (const s of LIVE){
          const x = ox + s.c * this.colPitch;
          const y = oy + s.r * this.rowPitch + COL_OFF[s.c] * this.rowPitch;
          if (x > this.w || x + this.tileW < 0 || y > this.h || y + this.tileH < 0) continue;
          if (s.kind === 'work'){
            need[s.i] = true;
            const dd = Math.hypot(x + this.tileW / 2 - fcx, y + this.tileH / 2 - fcy);
            if (dd < near[s.i]) near[s.i] = dd;
            this.paintWork(c, s.i, x, y);
            tiles.push({ x, y, w: this.tileW, h: this.tileH, i: s.i });
          } else {
            const r = this.paintCard(c, CARDS[s.i], x, y);
            cards.push({ ...r, route: CARDS[s.i].route });
          }
        }
      }
    }
    this._cardRects = cards;
    this._tileRects = tiles;

    /* A page only gets a handful of hardware decoders on iOS, and past that
       they fail quietly — the plane fills with frozen frames and nothing in
       the console says why. So on touch only the few films nearest the centre
       are asked to run; the rest hold the last frame they painted, which is
       what a paused <video> draws anyway. */
    // a still needs no decoder: it neither counts against the cap nor takes a slot
    const onScreen = need.map((n, i) => (n && this.media[i].tagName === 'VIDEO' ? i : -1))
                         .filter(i => i >= 0);
    this._onScreen = onScreen;          // read by the verification harness
    if (MAX_DECODE < this.media.length && onScreen.length > MAX_DECODE){
      const live = new Set(onScreen.slice().sort((a, b) => near[a] - near[b])
                                   .slice(0, MAX_DECODE));
      /* A capped tile holds the last frame it painted — but a tile that has
         NEVER played has no such frame, and draws as the grey placeholder for
         as long as it stays capped. (preload="auto" is a hint; iOS routinely
         downgrades it to metadata, so the frame does not arrive on its own.)
         So one un-primed tile at a time is allowed past the cap until it has a
         frame, then it is paused again with that frame on screen. */
      const prime = onScreen.filter(i => this.media[i].readyState < 2)
                            .sort((a, b) => near[a] - near[b])[0];
      if (prime !== undefined) live.add(prime);
      for (let n = 0; n < need.length; n++) if (need[n] && !live.has(n)) need[n] = false;
    }

    // only decode what is actually on the plane in front of someone
    for (let n = 0; n < this.media.length; n++){
      const v = this.media[n];
      if (need[n] && !this.playing[n]){ this.playing[n] = true; v.play().catch(()=>{}); }
      else if (!need[n] && this.playing[n]){ this.playing[n] = false; v.pause(); }
    }
  }

  paintWork(c, i, x, y){
    const v = this.media[i];
    const w = this.tileW, h = this.tileH;
    if (v.readyState >= 2 && v.videoWidth){
      // cover
      const ar = v.videoWidth / v.videoHeight, tr = w / h;
      let sw = v.videoWidth, sh = v.videoHeight, sx = 0, sy = 0;
      if (ar > tr){ sw = v.videoHeight * tr; sx = (v.videoWidth - sw) / 2; }
      else { sh = v.videoWidth / tr; sy = (v.videoHeight - sh) / 2; }
      c.drawImage(v, sx, sy, sw, sh, x, y, w, h);
    } else {
      c.fillStyle = this.pal.sunk;
      c.fillRect(x, y, w, h);
      /* Keep the project name visible while its image is loading or unavailable. */
      const name = WORKS[i].label;
      if (name){
        c.fillStyle = this.pal.ink3;
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = `500 ${Math.round(clamp(w * 0.085, 12, 22))}px ${UI}`;
        c.fillText(name, x + w / 2, y + h / 2);
      }
    }
  }

  paintCard(c, card, x, y){
    const w = this.tileW, h = this.tileH;
    const size = Math.round(clamp(this.tileW * 0.115, 17, 34));
    const label = t(card, 'text');
    c.fillStyle = this.pal.ink;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `500 ${size}px ${UI}`;
    const cx = x + w / 2, cy = y + h / 2;
    c.fillText(label, cx, cy);
    // the mark's asterisk, used once, as the only ornament on the plane
    c.font = `400 ${Math.round(size * 0.8)}px ${UI}`;
    c.fillStyle = this.pal.ink;
    c.fillText('*', cx, cy - size * 1.35);

    const tw = Math.max(size * 4.2, c.measureText(label).width);
    return { x: cx - tw / 2 - 12, y: cy - size * 2.1, w: tw + 24, h: size * 3.4 };
  }

  /* ── pass 2 · the cursor grid ─────────────────────────────────────── */
  drawGrid(){
    const ctx = this.ctx, dpr = this.dpr;
    // nothing to copy when drawPlane already drew here
    if (BARE) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // same as in drawPlane: the clear is the discard hint, not waste
    ctx.clearRect(0, 0, this.cv.width, this.cv.height);
    ctx.drawImage(this.buf, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.reduced) return;
    if (this.edgeGrid) return NOGRID ? undefined : this.edgeGrid_(ctx);
    if (this.mx < -9998) return;

    // The type is punched out of the overlay entirely. Akif's note: the grid
    // must not break the words apart when the cursor passes over them — same
    // rule as the last build, where nothing was ever allowed to cross a word.
    ctx.save();
    this.clipType(ctx);
    const B = GRID_BOX, R = GRID_R * this.spread;
    const gx0 = Math.floor((this.mx - R) / B) * B;
    const gx1 = Math.ceil((this.mx + R) / B) * B;
    const gy0 = Math.floor((this.my - R) / B) * B;
    const gy1 = Math.ceil((this.my + R) / B) * B;

    const dots = [];
    for (let x = gx0; x <= gx1; x += B){
      if (x + B < 0 || x > this.w) continue;
      for (let y = gy0; y <= gy1; y += B){
        if (y + B < 0 || y > this.h) continue;
        const d = Math.hypot(x + B / 2 - this.mx, y + B / 2 - this.my);
        const s = Math.pow(1 - clamp(d / R, 0, 1), GRID_FALL);
        if (s < 0.004) continue;
        const inset = B * s;
        const src = B - inset;
        if (src > 0.5){
          ctx.drawImage(
            this.buf,
            (x + inset / 2) * dpr, (y + inset / 2) * dpr, src * dpr, src * dpr,
            x, y, B, B
          );
        }
        dots.push([x, y, s]);
      }
    }
    ctx.fillStyle = this.pal.ink;
    for (const [x, y, s] of dots){
      ctx.globalAlpha = DOT_ALPHA * s;
      ctx.beginPath();
      ctx.arc(x, y, B * 0.15 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  /* ── pass 2b · the peripheral grid ────────────────────────────────────
     The touch build's edge treatment. The lattice is fixed to the frame, not
     to a pointer, so it reads as a viewfinder the plane moves behind rather
     than as a cursor effect with no cursor. Strength is zero across the sharp
     centre and ramps to EDGE_MAX at the corners of the image circle — the
     same radial law the blur used, so the frame falls off the way it always
     did; it is only what it falls off INTO that changed. */
  edgeGrid_(ctx){
    const B = GRID_BOX, dpr = this.dpr;
    const cx = this.w / 2, cy = this.h / 2;
    const half = Math.hypot(this.w, this.h) / 2;
    // centre the lattice on the frame so the four corners agree
    const x0 = cx - Math.ceil(cx / B) * B;
    const y0 = cy - Math.ceil(cy / B) * B;

    ctx.save();
    this.clipType(ctx);
    const dots = [];
    for (let x = x0; x < this.w; x += B){
      for (let y = y0; y < this.h; y += B){
        const d = Math.hypot(x + B / 2 - cx, y + B / 2 - cy) / half;
        const s = Math.pow(clamp((d - EDGE_START) / (1 - EDGE_START), 0, 1), EDGE_FALL);
        if (s < 0.004) continue;
        const inset = B * s * EDGE_MAX;
        const src = B - inset;
        if (src > 0.5){
          ctx.drawImage(
            this.buf,
            (x + inset / 2) * dpr, (y + inset / 2) * dpr, src * dpr, src * dpr,
            x, y, B, B
          );
        }
        dots.push([x, y, s]);
      }
    }
    /* One path and one fill per alpha step, not per dot. Every dot carried its
       own globalAlpha, which is what forced sixty-eight separate fills — and a
       fill is a draw call whether it covers a screen or a three pixel circle,
       so on a phone that was most of what this lattice cost. Six steps across
       an effect that tops out at thirty per cent opacity, on dots two to six
       pixels wide: the banding is below anything an eye resolves, and the call
       count divides by ten. */
    ctx.fillStyle = this.pal.ink;
    const bucket = new Map();
    for (const d of dots){
      const k = Math.max(1, Math.round(d[2] * EDGE_STEPS));
      (bucket.get(k) || bucket.set(k, []).get(k)).push(d);
    }
    for (const [k, group] of bucket){
      ctx.globalAlpha = EDGE_DOT * (k / EDGE_STEPS);
      ctx.beginPath();
      for (const [x, y, s] of group){
        const r = B * 0.115 * s;
        ctx.moveTo(x + r, y);              // or the arcs join into one outline
        ctx.arc(x, y, r, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  /** Clips to everything EXCEPT the text cards, with a soft rounded hole. */
  clipType(ctx){
    const p = new Path2D();
    p.rect(0, 0, this.w, this.h);
    for (const r of (this._cardRects || [])){
      const x = r.x - 8, y = r.y - 6, w = r.w + 16, h = r.h + 12;
      const rad = Math.min(22, h / 2);
      if (p.roundRect) p.roundRect(x, y, w, h, rad);
      else p.rect(x, y, w, h);
    }
    ctx.clip(p, 'evenodd');
  }

  /* ── the edge of the glass ──────────────────────────────────────────
     Everything already on the canvas is re-sampled small, blurred, masked to
     the outside of the image circle and laid back over itself. It goes last
     on purpose: a lens softens the corner of the whole frame, films, type,
     brackets and all — not one layer of it. */
  softenEdges(){
    if (this.edgeGrid) return;          // the periphery is carrying the grid
    const ctx = this.ctx, b = this.bl;
    const bw = this.blurCv.width, bh = this.blurCv.height;
    if (bw < 4 || bh < 4) return;

    b.setTransform(1, 0, 0, 1, 0, 0);
    b.globalCompositeOperation = 'copy';
    if ('filter' in b) b.filter = `blur(${BLUR_PX}px)`;
    b.drawImage(this.cv, 0, 0, bw, bh);
    if ('filter' in b) b.filter = 'none';

    b.globalCompositeOperation = 'destination-in';
    b.drawImage(this.maskCv, 0, 0);
    b.globalCompositeOperation = 'source-over';

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.blurCv, 0, 0, this.cv.width, this.cv.height);
  }

  drawTrackers(dt, target){
    const ctx = target || this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.save();
    this.clipType(ctx);
    this.trackers.draw(ctx, this.reduced ? 0 : dt, this._tileRects || []);
    ctx.restore();
  }
}
