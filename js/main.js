// ══ portfolio · orchestration ═══════════════════════════════════════════════
// mark → iPod → (press play) → digicam → the canvas of work → pages.

// scene.js is NOT imported statically. It pulls three.js (1.3 MB) behind it,
// and the lite path never renders a polygon — a static import would make every
// phone on the planet download a renderer it will not use. See LITE below.
import { WorkCanvas } from './canvas.js';
// the same table the canvas draws from, so a tile and its panel cannot drift
import { WORKS } from './data.js';
/* Two languages, one document. The English is the markup itself — see
   js/i18n.js — so this import is only the parts that are not in it: t() for a
   field off WORKS, s() for a string this file builds, applyLang() for the rest. */
import { applyLang, lang, t, s, pickLang } from './i18n.js';

let S = null;                       // the scene module, once asked for
let ipodModel = null, camModel = null;   // in flight from the moment it is
const landed = { ipod: null, cam: null };   // ...and here once they arrive

const $ = id => document.getElementById(id);
const body      = document.body;
const markWrap  = $('mark');
const glCanvas  = $('gl');
const workWrap  = $('work');
const hint      = $('hint');
const skipBtn   = $('skip');
const theme     = $('theme');
/* `theme` above is the <audio> element — it matches <audio id="theme"> and is
   not the colour theme. The colour scheme is `mode` everywhere below. */
const setBtn    = $('settingsBtn');
const setPanel  = $('settingsPanel');
const modeBtn   = $('themeBtn');
const volRange  = $('volRange');
const vig       = $('vig');
const flashEl   = $('flash');

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ── ?fps, the half that is not the canvas ───────────────────────────────
   The meter in js/canvas.js only lives while the plane is running, and the
   stutter turned out to be on the section pages too — where the plane is
   stopped outright and nothing is being drawn at all. Three rounds of shaving
   canvas work went at the wrong thing because of that blind spot.
   So this is the other half, and it runs everywhere: how far apart the
   browser's own frames land, and what blocked the main thread when they slip.
   `longtask` is the entry a browser raises for work that held the thread for
   more than fifty milliseconds, which is what a dropped frame is made of — and
   it names the source instead of leaving it to be guessed at, which is the
   whole point after this many guesses. Both are inert without ?fps. */
if (new URLSearchParams(location.search).has('fps')) (() => {
  const box = document.createElement('pre');
  box.style.cssText = 'position:fixed;right:8px;top:8px;z-index:9999;margin:0;'
    + 'padding:6px 8px;background:#000c;color:#ff0;font:11px/1.35 ui-monospace,monospace;'
    + 'border-radius:6px;pointer-events:none;white-space:pre;text-align:right';
  addEventListener('DOMContentLoaded', () => document.body.appendChild(box), { once: true });

  const gaps = [];
  let long = 0, worst = 0, who = '', prev = 0, painted = 0;
  try {
    new PerformanceObserver(list => {
      for (const e of list.getEntries()){
        long++;
        if (e.duration > worst){ worst = e.duration; who = (e.attribution?.[0]?.name) || e.name || '?'; }
      }
    }).observe({ entryTypes: ['longtask'] });
  } catch (e) { who = '(longtask tidak didukung)'; }

  const tick = (now) => {
    requestAnimationFrame(tick);
    if (prev){ gaps.push(now - prev); if (gaps.length > 90) gaps.shift(); }
    prev = now;
    if (now - painted < 250 || !box.isConnected) return;
    painted = now;
    const sorted = [...gaps].sort((a, b) => a - b);
    const mid = sorted[sorted.length >> 1] || 0;
    const max = sorted[sorted.length - 1] || 0;
    box.textContent =
      `HALAMAN\n` +
      `frame ${mid ? (1000 / mid).toFixed(0) : 0}/dtk  (${mid.toFixed(1)}ms)\n` +
      `terburuk ${max.toFixed(0)}ms\n` +
      `blok >50ms: ${long}  maks ${worst.toFixed(0)}ms\n` +
      `${who}`;
  };
  requestAnimationFrame(tick);
})();

/* ── the lite path ───────────────────────────────────────────────────────
   A touch device gets the mark and then the canvas of work, and nothing in
   between: no three.js, no PMREM, no 3.3 MB of models. Akif's call. The two
   acts are the best thing on the desktop site and the worst thing to ask a
   phone for — two glb loads and an environment bake before a visitor on
   cellular has seen a single film.
   `?full` forces the whole sequence on a phone, for checking it there. */
const LITE = matchMedia('(pointer: coarse)').matches
             && !/[?&]full(&|=|$)/.test(location.search);

/* ── audio ──────────────────────────────────────────────────────────────
   Muted playback is always permitted, so the track rolls muted and the user's
   gesture only has to unmute it — but it starts rolling AFTER `load`, not on
   the first frame, because those bytes were racing the models for the one
   connection that matters. See main() below.
   goAudible() is single-flight — two overlapping attempts once corrupted the
   saved mute state and left the track silent *and* paused. Never disarm
   except on confirmed success. */
theme.volume = 0;
theme.muted = true;
let audioArmed = false, audioBusy = false, audioOn = false;
/* There is no separate mute flag any more. `level` below carries it: a visitor
   who wants silence drags the slider to zero, and every path to sound — the
   skip button, the gesture net, the end of the sequence — aims at `level`, so
   silence survives all of them without a second variable to keep in step. */

function rollMuted(){
  theme.play().catch(() => { /* even muted can be refused; the gesture retries */ });
}
/* Where the track sits once it is up. It was a constant while the only choice
   was on or off; the slider makes it a setting, so the ramp and the backstop
   below both aim at whatever the visitor last left it at. */
