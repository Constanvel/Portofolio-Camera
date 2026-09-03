// ══ portfolio · orchestration ═══════════════════════════════════════════════
// mark → iPod → (press play) → digicam → the canvas of work → pages.

// scene.js is NOT imported statically. It pulls three.js (1.3 MB) behind it,
// and the lite path never renders a polygon — a static import would make every
// phone on the planet download a renderer it will not use. See LITE below.
import { WorkCanvas } from './canvas.js';
// the same table the canvas draws from, so a tile and its panel cannot drift
import { WORKS } from './data.js';

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
const glxCanvas = $('glx');
const flashEl   = $('flash');

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = ms => new Promise(r => setTimeout(r, ms));

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
   Muted playback is always permitted, so the track is set rolling muted on
   the first frame: it buffers, and the user's gesture only has to unmute.
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
/* 0.66, not the 0.42 this was tuned to. The track behind it changed, and the
   new one is quieter: -15.0 LUFS against the old -11.0, because it keeps its
   full 7.6 LU of range instead of being mastered flat and hot. Four decibels
   of that is real, so the default climbs by the same four (x1.585) and the
   room sounds exactly as loud as it did before. */
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
function expose(){
  if (reduced) return;
  flashEl.classList.remove('is-fire');
  void flashEl.offsetWidth;
  flashEl.classList.add('is-fire');
}

/* ── the lens ────────────────────────────────────────────────────────────
   Built on first use and kept, because the expensive part of S.GL is the two
   PMREM bakes in its constructor and doing those on every nav click would cost
   far more than the context it holds. Everything else about it is small: one
   procedural object, no models, no textures, no downloads.

   Never on the lite path. Phones deliberately have no three.js at all — see
   LITE — and the whole point of that decision was to keep the mobile payload
   where it is. They get the exposure and the aperture in css, and no renderer.
   Flip `LITE ||` out of the guard below to give phones the lens too, at the
   cost of shipping the renderer to them. */
let glx = null, lens = null, lensBusy = false;
async function fireLens(){
  if (LITE || reduced || !S || lensBusy) return;
  lensBusy = true;
  try {
    if (!glx){
      glxCanvas.hidden = false;
      glx = new S.GL(glxCanvas);
      glx.look('studio');   // the digicam's room, not the iPod's
    }
    if (!lens) lens = new S.LensAct(glx, { onDone: restLens });
    if (!glx.acts.includes(lens)) glx.acts.push(lens);
    glx.start();          // idempotent
    glxCanvas.hidden = false;
    glx.resize();
    lens.begin();
  } catch (e){
    /* a section that arrives without its lens is a section that arrived. This
       is decoration on top of a route that has already worked. */
    glxCanvas.hidden = true;
  } finally {
    lensBusy = false;
  }
}

/* The renderer is kept but not left running. Between sections there is nothing
   on this canvas to draw, and a loop that renders an invisible empty scene at
   60fps over the canvas of work is exactly the bill finish() was written to
   stop paying. */
function restLens(){
  if (!glx) return;
  glx.stop();
  glxCanvas.hidden = true;
}