/* 0.66, and it has survived two changes of track because the level is matched
   to the slider rather than the other way round: every track that has gone in
   here was normalised to the same integrated loudness on the way, so the room
   sounds as loud as it always did and this number never has to move. */
let level = 0.66;
async function goAudible(){
  if (audioBusy) return audioOn;
  /* "already on" has to mean audible, not merely flagged. The ramp below is the
     only thing that ever lifts the volume off zero, and it runs on frames — a
     tab throttled or hidden through its 1400ms gets none, and the track is then
     playing at a volume of nothing with audioOn true. Returning here would hand
     that back as success, and every later unmute would flip the flag over
     silence: a toggle that does exactly what it says and cannot be heard. */
  if (audioOn && theme.volume > 0) return audioOn;
  audioBusy = true;
  try {
    theme.muted = false;
    await theme.play();
    audioOn = true;
    // ease the level up rather than slamming it in
    const t0 = performance.now();
    const ramp = (now) => {
      // rAF hands you the timestamp of the START of the frame, which can
      // predate the performance.now() that scheduled it — an unclamped p goes
      // negative, the cube flips sign, and setting a negative volume throws.
      const p = Math.max(0, Math.min(1, (now - t0) / 1400));
      theme.volume = level * (1 - Math.pow(1 - p, 3));
      if (p < 1) requestAnimationFrame(ramp);
    };
    requestAnimationFrame(ramp);
    // frames are the fade, not the destination: if none arrive, the track still
    // has to end up somewhere a person can hear
    setTimeout(() => { if (theme.volume < level) theme.volume = level; }, 1500);
  } catch (err) {
    theme.muted = true;
    theme.volume = 0;
    rollMuted();                       // keep buffering, stay armed
  } finally {
    audioBusy = false;
  }
  return audioOn;
}
/* Hold the track back until the things a visitor can actually SEE have landed,
   then let it buffer. The full path only: it has models to wait behind, a
   connection wide enough to be worth pre-filling, and a sequence long enough
   that the music has somewhere to arrive. The touch path buffers nothing and
   waits for a gesture — see lite().
   allSettled and the second handler because a model that fails to download must
   not also cost the visitor the music. */
let buffering = false;
function bufferTrackAfter(...waits){
  if (buffering) return;
  buffering = true;
  const go = () => { if (!skipped) rollMuted(); };
  Promise.allSettled(waits).then(go, go);
}

// a late safety net: if the intro was skipped by an odd path, any first
// gesture still lights the track. Removed only on confirmed success.
function armGlobalGesture(){
  if (audioArmed) return;
  audioArmed = true;
  const go = async () => {
    const ok = await goAudible();
    if (ok){
      window.removeEventListener('pointerdown', go);
      window.removeEventListener('keydown', go);
      window.removeEventListener('touchend', go);
    }
  };
  window.addEventListener('pointerdown', go);
  window.addEventListener('keydown', go);
  window.addEventListener('touchend', go);
}

/* ── routing ────────────────────────────────────────────────────────── */
/* The table is read off the document rather than written twice: every
   <section class="page" id="pageXxx"> is the route "xxx". A new section is
   then markup only — an id that drifts from a nav href simply routes nowhere,
   which is visible the first time anyone clicks it. */
const pages = Object.fromEntries(
  [...document.querySelectorAll('.page[id^="page"]')]
    .map(el => [el.id.slice(4).toLowerCase(), el])
);
const navLinks = document.querySelectorAll('.nav__a');
const navBtn   = $('navBtn');
let lastStage = 'work';

/* ── the exposure ────────────────────────────────────────────────────────
   Retriggering a CSS animation needs the class off, a reflow, and the class on
   again — without the reflow the browser coalesces all three into no change at
   all, and the second section you open never flashes. */
/* The class comes off on a timer, not on animationend. It never used to come
   off at all — only the NEXT expose() removed it — which was harmless while it
   carried nothing but an animation. Now it also carries display:block, and a
   class that sticks would leave the flash a live full-screen layer for the
   rest of the visit: the exact thing this was changed to stop.
   A timer rather than the event because the event is the fragile half. An
   animation that is interrupted, or never starts because the element was in a
   state that could not run it, fires nothing — and the failure mode of a
   missing animationend here is strictly worse than the problem it was meant to
   solve. 500 against the animation's 420 leaves room and costs nothing. */
let flashOff = 0;

/* The shutter. It began inside expose() so the flash and the sound could not
   drift apart, and it is a function now for the same reason rather than the
   opposite one: there are two moments a photograph is taken here, and two call
   sites that each knew how to make the noise would be the drift that comment
   was guarding against. One place knows how.
   The trim matters more than it reads. The file this was cut from ran 1.07
   seconds and carried 297ms of silence before its first transient, which is a
   shutter arriving a third of a second after its flash. WAV and not mp3 for
   exactly that reason as well: an mp3 carries encoder padding at the head, and
   that is the same silence put back on every single play.
   preload, on eighteen kilobytes: the whole job of this sound is to land on
   the same frame as the flash, and a sound that arrives late is worse than one
   that never arrives. Full rate rather than the half rate the synthesised one
   used — an eighth of this one's energy sits above 11 kHz, and that is the
   snap; at 22.05k it is a thud. */
const shutter = new Audio('./assets/audio/snap.wav');
shutter.preload = 'auto';

/* Off the same slider as the music, and silent at zero: a visitor who turned
   the sound off turned ALL of it off, and a click they cannot stop would be
   the rudest thing on the page. Scaled under the bed because a transient reads
   louder than its peak suggests next to a drone.
   `reduced` lives here and not only in expose(), so the quiet this promises
   holds at the other call site too: someone who asked for less motion gets
   neither the strobe nor the noise, wherever the press came from.
   currentTime first, so pressing quickly restarts the click instead of
   stacking copies of it. play() can still be refused — applyRoute runs once on
   load, before any gesture exists — and a refused shutter is nothing to
   report. */
function snap(){
  if (reduced || level <= 0) return;
  shutter.volume = Math.min(1, level * 0.45);
  shutter.currentTime = 0;
  shutter.play().catch(() => {});
}

function expose(){
  if (reduced) return;
  flashEl.classList.remove('is-fire');
  void flashEl.offsetWidth;
  flashEl.classList.add('is-fire');
  clearTimeout(flashOff);
  flashOff = setTimeout(() => flashEl.classList.remove('is-fire'), 500);
  snap();
}

function labelNav(r){
  const k = r || 'menu';
  navBtn.textContent = s('nav.' + k, k);
}
function routeFromHash(hash = location.hash){
  // Ordinary anchors work without JS; legacy #/about links still work too.
  const h = (hash || '').replace(/^#\/?/, '').replace(/^page/, '').toLowerCase();
  return Object.hasOwn(pages, h) ? h : '';
}
/* Ignore duplicate hashchange/popstate events. Each new route invalidates older
   transitions before they can hide, show, focus, or stop the current page. */
let appliedRoute = null;
let routeVersion = 0;
async function applyRoute(){
  const r = routeFromHash();
  if (r === appliedRoute) return;
  appliedRoute = r;
  const version = ++routeVersion;
  /* Opening a section ends the intro and frees its WebGL resources. */
  if (r) endIntro();
  // and going the other way the plane has to be alive BEFORE the page above it
  // starts to fade, or it is revealed as a frozen still. `workHeld` is the lite
  // path holding the canvas back under the mark — see ensureWork — and it wins.
  else if (work && !workHeld){ workWrap.hidden = false; work.start(); }
  for (const a of navLinks){
    const on = routeFromHash(a.hash) === r;
    a.classList.toggle('is-on', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
  /* On a narrow screen the bar is behind a button, so the button has to say
     which section you are in — otherwise the only thing telling you is hidden
     inside the thing you have not opened. "menu" is the honest word for home,
     where no section is current. */
  labelNav(r);
  openNav(false);
  // A route may return to a section whose previous closing timer is pending.
  if (r) pages[r].classList.remove('is-shut');
  for (const [name, el] of Object.entries(pages)){
    if (name === r) continue;
    if (!el.hidden){
      /* is-shut closes the aperture over the section on its way out, on the
         260ms this already waited. Removed again on the far side: it holds its
         last frame, so a section left carrying it would open next time from a
         shutter that is already shut and never animate at all. */
      el.classList.remove('is-lit');
      el.classList.add('is-shut');
      await sleep(reduced ? 0 : 260);
      if (version !== routeVersion) return;
      el.hidden = true;
      el.classList.remove('is-shut');
    }
  }
  if (r){
    const el = pages[r];
    /* Pause the canvas while a full-screen section covers it. */
    if (work) work.stop();
    /* And the layer itself, once the page above has finished arriving. stop()
       only halts the loop; the container and its 617x1230 canvas stayed in the
       layer tree behind an opaque sheet of paper, composited every frame for a
       picture nobody can see. Not immediately: the page fades in over t-mid,
       and for those frames the plane is genuinely still visible underneath.
       The route is re-read when the timer fires because another hash change
       may have landed in the meantime, and hiding the plane on the way back to
       it would be worse than never hiding it at all. */
    setTimeout(() => {
      if (version === routeVersion && routeFromHash()) workWrap.hidden = true;
    }, reduced ? 0 : 700);
    /* Ahead of the section being shown, not after: the flash has to cover the
       swap, which is the one frame where the outgoing section is gone and the
       incoming one has not painted. */
    expose();
    el.hidden = false;
    void el.offsetWidth;
    el.classList.add('is-lit');
    body.dataset.stage = 'page';
    /* A section heading receives programmatic focus without entering the Tab order. */
    const heading = el.querySelector('.page__t');
    if (heading){ heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  } else if (body.dataset.stage === 'page'){
    body.dataset.stage = lastStage;
    work?.cv.focus({ preventScroll: true });
  }
}
window.addEventListener('hashchange', applyRoute);
document.querySelectorAll('[data-back]').forEach(b => {
  b.addEventListener('click', () => { history.pushState(null, '', location.pathname + location.search); applyRoute(); });
});
window.addEventListener('popstate', applyRoute);

/* ── the canvas of work ─────────────────────────────────────────────────
   Built and running well before it is seen: the digicam's monitor is
   textured with this very canvas, so what plays on the screen is the page
   itself rather than a preview of it, and the hand-off is not a cut. */
let work = null, workShown = false, workHeld = false;

/* Preload the work media under the lite intro, but hold its render loop until
   the gallery is revealed. Current works are five still images. */
function ensureWork(){
  if (work) return work;
  work = new WorkCanvas($('cv'), {
    onRoute: (r) => { location.hash = '#/' + r; },
    // a tile is a photograph, so opening one is a press worth hearing. The
    // card beside it already sounded: it changes route, and every route change
    // runs expose(). This was the only silent press left on the plane.
    onWork: (i) => { snap(); openWork(i); },
    onFirstDrag: () => { hint.classList.add('is-gone'); }
  });
  if (!workHeld) work.start();
  /* A phone fires resize for every step of the URL bar sliding away, and each
     one reallocates four canvases. Coalesce to one per frame. */
  let pending = 0;
  const onResize = () => {
    if (pending) return;
    pending = requestAnimationFrame(() => { pending = 0; work.resize(); });
  };
  window.addEventListener('resize', onResize, { passive:true });
  window.addEventListener('orientationchange', onResize, { passive:true });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize, { passive:true });
  return work;
}

function showWork(){
  ensureWork();
  workHeld = false;
  work.start();                      // idempotent; releases a held canvas
  if (workShown) return;
  workShown = true;
  workWrap.hidden = false;
  lastStage = 'work';
  body.dataset.stage = 'work';
  body.classList.remove('is-dark');
  setTimeout(() => hint.classList.add('is-lit'), 500);
  setTimeout(() => hint.classList.add('is-gone'), 7500);
}

/* ── the vignette ───────────────────────────────────────────────────────
   Full through the mark and the iPod, lifting as the frame closes in, gone
   by the time the page is the page. Driven off the acts' own progress, so a
   slow machine never leaves it stranded. */
let vigOff = false;
function dim(v){
  const c = Math.max(0, Math.min(1, v));
  vig.style.opacity = c.toFixed(3);
  const off = c <= 0.002;
  if (off !== vigOff){ vigOff = off; vig.hidden = off; }
}

/* ── the run ────────────────────────────────────────────────────────── */
let gl = null, ipod = null, cam = null, skipped = false;
/* The act between the two. `ipod` is dropped the instant the press lands, so a
   second press cannot arrive — but the act itself is still on screen for the
   length of its exit, and finish() has to be able to reach it there. The exit
   is settled by a frame, and finish() is the thing that stops the frames. */
let leaving = null;

const vignetteDriver = {
  tick(){
    if (cam)  dim(0.82 * (1 - cam.zoomed));
    else if (ipod) dim(1 - 0.18 * ipod.landed);
  }
};

async function main(){
  armGlobalGesture();
  /* Audio buffering waits behind the desktop models. Touch devices fetch the
     track only after a gesture; goAudible() starts playback itself. */

  // fonts must be resident before anything paints canvas type
  try {
    await Promise.race([
      Promise.all([
        // VCR is now the only webfont on the page. The body face comes from
        // the operating system, which is resident before the first byte of
        // this file arrives — asking fonts.load() for it would REJECT, and a
        // rejected Promise.all abandons the VCR load with it, which is how
        // the iPod's screen ends up painted in fallback monospace.
        LITE ? Promise.resolve() : document.fonts.load('400 40px "VCR OSD Mono"')
      ]),
      sleep(2500)
    ]);
  } catch (e) { /* fall back to the stack in the font-family list */ }

  /* Direct section links end the intro before any scene import or model fetch. */
  if (skipped) return;

  if (!LITE){
    S = await import('./scene.js');
    if (skipped) return;
    gl = new S.GL(glCanvas);
    gl.acts.push(vignetteDriver);
    gl.start();
    // both models start downloading now and are awaited where they are used,
    // so the camera is resident long before anyone presses play
    ipodModel = loadIntroModel('ipod', './assets/models/ipod.glb');
    camModel  = loadIntroModel('cam', './assets/models/camera.glb');
    bufferTrackAfter(ipodModel, camModel);   // the music goes last
    ipodModel.catch(() => {}); camModel.catch(() => {});
  }

  /* The opening mark is a still image with a CSS loading ring. */
  // Prepare the lite canvas while holding its render loop — see workHeld.
  if (LITE){ workHeld = true; setTimeout(ensureWork, 2600); }

  /* ── how long the mark stays ───────────────────────────────────────────
     The clip used to answer this itself: play it, wait for `ended`, and keep a
     clock and a stall probe around for the three ways a phone refuses to play
     video at all. A still cannot fail that way, so all of it is gone — and the
     wait can now be spent on the thing that is genuinely slow. The two glb
     models are already in flight above; the ring turns until they land.

     A floor because a loader that flashes for 200ms reads as a glitch, and a
     ceiling because a model that never arrives must not hold the door. On the
     lite path there are no models to wait for, so the floor is the whole beat. */
  const FLOOR = reduced ? 300 : 1300;
  const CEIL  = reduced ? 900 : 5600;
  /* Both models, and then the GPU work they imply: shaders compiled and
     textures uploaded while the ring is still turning. three.js would
     otherwise do it on the first frame each act is drawn — which for the
     digicam is a 200-760ms stall landing on the cut into it. The mark is
     already a wait; this is the right wait to hide it in. */
  const loaded = LITE ? Promise.resolve()
                      : Promise.allSettled([ipodModel, camModel]).then(r => {
                          if (skipped) return;
                          /* Dressed BEFORE the warm-up, never after — and this
                             is the whole reason S.dress() is a function rather
                             than the traverse it used to be inside IpodAct.
                             warm() compiles the material a mesh is WEARING when
                             it draws it, and the act re-materialises the shell
                             from standard to physical: clearcoat is a define,
                             so it is a different program. Warming the model
                             undressed bought a shader the act never used and
                             left the real one to link on the act's own first
                             frame. Measured at that cut: 75ms, on a driver that
                             already had the shaders cached from an earlier run.
                             Here it lands inside the mark instead, where the
                             ring is a CSS transform and does not care that the
                             main thread is busy. */
                          if (r[0].status === 'fulfilled') S.dress(r[0].value);
                          return S.warm(gl, ...r.filter(x => x.status === 'fulfilled')
                                                .map(x => x.value));
                        });
  const markDone = Promise.all([
    sleep(FLOOR),
    Promise.race([loaded, sleep(CEIL)])
  ]);
  await markDone;
  if (skipped) return;

  markWrap.classList.add('is-out');
  skipBtn.classList.add('is-lit');
  await sleep(reduced ? 20 : 480);
  markWrap.hidden = true;
  if (skipped) return;

  if (LITE) return lite();

  // ── the iPod
  let model;
  try { model = await ipodModel; }
  catch (e){ console.warn('ipod failed to load', e); return finish(); }
  if (skipped) return;

  ipod = new S.IpodAct(gl, model);
  gl.acts.push(ipod);
  gl.resize();
  body.classList.add('is-dark');
  body.dataset.stage = 'ipod';
  glCanvas.classList.add('is-lit', 'is-live');
  ipod.begin();
  // let the entrance settle before drawing the work canvas behind it
  setTimeout(ensureWork, 3000);

  // drag to turn it, exactly as the PSP turned on the last site; a tap on
  // the wheel's play glyph is a press, a drag is not.
  glCanvas.addEventListener('pointerdown', e => {
    if (!ipod) return;
    glCanvas.setPointerCapture(e.pointerId);
    ipod.grabAt(e.clientX, e.clientY);
    glCanvas.classList.add('is-turning');
  });
  glCanvas.addEventListener('pointermove', e => {
    if (!ipod) return;
    if (!ipod.moveTo(e.clientX, e.clientY)){
      glCanvas.classList.toggle('is-hot', ipod.hover(e.clientX, e.clientY));
    }
  });
  const lift = async (e) => {
    if (!ipod) return;
    const travelled = ipod.release();
    glCanvas.classList.remove('is-turning');
    if (travelled > 7) return;                       // that was a turn
    if (!ipod.press(e.clientX, e.clientY)) return;
    glCanvas.classList.remove('is-hot');
    await goAudible();
    toCamera().catch(failIntro);
  };
  glCanvas.addEventListener('pointerup', lift);
  glCanvas.addEventListener('pointercancel', () => { if (ipod) ipod.release(); glCanvas.classList.remove('is-turning'); });
}

async function toCamera(){
  if (skipped) return;
  const act = ipod;
  ipod = null;
  leaving = act;
  glCanvas.classList.remove('is-live', 'is-hot');
  await act.intoScreen(reduced ? 90 : 1400);
  leaving = null;
  /* Skip can land inside that await, and finish() drops `gl` when it does.
     `act` was detached from `ipod` at the top of this function, so finish()
     never saw it and these two lines are the only thing that will free it —
     they have to run either way, and only the list needs the guard. */
  if (gl) gl.acts = gl.acts.filter(a => a !== act);
  act.dispose();
  if (skipped) return;

  let model;
  try { model = await camModel; }
  catch (e){ console.warn('camera failed to load', e); return finish(); }
  if (skipped) return;

  cam = new S.CameraAct(gl, model, ensureWork().cv, {
    /* And the paper comes up AFTER the camera, never before it — and not
       alongside it either, which is where this started. The line used to sit
       above the act, lighting the page white while the camera was still at
       nothing: the black thrown away a frame after arriving at it, and a room
       lit for an act that had not begun.
       Moving it below was not enough. The body now arrives by being LIT rather
       than by being blended in (see CameraAct.begin), and a half-lit camera
       over white paper is a black cut-out, not something on its way in. So it
       arrives out of the black the iPod left behind, and the room comes up
       once it is all the way there. Three beats, in the order they read. */
    onLit: () => body.classList.remove('is-dark'),
    // the plane goes up underneath only once the monitor's edges ARE the
    // viewport's edges; the camera's own fade is then the cross-dissolve
    onReveal: () => { showWork(); skipBtn.classList.remove('is-lit'); },
    onDone: finish
  });
  gl.acts.push(cam);
  gl.resize();
  /* A beat of nothing at all. The screen went black and then the iPod that
     held it went away, and holding that black for a moment is what makes the
     join read as a cut: the digicam arrives OUT of the black rather than over
     the top of something still leaving. Short — long enough to register as a
     held frame, not long enough to read as a page that has stopped working.

     And the beat has a second job, which is why the act is now built at the
     top of it rather than at the end. This act does not use the materials
     warm() compiled: it clones every one of them and puts a basic material on
     the monitor. Measured at this cut, that is seven programs linked on the
     act's first frame — 71ms of compile and an 84ms first draw here, and
     1208ms for that frame on a driver that had never seen the shaders. It
     lands on a cut, which is the worst place a stall can land.
     The room first, because which room is lit is part of what gets compiled.
     compileAsync goes through KHR_parallel_shader_compile, so the link waits
     off the main thread; what is left runs inside a held black frame, where
     there is nothing moving for it to interrupt. The two waits are one wait.
     This reaches through `gl` for the renderer, which nothing else in this
     file does — it belongs on the act, next to begin(). It is here because
     js/scene.js was being edited elsewhere when this was written. */
  gl.look('studio');
  await Promise.all([
    sleep(reduced ? 40 : 260),
    gl.renderer.compileAsync(gl.scene, gl.camera).catch(() => {})
  ]);
  if (skipped) return;

  cam.begin();
}

/* On the lite path, reveal the canvas and ease away the vignette. */
function lite(){
  /* Touch devices fetch audio on the first gesture, through goAudible(). */
  glCanvas.hidden = true;
  skipBtn.classList.remove('is-lit');
  showWork();
  /* Here rather than inside showWork(): the desktop path calls that too, and
     there the plane is already being revealed by the camera's own monitor
     closing in on the viewport. An aperture over the top of that would be two
     reveals fighting. This path has nothing, which is the whole point. */
  workWrap.classList.add('is-iris');
  const t0 = performance.now(), D = reduced ? 1 : 1000;
  const ease = (now) => {
    const p = Math.max(0, Math.min(1, (now - t0) / D));
    dim(0.82 * (1 - p * p * (3 - 2 * p)));
    if (p < 1) requestAnimationFrame(ease);
  };
  requestAnimationFrame(ease);
  applyRoute();
}

function finish(){
  skipped = true;
  // whoever is mid-exit is waiting on a frame that is about to stop coming;
  // let it go first, and the teardown behind its await runs a tick later
  if (leaving){ leaving.abort(); leaving = null; }
  if (cam){ gl.acts = gl.acts.filter(a => a !== cam); cam.dispose(); cam = null; }
  if (ipod){ gl.acts = gl.acts.filter(a => a !== ipod); ipod.dispose(); ipod = null; }
  /* The models, which are not the acts. warm() draws BOTH of them one frame
     before either becomes an act, so skipping during the iPod uploads the whole
     camera and then never builds a CameraAct to dispose it — 44k vertices of
     typed array and its textures, reachable only from the promise they arrived
     on. Measured on the skip path before this: 25 geometries left behind. */
  if (S){
    if (landed.ipod) S.release(landed.ipod);
    if (landed.cam)  S.release(landed.cam);
  }
  landed.ipod = landed.cam = null;
  ipodModel = camModel = null;
  /* And last, because it ends with the context: gl.stop() was all this used to
     do, which halted the loop and left everything already uploaded sitting in
     the driver — both models, both PMREM cubemaps and the context itself — for
     the rest of the visit, drawing nothing. There is no way back into the intro
     once it has finished, so none of it is being kept for later. Nulled as well
     as disposed: `finish()` is reachable twice, by skip and by the sequence
     ending on its own, and the reference is the guard. */
  if (gl){ gl.dispose(); gl = null; }
  glCanvas.classList.remove('is-lit', 'is-live', 'is-hot');
  glCanvas.hidden = true;
  skipBtn.classList.remove('is-lit');
  body.classList.remove('is-dark');
  dim(0);
  showWork();
  applyRoute();
}

// a handle for the verification harness — inert in normal use
window.__PORTFOLIO = {
  lite: LITE,
  get gl(){ return gl; }, get ipod(){ return ipod; },
  get cam(){ return cam; }, get work(){ return work; },
  /** hold an act at a fixed moment so a frame can be captured deterministically */
  freeze(act, ms){
    const a = act === 'cam' ? cam : ipod;
    if (!a) return false;
    a.freeze = ms; a.running = true;
    if (a.rig) a.rig.visible = true;
    return true;
  },
  seek(act, ms){
    const a = act === 'cam' ? cam : ipod;
    if (!a) return false;
    a.freeze = null;
    a.t0 = performance.now() - ms; a.running = true;
    if (a.rig) a.rig.visible = true;
    return true;
  }
};

/* Ending the intro is the same teardown whoever asks for it — the skip button,
   or a route arriving while the sequence is still running. */
function endIntro(){
  if (skipped) return;
  skipped = true;
  markWrap.classList.add('is-out');
  markWrap.hidden = true;
  finish();
}

// Keep arrived models reachable for teardown, and release late arrivals without
// warming or attaching them to a renderer that has already been disposed.
function loadIntroModel(kind, url){
  return S.load(url).then(model => {
    if (skipped){ S.release(model); return null; }
    landed[kind] = model;
    return model;
  });
}

function failIntro(error){
  console.warn('Intro unavailable; showing the portfolio.', error);
  endIntro();
}

// the click is also the gesture that is allowed to unmute the track
skipBtn.addEventListener('click', () => { endIntro(); goAudible(); });

/* If there is no track at all — the file pulled, or never replaced — the
   control for it cannot do anything. Take the row away rather than leave a
   visitor dragging it; the panel keeps its theme row. <audio> reports a src it
   could not load, so the page finds this out on its own. */
theme.addEventListener('error', () => {
  volRange.closest('.set__row').hidden = true;
});

/* ── remembered settings ─────────────────────────────────────────────────
   localStorage throws outright in some privacy modes rather than returning
   null, so every touch of it is wrapped. A visitor who cannot be remembered
   still gets working controls — they just start from the default each time. */
const remember = (k, v) => { try { localStorage.setItem('pf.' + k, v); } catch (e) {} };
const recall   = (k)    => { try { return localStorage.getItem('pf.' + k); } catch (e) { return null; } };

/* ── volume ──────────────────────────────────────────────────────────────
   The slider owns `level`. Setting theme.volume directly only does anything
   once the track is actually running, so the assignment is guarded — and the
   ramp and the backstop in goAudible() both read `level`, which is why moving
   the slider before any sound has started still lands at the right place. */
function applyVolume(pct, save){
  level = Math.max(0, Math.min(1, pct / 100));
  if (audioOn) theme.volume = level;
  volRange.value = String(Math.round(level * 100));
  if (save) remember('vol', volRange.value);
}
/* `level` above is the default, not a second copy of it. This line used to
   carry its own `?? 42`, so the number lived in three places — the declaration,
   this fallback, and the input's value attribute — and changing the first two
   did nothing at all, because this one runs last and wins. The attribute stays
   (it is what paints before any script runs); the rest reads from one place. */
applyVolume(Number(recall('vol') ?? level * 100), false);
/* Dragging is a gesture, so it is also allowed to start the track — which is
   what makes the left end a real mute rather than a setting for later. Leave a
   visit at zero and the slider is the only control that can undo it, and it has
   to work on the visit where nothing ever managed to play. */
volRange.addEventListener('input', () => {
  applyVolume(Number(volRange.value), true);
  if (level > 0) goAudible();
});

/* ── the colour scheme ───────────────────────────────────────────────────
   On <html data-theme>, not on body.is-dark: that class belongs to the intro
   sequencer, which turns it on and off per act. Only the tokens move — the
   stylesheet already reads them everywhere, and the canvas reads them too, so
   the plane changes colour with the page instead of staying a white hole. */
const MODES = ['light', 'dark'];
function applyMode(m, save){
  m = MODES.includes(m) ? m : 'light';
  document.documentElement.dataset.theme = m;
  modeBtn.textContent = s('mode.' + m, m);
  // the browser chrome around the page, on phones
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')){
    meta.content = m === 'dark' ? '#0e0e11' : '#ffffff';
  }
  // the canvas holds its colours as strings, so it has to be told to look again
  work?.readPalette?.();
  if (save) remember('mode', m);
}
const savedMode = recall('mode');
applyMode(savedMode ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'), false);
modeBtn.addEventListener('click', () => {
  applyMode(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true);
});
/* Only follow the system while the visitor has not chosen for themselves —
   once they have, the choice is theirs and the OS does not get to undo it. */
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!recall('mode')) applyMode(e.matches ? 'dark' : 'light', false);
});