function routeFromHash(){
  const h = (location.hash || '').replace(/^#\/?/, '');
  return pages[h] ? h : '';
}
async function applyRoute(){
  const r = routeFromHash();
  /* The intro and a section are not two layers, they are two answers to
     "where am I". A page is opaque but it FADES — for 620ms it is translucent,
     and the iPod at z-30 shows straight through it. Worse, nothing was ever
     stopping the sequence: open #/about directly and the mark plays, the iPod
     loads and the render loop runs for the whole visit, underneath. So a route
     does not cover the intro. It ends it. */
  if (r) endIntro();
  // and going the other way the plane has to be alive BEFORE the page above it
  // starts to fade, or it is revealed as a frozen still. `workHeld` is the lite
  // path holding the films back under the mark — see ensureWork — and it wins.
  else if (work && !workHeld) work.start();
  for (const a of navLinks){
    const on = a.getAttribute('href') === '#/' + r;
    a.classList.toggle('is-on', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
  /* On a narrow screen the bar is behind a button, so the button has to say
     which section you are in — otherwise the only thing telling you is hidden
     inside the thing you have not opened. "menu" is the honest word for home,
     where no section is current. */
  navBtn.textContent = r || 'menu';
  openNav(false);
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
      el.hidden = true;
      el.classList.remove('is-shut');
    }
  }
  if (r){
    const el = pages[r];
    /* Nothing behind an opaque full-screen page needs to be drawn, and the
       canvas was left running through every visit to every section: eight
       videos decoding and the whole plane repainted sixty times a second,
       under a sheet of paper. It is also the only thing here big enough to
       cost the entrance its frames — which is why a section stuttered on the
       way IN and was smooth once it had arrived. */
    if (work) work.stop();
    /* Ahead of the section being shown, not after: the flash has to cover the
       swap, which is the one frame where the outgoing section is gone and the
       incoming one has not painted. */
    expose();
    fireLens();
    el.hidden = false;
    void el.offsetWidth;
    el.classList.add('is-lit');
    body.dataset.stage = 'page';
    /* `.page__t`, not `h1`: the section headings are <h2> now, because the one
       <h1> belongs to the document and carries the name. This selector matched
       the heading by tag, so leaving it would have returned null on every
       section without a back button or a cta — and `null.focus?.()` throws,
       optional chaining guards the method, not the object it hangs off. */
    el.querySelector('.page__back, .page__cta, .page__t')?.focus?.();
  } else if (body.dataset.stage === 'page'){
    body.dataset.stage = lastStage;
    restLens();
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

/* `workHeld` is the lite path's compromise. Downloading the films costs
   bandwidth; PLAYING them costs a hardware decoder, and on a phone the mark is
   already using one. So the canvas is built while the mark is still on screen —
   the eight sources start arriving — but it is not started, and nothing calls
   play() until the mark is gone. Held, it is a shopping list; started, it is a
   competitor. */
function ensureWork(){
  if (work) return work;
  work = new WorkCanvas($('cv'), {
    onRoute: (r) => { location.hash = '#/' + r; },
    onWork: (i) => openWork(i),
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

const vignetteDriver = {
  tick(){
    if (cam)  dim(0.82 * (1 - cam.zoomed));
    else if (ipod) dim(1 - 0.18 * ipod.landed);
  }
};

async function main(){
  armGlobalGesture();
  rollMuted();

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

  /* A hash on the first paint means the visitor asked for a section, not for
     the sequence — applyRoute() has already ended the intro below. Bail before
     the import, or an act nobody will see still costs three.js and two glb
     loads. Fonts are awaited above either way: the canvas of work sets type. */
  if (skipped) return;

  if (!LITE){
    S = await import('./scene.js');
    gl = new S.GL(glCanvas);
    gl.acts.push(vignetteDriver);
    gl.start();
    // both models start downloading now and are awaited where they are used,
    // so the camera is resident long before anyone presses play
    ipodModel = S.load('./assets/models/ipod.glb');
    camModel  = S.load('./assets/models/camera.glb');
    ipodModel.catch(() => {}); camModel.catch(() => {});
    /* A synchronous handle on whatever has actually landed. finish() is not
       async and cannot await these, and releasing a model in a `.then()` puts
       it after the renderer has already handed its context back — at which
       point three.js drops the dispose on the floor, because the properties
       map it would have decremented is gone. */
    ipodModel.then(m => { landed.ipod = m; }, () => {});
    camModel .then(m => { landed.cam  = m; }, () => {});
  }

  /* ── the mark ─────────────────────────────────────────────────────────
     A still and a turning ring, painted from the first frame. The three ways
     this used to fail on a phone — autoplay refused outright, the decoder busy
     elsewhere, the clip never getting a frame out in time — all belonged to
     the video, and went with it. */
  // On the lite path the films start ARRIVING under the mark but must not
  // start PLAYING under it — see workHeld.
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
                      : Promise.allSettled([ipodModel, camModel])
                          .then(r => S.warm(gl, ...r.filter(x => x.status === 'fulfilled')
                                                    .map(x => x.value)));
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
  // let the entrance play out before eight films start decoding behind it
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
    toCamera();
  };
  glCanvas.addEventListener('pointerup', lift);
  glCanvas.addEventListener('pointercancel', () => { if (ipod) ipod.release(); glCanvas.classList.remove('is-turning'); });
}

async function toCamera(){
  if (skipped) return;
  const act = ipod;
  ipod = null;
  glCanvas.classList.remove('is-live', 'is-hot');
  await act.fadeOut(reduced ? 60 : 560);
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

  body.classList.remove('is-dark');   // back to paper for the digicam

  cam = new S.CameraAct(gl, model, ensureWork().cv, {
    // the plane goes up underneath only once the monitor's edges ARE the
    // viewport's edges; the camera's own fade is then the cross-dissolve
    onReveal: () => { showWork(); skipBtn.classList.remove('is-lit'); },
    onDone: finish
  });
  gl.acts.push(cam);
  gl.resize();
  cam.begin();
}

/* The mark fades, the plane comes up under it, and the vignette — which on
   the full path is driven off the acts' own progress — eases off on its own
   clock, because on this path there is no act to read a progress from. Both
   ends of the ramp are clamped: rAF hands you the timestamp of the START of
   the frame, which can predate the performance.now() that scheduled it, and
   an unclamped p goes negative. */
function lite(){
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
  get glx(){ return glx; }, get lens(){ return lens; },
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
  modeBtn.textContent = m;
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
function openWork(i){
  const w = WORKS[i];
  if (!w || !workDlg?.showModal) return;
  $('workShot').src = w.src;
  $('workShot').alt = w.label;
  $('workTitle').textContent = w.label;

  // year and role are optional and usually not known yet; an empty line is
  // worse than no line, so the row only exists when there is something in it
  const meta = [w.year, w.role].filter(Boolean).join(' · ');
  $('workMeta').textContent = meta;
  $('workMeta').hidden = !meta;

  $('workBlurb').textContent = w.blurb || '';
  $('workPoints').replaceChildren(...(w.points || []).map(t => {
    const li = document.createElement('li');
    li.textContent = t;
    return li;
  }));

  /* Same rule as the meta line: a project with no repo gets no link at all
     rather than one that goes nowhere. The label is read off the url instead
     of being fixed in the markup, so pointing a project at a live demo later
     does not leave it announcing a repo that is not there. */
  const link = $('workLink');
  link.href = w.href || '#';
  link.textContent = /(^|\.)github\.com$/.test(hostOf(w.href)) ? 'open the repo on GitHub'
                                                              : 'open the project';
  $('workLinkRow').hidden = !w.href;

  workDlg.showModal();
}
/* The gallery is built rather than written: the markup for `works` is an empty
   <ul>, and the cards come from WORKS — the same table the canvas tiles and the
   panel above read. Adding a project stays one edit in one file, and the three
   places it appears cannot disagree. The buttons carry data-work, so the
   delegated handler below opens them with no extra wiring. */
const worksGrid = $('worksGrid');
if (worksGrid){
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

    const t = document.createElement('span');
    t.className = 'grid__t'; t.textContent = w.label;

    b.append(img, t);

    /* Reading order on a card: what it is called, what it is, then when and
       with whom. The meta line is the most incidental of the three, so it goes
       last rather than between the name and the sentence that explains it. */
    if (w.note){
      const n = document.createElement('span');
      n.className = 'grid__d'; n.textContent = w.note;
      b.append(n);
    }
    // year and role only when they are known — an empty line reads as a fault
    const meta = [w.year, w.role].filter(Boolean).join(' · ');
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
    if (i > -1) openWork(i);
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
    const a = e.target.closest('a[href*="/certs/"]');
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
    certDlg.showModal();
  });
  // the backdrop is painted by the dialog's own box — see closeOnBackdrop
  closeOnBackdrop(certDlg);
}

applyRoute();
main();