/* ── the panel ───────────────────────────────────────────────────────────
   Plain, not a <dialog>: a modal would put the whole site behind a sheet to
   turn the volume down. It closes on Escape and on a press anywhere outside —
   the press that OPENS it is a pointerdown while the panel is still closed, so
   that handler sees nothing and there is no fight between the two. */
/* ── the navbar dropdown ─────────────────────────────────────────────────
   Same shape as the settings panel below, and for the same reasons: not a
   modal, closes on Escape or a press outside, and the press that OPENS it
   happens while the list is still closed so the two handlers never fight.
   It also closes on every route change — see applyRoute — because a menu that
   stays open over the section it just took you to is a menu in the way. */
function openNav(on){
  document.body.classList.toggle('nav-open', on);
  navBtn.setAttribute('aria-expanded', String(on));
}
navBtn.addEventListener('click', () => openNav(!document.body.classList.contains('nav-open')));
document.addEventListener('pointerdown', (e) => {
  if (!document.body.classList.contains('nav-open')) return;
  if (navBtn.contains(e.target) || document.getElementById('nav').contains(e.target)) return;
  openNav(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.body.classList.contains('nav-open')){
    openNav(false); navBtn.focus();
  }
});

function openSettings(on){
  setPanel.hidden = !on;
  setBtn.setAttribute('aria-expanded', String(on));
}
setBtn.addEventListener('click', () => openSettings(setPanel.hidden));
document.addEventListener('pointerdown', (e) => {
  if (setPanel.hidden) return;
  if (setPanel.contains(e.target) || setBtn.contains(e.target)) return;
  openSettings(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !setPanel.hidden){ openSettings(false); setBtn.focus(); }
});

/* ── certificates ────────────────────────────────────────────────────────
   The row links straight at the file, so with no JS a click opens it in a tab
   and nothing is lost. With JS it opens here instead — a new tab carries no
   history, and back was never a button the visitor had. */
/* ── a project, opened in place ──────────────────────────────────────────
   One panel, two ways in: a tile on the canvas, or a card in `works`. Both
   land here, and both read WORKS — so the explanation lives beside the tile it
   explains and there is no second copy to forget to update. */
/* NOT id="work" — <main class="work" id="work"> is the canvas of work, and
   getElementById would have handed that back instead. It has no showModal, so
   the guard below simply refused to arm and nothing said why. */
// a bad url must not take the panel down with it — URL() throws on anything
// it cannot parse, and this runs while a visitor is opening a project
function hostOf(u){
  try { return new URL(u).hostname; } catch (e) { return ''; }
}
const workDlg = $('workPanel');
/* Which project is on screen, so that switching language while a panel is open
   rewrites it in place rather than leaving one section of the site in English
   until it is closed and reopened. -1 is "none", which is why the test below
   is `> -1` and not truthiness — index 0 is a real project. */
let lastWork = -1;
function openWork(i){
  const w = WORKS[i];
  if (!w || !workDlg?.showModal) return;
  lastWork = i;
  $('workShot').src = w.src;
  /* The note, not the label. The label is the <h2> directly underneath, so an
     alt of the same words made a reader say the project's name twice and never
     say what the screenshot actually shows. */
  $('workShot').alt = t(w, 'note') || w.label;
  $('workTitle').textContent = w.label;

  // year and role are optional and usually not known yet; an empty line is
  // worse than no line, so the row only exists when there is something in it
  const meta = [t(w, 'year'), t(w, 'role')].filter(Boolean).join(' · ');
  $('workMeta').textContent = meta;
  $('workMeta').hidden = !meta;

  $('workBlurb').textContent = t(w, 'blurb') || '';
  /* `line`, not `t` — t() is the translation helper now, and the parameter was
     shadowing it inside exactly the callback that needs it. */
  $('workPoints').replaceChildren(...(t(w, 'points') || []).map(line => {
    const li = document.createElement('li');
    li.textContent = line;
    return li;
  }));

  /* Same rule as the meta line: a project with no repo gets no link at all
     rather than one that goes nowhere. The label is read off the url instead
     of being fixed in the markup, so pointing a project at a live demo later
     does not leave it announcing a repo that is not there. */
  const link = $('workLink');
  link.href = w.href || '#';
  link.textContent = /(^|\.)github\.com$/.test(hostOf(w.href))
    ? s('wk.repo', 'open the repo on GitHub')
    : s('wk.open', 'open the project');
  $('workLinkRow').hidden = !w.href;

  workDlg.showModal();
}
/* The interactive gallery reads WORKS. tools/fallback.mjs uses the same data
   for the no-JS gallery; tools/check.mjs checks it and the canvas slots. */
function buildWorks(){
  const worksGrid = $('worksGrid');
  if (!worksGrid) return;
  worksGrid.replaceChildren(...WORKS.map(w => {
    const li = document.createElement('li');
    const b  = document.createElement('button');
    b.type = 'button'; b.className = 'grid__b'; b.dataset.work = w.label;

    const img = document.createElement('img');
    img.className = 'grid__img'; img.src = w.src; img.alt = '';
    /* NOT loading="lazy". These are built while `works` is still hidden, and an
       image inside display:none never intersects the viewport, so a lazy one is
       never asked for — the gallery stayed empty. Loading them anyway costs
       nothing: the canvas already fetches these exact five files for its tiles,
       so every one is a cache hit. */
    img.decoding = 'async';

    /* `title`, not `t`: t() is the translation helper, and a local const of
       that name shadowed it for the whole of this callback — including the
       three calls below it, which is a TDZ error rather than a wrong string. */
    const title = document.createElement('span');
    title.className = 'grid__t'; title.textContent = w.label;

    b.append(img, title);

    /* Reading order on a card: what it is called, what it is, then when and
       with whom. The meta line is the most incidental of the three, so it goes
       last rather than between the name and the sentence that explains it. */
    const note = t(w, 'note');
    if (note){
      const n = document.createElement('span');
      n.className = 'grid__d'; n.textContent = note;
      b.append(n);
    }
    // year and role only when they are known — an empty line reads as a fault
    const meta = [t(w, 'year'), t(w, 'role')].filter(Boolean).join(' · ');
    if (meta){
      const m = document.createElement('span');
      m.className = 'grid__m'; m.textContent = meta;
      b.append(m);
    }
    li.append(b);
    return li;
  }));
}

if (workDlg?.showModal){
  // the cards in `works` are buttons, not links — there is no url under a
  // project, only this panel
  document.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-work]');
    if (!b) return;
    const i = WORKS.findIndex(w => w.label === b.dataset.work);
    if (i > -1){ snap(); openWork(i); }
  });
  closeOnBackdrop(workDlg);
}

/* A click on the dialog element itself landed outside everything inside it —
   but only if it STARTED there too. The canvas opens a panel on pointerup, and
   the click that completes that same gesture then arrives at the panel it just
   opened, lands on the backdrop, and closes it before anyone sees it. Asking
   where the press began costs one flag and also fixes the older case: dragging
   a selection out of the dialog and letting go on the backdrop. */
function closeOnBackdrop(dlg){
  let downOnBackdrop = false;
  dlg.addEventListener('pointerdown', (e) => { downOnBackdrop = e.target === dlg; });
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg && downOnBackdrop) dlg.close();
  });
}

const certDlg  = $('cert');
const certView = $('certView');
const certOpen = $('certOpen');
if (certDlg?.showModal){
  document.addEventListener('click', (e) => {
    // by the file it points at, not by the class: contact uses .rows__a too,
    // and a mailto must not open in a viewer
    if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('.page a[href*="/certs/"]');
    if (!a) return;
    e.preventDefault();
    const src = a.getAttribute('href');
    certOpen.href = src;
    /* ponytail: a PDF in a frame is the browser's own viewer, and some phone
       browsers refuse to draw one — "open the file itself" is the way out when
       they do. Built as an element rather than a string: the row text is ours,
       but a straight quote in it would end an attribute early. */
    const el = document.createElement(/\.pdf$/i.test(src) ? 'iframe' : 'img');
    el.src = src;
    if (el.tagName === 'IMG') el.alt = a.textContent.trim();
    else el.title = a.textContent.trim();
    // replacing rather than appending is also the whole cleanup: there is only
    // ever one viewer, and a closed dialog is display:none. Emptying it on the
    // way out would need the close event, which is one more thing to be right
    // about for a hidden frame that costs nothing.
    certView.replaceChildren(el);
    /* The dialog's name, set here because its body is injected: without it
       a reader announces "dialog" and then an <iframe> or an <img>, and
       never says which certificate was opened. The row's own text is
       already the answer, and it is already translated. */
    certDlg.setAttribute('aria-label', a.textContent.trim());
    certDlg.showModal();
  });
  // the backdrop is painted by the dialog's own box — see closeOnBackdrop
  closeOnBackdrop(certDlg);
}

/* ── the language ────────────────────────────────────────────────────────
   Last in the file because switching rebuilds things every block above it
   defines — the gallery, the menu button, the theme button — and running it
   here means none of them need a forward reference to get built the first
   time. The English in the markup is what paints before this line: a visitor
   whose browser asks for Indonesian gets one frame of English, behind the
   intro, which is the same deal the theme already makes. */
const langBtn = $('langBtn');
function renderLang(l, save){
  applyLang(l);
  /* A language is named in its own language wherever it is offered as a
     choice — that is how anyone finds theirs in a list they cannot read — so
     these two are the same in both and are not translations at all. */
  langBtn.textContent = { en: 'english', id: 'indonesia' }[lang];
  /* Not applyRoute(). That fires the exposure and moves focus, which is not
     what changing a setting in a panel should do to the page behind it — the
     button's label is the only part of a route that is language at all. */
  labelNav(routeFromHash());
  // applyMode rather than a second lookup: it owns the button's text, and
  // running it again is only that plus two idempotent writes
  applyMode(document.documentElement.dataset.theme, false);
  buildWorks();
  // and the iPod's screen, if the intro is still on it — that word is painted
  // into a texture rather than laid out by the browser, so nothing else here
  // would have touched it
  ipod?.repaint?.();
  // a panel that is already open is rewritten where it stands
  if (workDlg?.open && lastWork > -1) openWork(lastWork);
  if (save) remember('lang', lang);
}
// pickLang lives in i18n.js because 404.html has to reach the same answer
renderLang(pickLang(recall('lang')), false);
langBtn.addEventListener('click', () => renderLang(lang === 'id' ? 'en' : 'id', true));

applyRoute();
main().catch(failIntro);
