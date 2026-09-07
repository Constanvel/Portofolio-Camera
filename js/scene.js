// ══ portfolio · webgl ═══════════════════════════════════════════════════════
// One renderer, one transparent canvas, two acts:
//   act 1  the iPod pops out, lands dead centre with zero tilt, screen wakes
//   act 2  the digicam faces you, turns to its monitor, and the frame closes
//          in until the monitor's edges are the viewport's edges
//
// Deliberately no post-processing. UnrealBloomPass hard-codes alpha 1.0 in
// its blur shader, which makes a transparent canvas impossible — that cost a
// session on the last build. Nothing here needs it.

import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { MeshoptDecoder } from './vendor/meshopt_decoder.module.js';
import { studioEnvironment, shadowSprite, STUDIO, RIM } from './env.js';
// the iPod's screen is the only text this file paints — see paintScreen. No
// cycle: i18n.js imports nothing, and main.js has already loaded it by the time
// this module is dynamically imported.
import { s } from './i18n.js';

/* ── measured off the models, once, offline ──────────────────────────────
   iPod (raw model space): front face is +X, up is +Y. The whole front is ONE
   flat quad at x 0.01386 with the artwork in the texture — the screen is not
   its own geometry, so its bounds are the bounds of the recessed LCD behind
   the glass (the 51-vertex mesh), and the play glyph was found by scanning the
   base-colour map along the wheel and taking the centroid of the mark.
     screen active area   y 0.02158 … 0.08748   z −0.03981 … 0.04032
     glass plane          x 0.01386   (LCD sits back at x 0.00829)
     play/pause glyph     y −0.0758              z −0.0024
   Digicam (scene space, node transforms applied — the raw buffers are in a
   different frame, which is what made the first pass show the base plate):
     lens is +Z, monitor is −Z, up is +Y
     monitor quad (material 07_display)  z −0.365  x −0.908…1.332  y −0.866…0.937
   The monitor ships with a stock photograph baked into its texture; it is
   replaced at runtime, never shown.
   ─────────────────────────────────────────────────────────────────────── */
const IPOD = {
  face: 0.01386,
  screen: { y0: 0.02158, y1: 0.08748, z0: -0.03981, z1: 0.04032 },
  play:   { y: -0.0758, z: -0.0024, r: 0.0148 },
  /* How far off the glass the two added surfaces sit. These were bare numbers
     against a model 12 units tall; this one is 0.2, so leaving them inline
     would have buried the screen inside the body. They belong with the
     measurements they are relative to. */
  proud: 0.0002,      // the lit screen plane
  reach: 0.0003,      // the invisible hit target, a touch further out again
  /* The way out of act one closes the frame on the screen until the screen is
     the only thing in it. An exact cover leaves the bezel sitting on the edges
     of the frame at the moment the picture inside it has gone black, so it
     closes a little past one — the same trick, and the same reason, as
     CAM.overshoot below. */
  overshoot: 1.14
};
const CAM = {
  display: { z: -0.365, x0: -0.908, x1: 1.332, y0: -0.866, y1: 0.937 },
  // the quad runs a little under the bezel, so close in slightly past an
  // exact cover or the bezel shows along the edges
  overshoot: 1.10
};

const FOV = 34;
const DEG = Math.PI / 180;

/* ── easing ─────────────────────────────────────────────────────────────
   Exponential out only. Never bounce, never elastic — real objects
   decelerate, they do not wobble. */
const clamp01 = t => t < 0 ? 0 : t > 1 ? 1 : t;
const expoOut = t => (t >= 1) ? 1 : 1 - Math.pow(2, -10 * t);
const inOut   = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
const lerp    = (a, b, t) => a + (b - a) * t;
const clamp   = (v, a, b) => v < a ? a : v > b ? b : v;

/* A real cubic-bézier so the entrance can be authored the way it would be in
   a timeline, not left to 1−2^−10t — which resolves 83% of the move in the
   first quarter of its duration and reads as a snap, not a landing. */
function bez(x1, y1, x2, y2){
  const cx = 3*x1, bx = 3*(x2-x1) - cx, ax = 1 - cx - bx;
  const cy = 3*y1, by = 3*(y2-y1) - cy, ay = 1 - cy - by;
  const fx = t => ((ax*t + bx)*t + cx)*t;
  const dx = t => (3*ax*t + 2*bx)*t + cx;
  const fy = t => ((ay*t + by)*t + cy)*t;
  return (x) => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++){
      const e = fx(t) - x, d = dx(t);
      if (Math.abs(e) < 1e-6 || d === 0) break;
      t = clamp01(t - e / d);
    }
    return fy(t);
  };
}
const POP   = bez(0.22, 0.86, 0.28, 1.00);   // emerges quickly, settles
const GLIDE = bez(0.40, 0.02, 0.05, 1.00);   // eases in, long tail into place

/* Free what the garbage collector cannot see. A geometry's vertex buffer and a
   texture's image live in the driver, not in the JS heap, so dropping the last
   reference to a Mesh collects the wrapper and leaves the GPU memory resident
   for the rest of the visit. Both acts and GL call this, because the three of
   them own overlapping pieces of the same two models.

   The Set is not an optimisation. This model shares one material across several
   meshes and one texture across several materials, and three.js fires a
   `dispose` event each time — the second one for the same object is dispatched
   against a renderer entry that is already gone. */
export function release(root){ purge(root); }

function purge(root){
  const seen = new Set();
  root.traverse(o => {
    if (o.geometry && !seen.has(o.geometry)){ seen.add(o.geometry); o.geometry.dispose(); }
    for (const m of (Array.isArray(o.material) ? o.material : [o.material])){
      if (!m || seen.has(m)) continue;
      seen.add(m);
      for (const k in m){
        const v = m[k];
        if (v && v.isTexture && !seen.has(v)){ seen.add(v); v.dispose(); }
      }
      m.dispose();
    }
  });
}

/* ── shared renderer ─────────────────────────────────────────────────── */
export class GL {
  constructor(canvas){
    this.disposed = false;
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias:true, alpha:true, powerPreference:'high-performance'
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 400);
    this.camera.position.set(0, 0, 24);

    // reflections do the work; the lamps only shape what the room leaves flat
    this.rooms = {
      studio: studioEnvironment(this.renderer, STUDIO),
      rim:    studioEnvironment(this.renderer, RIM)
    };
    this.hemi = new THREE.HemisphereLight(0xffffff, 0xe6e6ea, 0.32);
    this.key  = new THREE.DirectionalLight(0xffffff, 1.25); this.key.position.set(-5, 7, 6);
    this.rim  = new THREE.DirectionalLight(0xffffff, 0.42); this.rim.position.set(6, 2, -5);
    this.fil  = new THREE.DirectionalLight(0xffffff, 0.22); this.fil.position.set(2, -4, 7);
    // the two edge lights: grazing, from behind, so a black object on a black
    // page is separated from it by its own outline
    this.edgeL = new THREE.DirectionalLight(0xffffff, 0); this.edgeL.position.set(-11, 3, -5);
    this.edgeR = new THREE.DirectionalLight(0xffffff, 0); this.edgeR.position.set( 11, 4, -6);
    this.scene.add(this.hemi, this.key, this.rim, this.fil, this.edgeL, this.edgeR);
    this.look('studio');

    this.acts = [];
    this._raf = 0;
    this._t0 = 0;
    this.paused = false;

    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize, { passive:true });
    this.resize();
  }

  /** 'rim' — black room, edge-lit, for the iPod against a black page.
      'studio' — flagged white cyclorama, for the digicam against paper. */
  look(name){
    if (this._look === name) return;
    this._look = name;
    const rim = name === 'rim';
    this.scene.environment = (rim ? this.rooms.rim : this.rooms.studio).texture;
    this.hemi.intensity  = rim ? 0.05 : 0.32;
    this.key.intensity   = rim ? 0.34 : 1.25;
    this.rim.intensity   = rim ? 0.12 : 0.42;
    this.fil.intensity   = rim ? 0.04 : 0.22;
    this.edgeL.intensity = rim ? 5.20 : 0;
    this.edgeR.intensity = rim ? 4.50 : 0;
    this.renderer.toneMappingExposure = rim ? 1.14 : 1.0;
  }

  resize(){
    const w = window.innerWidth, h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.acts.forEach(a => a.resize && a.resize(w, h));
  }

  start(){
    if (this._raf) return;
    this._t0 = performance.now();
    const loop = (now) => {
      this._raf = requestAnimationFrame(loop);
      const t = now - this._t0;
      for (const a of this.acts) a.tick && a.tick(t, now);
      /* An act can end the whole sequence from inside its own tick: CameraAct
         calls onDone() there, onDone is finish(), and finish() now disposes
         this renderer and hands its context back. Without this guard the very
         next line draws against a context that no longer exists — it does not
         throw, it just leaves whatever the driver leaves, which is how the
         last frame of the intro turned into a blank one. stop() zeroes _raf,
         so _raf is the flag; it needs no second variable. */
      if (!this._raf) return;
      this.renderer.render(this.scene, this.camera);
    };
    this._raf = requestAnimationFrame(loop);
  }
  stop(){ cancelAnimationFrame(this._raf); this._raf = 0; }

  /** Hand the GPU back. stop() only ends the loop — the context, both PMREM
      cubemaps and every buffer the two models uploaded stayed resident for the
      whole visit afterwards, drawing nothing. Nothing renders after this: the
      intro is the only thing that ever used the renderer, and main.js drops
      its reference in the same breath. */
  dispose(){
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    window.removeEventListener('resize', this._onResize);
    purge(this.scene);
    /* The rooms are render targets rather than scene children, so traversing
       the graph never reaches them — and they are the expensive pair here, a
       mip chain each. Disposing the TARGET is what frees them; env.js returns
       it whole for exactly this reason. */
    for (const room of Object.values(this.rooms)) room.dispose();
    this.scene.environment = null;
    this.renderer.dispose();
    /* dispose() releases what three.js allocated; the WebGL context itself
       outlives it, and on a machine with few context slots that is the thing
       worth giving back. */
    this.renderer.forceContextLoss();
  }

  /** Distance at which a world-space box of the given size sits inside the
      frame at `fill` of the smaller viewport axis (contain), or covers it. */
  distanceFor(w, h, fill = 1, mode = 'contain'){
    const vFov = FOV * DEG;
    const aspect = this.camera.aspect;
    const need = (visH) => visH / (2 * Math.tan(vFov / 2));
    if (mode === 'cover'){
      return need(Math.min(h, w / aspect));
    }
    const byH = h / fill;
    const byW = (w / fill) / aspect;
    return need(Math.max(byH, byW));
  }
}

/* ── loader ───────────────────────────────────────────────────────────
   Both models are meshopt-compressed, so the decoder is not optional: without
   it GLTFLoader throws on EXT_meshopt_compression, which is in their
   extensionsRequired. It costs 24 KB against the 1.4 MB the compression takes
   off the two files, and unlike Draco it is one module with its wasm inlined
   rather than a decoder directory to keep in sync with the loader. */
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
export function load(url){
  return new Promise((res, rej) => loader.load(url, g => res(g.scene), undefined, rej));
}

/* ── warming ────────────────────────────────────────────────────────────
   three.js compiles a shader and uploads a texture the first frame an object
   is actually drawn, not when it is loaded. The digicam is 25 materials over
   42 MB of texture, so that first frame cost 200-760ms on an Intel UHD —
   a third to three quarters of a second of frozen animation, landing exactly
   on the cut the whole intro is built around.

   So it is paid earlier, under the mark, where a ring is already turning and
   the sequence is already waiting on the download anyway. compileAsync goes
   through KHR_parallel_shader_compile and does not block frames; initTexture
   is the upload, which compileAsync does not cover.

   Warming the raw model is enough for the act that clones it: a clone keeps
   every property the program cache keys on, so the compiled program is a hit,
   and it shares the texture objects outright. */
export async function warm(gl, ...models){
  /* `gl` can be null by the time the two model promises settle: this runs off
     the back of the download, and skip disposes the renderer and drops the
     reference underneath it. There is nothing to warm for a run that is
     already over. */
  if (!gl || gl.disposed) return;
  const parked = models.filter(m => m && !m.parent);
  if (!parked.length) return;
  /* Parked VISIBLE, at a millionth of their size. Invisible is not enough:
     compileAsync builds the programs and initTexture pushes the images, but
     the vertex and index buffers only go up when something is actually
     drawn — 48ms of the stall was geometry, and an object that never draws
     never uploads it. The mark is a full-screen overlay, so nothing of this
     reaches the eye. */
  const holder = new THREE.Group();
  holder.scale.setScalar(1e-6);
  for (const m of parked) holder.add(m);
  gl.scene.add(holder);
  try {
    await gl.renderer.compileAsync(gl.scene, gl.camera);
    if (gl.disposed) return;
    for (const m of parked) m.traverse(o => {
      if (!o.isMesh || !o.material) return;
      for (const mat of (Array.isArray(o.material) ? o.material : [o.material]))
        for (const k of ['map','normalMap','roughnessMap','metalnessMap','aoMap','emissiveMap'])
          if (mat[k]) gl.renderer.initTexture(mat[k]);
    });
    gl.renderer.render(gl.scene, gl.camera);   // the one draw that uploads geometry
  } catch (e){
    /* a warm-up that fails is not a reason to lose the intro — the frame it
       was buying back is the only thing at stake */
  } finally {
    for (const m of parked) holder.remove(m);
    gl.scene.remove(holder);
  }
}

/* ── the iPod's shell ──────────────────────────────────────────────────
   The shell ships as `metalness: 1` over a near-black base colour. A black
   metal reflects almost nothing — which is precisely why it read as a matte
   cut-out. A real iPod front is lacquered black plastic: a dielectric with a
   polished coat over it. So the shell becomes a physical material with
   clearcoat, and the metal is dialled back far enough that the room's soft
   boxes land as specular streaks instead of being swallowed.

   Out here rather than inside the act because of WHEN it has to happen. warm()
   compiles the material a mesh is wearing at the moment it draws it, and this
   swap is not a tweak to a standard material — clearcoat is a define, so it is
   a different program. Warming the model undressed compiled shaders the act
   then never used and paid for the real ones on its own first frame: measured
   at the cut into the iPod, 75ms, on a driver that already had them cached.
   Idempotent, because the act calls it too — a model that never went through
   the warm path still has to be dressed, and MeshPhysicalMaterial answers yes
   to isMeshStandardMaterial. */
export function dress(model){
  model.traverse(o => {
    if (!o.isMesh || !o.material || !o.material.isMeshStandardMaterial) return;
    if (o.material.isMeshPhysicalMaterial) return;
    const m = o.material;
    const pm = new THREE.MeshPhysicalMaterial({
      map: m.map, normalMap: m.normalMap, normalScale: m.normalScale,
      aoMap: m.aoMap, aoMapIntensity: 1.0,
      roughnessMap: m.roughnessMap, metalnessMap: m.metalnessMap,
      // the model's own albedo, untouched. The dark tint this once carried
      // was compensating for a bright cyclorama; under the flagged room it
      // crushes the click wheel into an unreadable black slab.
      /* NOT m.transparent. This model's single material declares
       alphaMode:BLEND for its screen glass, and copying that through
       marked all six opaque meshes transparent — they leave the depth
       buffer alone and get re-sorted every frame for nothing. Nothing
       turns it back on: the way out of this act is a move, not a fade. */
      color: m.color, side: m.side, transparent: false,
      roughness: 0.26, metalness: 0.22,
      clearcoat: 1.0, clearcoatRoughness: 0.065,
      envMapIntensity: 1.15
  });
    pm.name = m.name;
    o.material = pm;
    m.dispose();
  });
}

/* ── act one · the iPod ─────────────────────────────────────────────── */
export class IpodAct {
  constructor(gl, model){
    this.gl = gl;
    this.done = false;
    this.onPlay = null;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // screen — a self-lit plane sitting a hair proud of the glass
    const cw = 512, ch = Math.round(cw * (IPOD.screen.y1 - IPOD.screen.y0) /
                                        (IPOD.screen.z1 - IPOD.screen.z0));
    const c = document.createElement('canvas');
    c.width = cw; c.height = ch;
    this.screenCtx = c.getContext('2d');
    this.screenTex = new THREE.CanvasTexture(c);
    this.screenTex.colorSpace = THREE.SRGBColorSpace;
    this.screenTex.anisotropy = 4;

    const sw = IPOD.screen.z1 - IPOD.screen.z0;
    const sh = IPOD.screen.y1 - IPOD.screen.y0;
    /* Opaque, and that is a performance decision rather than a cosmetic one.
       The canvas behind this texture is filled edge to edge every time it is
       painted, so there was never any alpha to blend — but `transparent` is
       what puts a mesh in the blended queue, and a blended mesh writes no
       depth. The exit closes the frame on this plane until it IS the frame,
       and every pixel of the body behind it was being shaded through it.
       As an opaque it draws first, front to back, and the depth test throws
       the body away before its clearcoat shader ever runs. Measured across
       the dolly: 4.7ms a frame at the deep end, and 0.55 after. */
    this.screen = new THREE.Mesh(
      new THREE.PlaneGeometry(sw, sh),
      new THREE.MeshBasicMaterial({ map:this.screenTex, transparent:false, toneMapped:false })
    );
    this.screen.rotation.y = Math.PI / 2;                 // face +X
    this.screen.position.set(IPOD.face + IPOD.proud,
                             (IPOD.screen.y0 + IPOD.screen.y1) / 2,
                             (IPOD.screen.z0 + IPOD.screen.z1) / 2);
    model.add(this.screen);

    // invisible hit target over the play/pause glyph
    this.hit = new THREE.Mesh(
      new THREE.CircleGeometry(IPOD.play.r, 24),
      new THREE.MeshBasicMaterial({ colorWrite:false, depthWrite:false, transparent:true, opacity:0 })
    );
    this.hit.rotation.y = Math.PI / 2;
    this.hit.position.set(IPOD.face + IPOD.reach, IPOD.play.y, IPOD.play.z);
    model.add(this.hit);

    // normalise: pivot on the body centre, front (+X) toward the camera
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const mid  = box.getCenter(new THREE.Vector3());
    this.scale = 10 / Math.max(size.x, size.y, size.z);

    this.inner = new THREE.Group();
    this.inner.add(model);
    model.position.set(-mid.x, -mid.y, -mid.z);

    this.fit = new THREE.Group();
    this.fit.rotation.y = -Math.PI / 2;                   // model +X → world +Z
    this.fit.scale.setScalar(this.scale);
    this.fit.add(this.inner);

    this.rig = new THREE.Group();
    this.rig.add(this.fit);
    this.rig.visible = false;
    gl.scene.add(this.rig);

    // the shell, if main.js has not already done it under the mark. See dress()
    dress(model);


    this.worldH = size.y * this.scale;
    this.worldW = size.z * this.scale;
    /* The screen, measured the same way, because the exit closes the frame on
       it and nothing else: the plane is sw by sh in model units and the fit
       lays both of those flat against the viewport, so the scale is the whole
       conversion. */
    this.screenW = sw * this.scale;
    this.screenH = sh * this.scale;
    /* Two poses for the body, and the exit slides between them. `home` is the
       one it holds for the entire entrance — pivoted on its own centre, which
       is what makes it turn like an object in a hand. `intoScreen` is pivoted
       on the screen instead, so the screen is what the frame closes on rather
       than the middle of the iPod. */
    this.body = model;
    this.home = model.position.clone();
    this.atScreen = this.screen.position.clone().multiplyScalar(-1);
    this.exit = null;

    this.ray = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.hot = false;
    this.armed = false;
    this.landed = 0;
    this.t0 = 0;
    this.freeze = null;          // verification harness only
    // drag-to-turn, exactly as the PSP on the last site: the body follows the
    // pointer and springs back to dead-front. Exponential decay, not a spring
    // with overshoot — a resting tilt is forbidden here.
    this.spin = { x: 0, y: 0 };
    this.grab = null;
    this._last = 0;
    this.paintScreen(0, 0);
  }

  resize(){
    const fill = window.innerWidth < 640 ? 0.82 : 0.72;
    this.dist = this.gl.distanceFor(this.worldW, this.worldH, fill);
    // and where the exit ends: the screen alone, over the whole frame
    this.dScreen = this.gl.distanceFor(this.screenW, this.screenH, 1, 'cover')
                 / IPOD.overshoot;
  }

  begin(){
    this.rig.visible = true;
    this.gl.look('rim');
    this.t0 = this._last = performance.now();
    this.running = true;
  }

  /* ── drag ──────────────────────────────────────────────────────────── */
  grabAt(x, y){ this.grab = { x, y, moved: 0 }; }
  moveTo(x, y){
    if (!this.grab) return false;
    const dx = x - this.grab.x, dy = y - this.grab.y;
    this.grab.x = x; this.grab.y = y;
    this.grab.moved += Math.abs(dx) + Math.abs(dy);
    this.spin.y = clamp(this.spin.y + dx * 0.0062, -1.15, 1.15);
    this.spin.x = clamp(this.spin.x + dy * 0.0050, -0.62, 0.62);
    return true;
  }
  /** @returns how far the pointer travelled — a tap is a press, a drag is not */
  release(){ const m = this.grab ? this.grab.moved : 1e9; this.grab = null; return m; }

  /* the pop-out: three overlapping keyframe tracks, rotation resolving
     first so the body settles into a dead-square face before it stops
     growing. Lands on exactly zero — no residual tilt, ever. */
  tick(_, now){
    if (!this.running) return;
    if (this.exit) return this.tickExit(now);
    const e = this.freeze != null ? this.freeze : now - this.t0;
    const D = this.reduced ? 0.28 : 1;
    // three overlapping tracks: it pops out of nothing, glides forward, and
    // the rotation is the last thing to resolve — so the body is already the
    // right size when it squares up, which is what reads as "landing".
    const pScl = POP  (clamp01((e - 0)   / (1500 * D)));
    const pPos = GLIDE(clamp01((e - 60)  / (2200 * D)));
    const pRot = GLIDE(clamp01((e - 0)   / (2400 * D)));

    // the spin the viewer has added, decaying back to dead-front
    const dt = Math.min(64, now - this._last); this._last = now;
    if (!this.grab){
      const k = Math.pow(0.050, dt / 1000);
      this.spin.x *= k; this.spin.y *= k;
      if (Math.abs(this.spin.x) < 1e-4) this.spin.x = 0;
      if (Math.abs(this.spin.y) < 1e-4) this.spin.y = 0;
    }

    this.rig.position.set(0, lerp(-2.4, 0, pPos), lerp(-9.5, 0, pPos));
    this.rig.rotation.set(lerp(0.38, 0, pRot) + this.spin.x,
                          lerp(-2.75, 0, pRot) + this.spin.y,
                          lerp(-0.20, 0, pRot));
    const s = lerp(0.14, 1, pScl);
    this.rig.scale.setScalar(s);
    this.landed = Math.min(pScl, pPos);      // read by the vignette
    this.gl.camera.position.set(0, 0, this.dist);
    this.gl.camera.lookAt(0, 0, 0);

    if (pRot === 1 && pScl === 1 && pPos === 1){
      this.rig.rotation.set(this.spin.x, this.spin.y, 0);
      this.rig.scale.setScalar(1);
      this.rig.position.set(0, 0, 0);
    }

    // screen wakes once the body has all but landed
    const wake = clamp01((e - 2050 * D) / (560 * D));
    const type = clamp01((e - 2620 * D) / (460 * D));
    if (wake !== this._wake || type !== this._type){
      this._wake = wake; this._type = type;
      this.paintScreen(inOut(wake), expoOut(type));
      if (type >= 1 && !this.armed){ this.armed = true; }
    }
  }

  /* The screen repaints only when its own animation moves — right for sixty
     frames a second, wrong for a language change, because once the entrance
     settles both values are pinned and the word would never be redrawn.
     Invalidating the comparison rather than painting here: the next tick then
     redraws at whatever the entrance has actually reached, so this is correct
     mid-flight as well as after it has landed. */
  repaint(){ this._wake = this._type = -1; }

  paintScreen(lit, txt){
    const ctx = this.screenCtx, w = ctx.canvas.width, h = ctx.canvas.height;
    ctx.clearRect(0, 0, w, h);
    // backlight ramps from a cold dead panel to paper white
    const bg = Math.round(lerp(10, 246, lit));
    ctx.fillStyle = `rgb(${bg},${bg},${Math.round(bg * 0.99 + 2)})`;
    ctx.fillRect(0, 0, w, h);
    if (lit > 0.02){
      const g = ctx.createRadialGradient(w/2, h/2, h*0.1, w/2, h/2, h*0.78);
      g.addColorStop(0, `rgba(255,255,255,${0.30 * lit})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    if (txt > 0){
      ctx.globalAlpha = txt;
      ctx.fillStyle = '#111014';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const px = Math.round(h * 0.125);
      ctx.font = `${px}px "VCR OSD Mono", monospace`;
      /* The one string on this site that tells a visitor to do something, so
         it is also the one that most has to follow the language. Both words
         are ten characters in either language, which the monospace face on
         this screen is entitled to care about. */
      ctx.fillText(s('ipod.play', 'press play'), w / 2, h / 2);
      ctx.globalAlpha = 1;
    }
    this.screenTex.needsUpdate = true;
  }

  /** returns true when the pointer is over the play button */
  hover(x, y){
    if (!this.armed) return false;
    this.pointer.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    this.ray.setFromCamera(this.pointer, this.gl.camera);
    this.hot = this.ray.intersectObject(this.hit, false).length > 0;
    return this.hot;
  }

  press(x, y){
    if (!this.armed) return false;
    if (!this.hover(x, y)) return false;
    this.paintScreen(1, 1);
    return true;
  }

  /* ── the way out ───────────────────────────────────────────────────────
     Into the screen rather than away from it. The frame closes on the panel
     until the panel is the whole viewport, and the panel goes black on the way
     in, so the act ends on a held black instead of on an object dissolving —
     and act two comes up out of that same black. The join is a cut, and both
     halves of it are the same colour.
     It runs inside tick(), and the fade it replaces did not. That is the more
     useful half of this: the fade drove rig.scale and rig.position from a
     requestAnimationFrame of its own, and tick() pins both of them at rest the
     instant the entrance lands — so every write it made was overwritten before
     the next render. The only part of it that ever reached the screen was the
     opacity, which happens to be the one property tick() does not touch. One
     clock, one writer. */
  intoScreen(ms = 1400){
    return new Promise(res => {
      // the room's own exposure, kept so the room can go down with the panel
      const e0 = this.gl.renderer.toneMappingExposure;
      this.exit = { t0: performance.now(), ms, e0, res };
      this._word = 1;                       // the instruction, on its way out
    });
  }

  /** Let go of a running exit without finishing it. tick() is what settles
      that promise, and skip stops the loop that calls tick() — so without this
      the caller waits forever on something nothing is left to settle, and the
      teardown waiting behind the await never runs. */
  abort(){
    if (!this.exit) return;
    const done = this.exit.res;
    this.exit = null;
    this.running = false;
    done();
  }

  tickExit(now){
    // `freeze` reaches this the same way it reaches the entrance: the exit is
    // the part of the act most worth stepping through a frame at a time.
    const t = this.freeze != null ? this.freeze : now - this.exit.t0;
    const p = clamp01(t / this.exit.ms);
    const e = inOut(p);
    /* Square up first. The body is draggable right until the press lands, so
       it can be sitting at any angle when this starts, and a screen you are
       pushing into cannot be left tilted — the frame would close on a
       trapezoid and the black would arrive with a corner missing. */
    this.rig.rotation.set(this.spin.x * (1 - e), this.spin.y * (1 - e), 0);
    this.rig.position.set(0, 0, 0);
    this.rig.scale.setScalar(1);
    this.body.position.lerpVectors(this.home, this.atScreen, e);
    this.gl.camera.position.set(0, 0, lerp(this.dist, this.dScreen, e));
    this.gl.camera.lookAt(0, 0, 0);
    /* The word goes first, and it is the only thing in here that costs a
       repaint. It asked for a press, the press has happened, and leaving it lit
       on a screen the frame is closing in on says the site is still waiting for
       it. Bounded on purpose: paintScreen() redraws a 512-pixel panel and
       re-uploads it, which is the right cost for a fifth of a second and the
       wrong one for every frame of a dolly — a dozen frames here, none after.
       `lit` stays at 1 throughout; the light is the material's job below. */
    if (this._word > 0){
      this._word = p < 0.16 ? 1 - p / 0.16 : 0;
      this.paintScreen(1, this._word);
    }
    /* Then the backlight, and this one costs nothing at all: a basic material
       multiplies its map by its colour, so the whole fade is one float where a
       repaint would be an upload. Gone by 0.72 of the move, comfortably before
       the panel is the only thing left in frame — the last stretch is already
       black, which is what makes the end of the move impossible to see. */
    this.screen.material.color.setScalar(1 - inOut(clamp01((p - 0.10) / 0.62)));
    /* And the room goes down after it. Without this the shell is still lit
       silver while the black rectangle is already most of the frame — a bright
       border around a hole, which reads as a hole rather than as darkness.
       Later than the backlight and quicker, so what the eye follows is still
       the body rushing past the edges of frame; only the last of it dissolves.
       Exposure rather than opacity: these materials are opaque deliberately
       (see the traverse in the constructor), and the panel is toneMapped:false,
       so this reaches the body and nothing else. look() puts it back — the next
       act asks for a different room, which is what that call resets. */
    this.gl.renderer.toneMappingExposure =
      this.exit.e0 * (1 - inOut(clamp01((p - 0.58) / 0.34)));
    if (p < 1) return;
    this.running = false;
    this.rig.visible = false;
    const done = this.exit.res;
    this.exit = null;
    done();
  }

  dispose(){
    this.gl.scene.remove(this.rig);
    purge(this.rig);                 // the model, its screen quad and its hit target
  }
}

/* ── act two · the digicam ──────────────────────────────────────────── */
export class CameraAct {
  constructor(gl, model, sourceCanvas, hooks = {}){
    this.gl = gl;
    this.src = sourceCanvas || null;
    this.onReveal = hooks.onReveal || (() => {});   // plane goes up behind
    this.onDone   = hooks.onDone   || (() => {});   // camera is gone
    this.onLit    = hooks.onLit    || (() => {});   // it has finished arriving
    this._revealed = false; this._done = false; this._lit = false;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const mid  = box.getCenter(new THREE.Vector3());
    this.scale = 10 / Math.max(size.x, size.y, size.z);

    // The lens already faces +Z at identity, so there is no base rotation:
    // the act starts square-on to the lens and turns 180° to the monitor.
    this.model = model;
    this.inner = new THREE.Group(); this.inner.add(model);
    this.fit = new THREE.Group();
    this.fit.scale.setScalar(this.scale);
    this.fit.add(this.inner);
    this.rig = new THREE.Group();
    this.rig.add(this.fit);
    this.rig.visible = false;
    gl.scene.add(this.rig);

    this.bodyPivot = mid.clone();
    this.dispPivot = new THREE.Vector3(
      (CAM.display.x0 + CAM.display.x1) / 2,
      (CAM.display.y0 + CAM.display.y1) / 2,
      CAM.display.z
    );
    this.inner.position.copy(this.bodyPivot).multiplyScalar(-1);

    this.dispW = (CAM.display.x1 - CAM.display.x0) * this.scale;
    this.dispH = (CAM.display.y1 - CAM.display.y0) * this.scale;
    this.bodyW = size.x * this.scale;
    this.bodyH = size.y * this.scale;

    /* ── the monitor. Whatever the model shipped with is discarded, and what
       goes on it is the live canvas of work itself — not a preview of it. The
       page you are about to be handed is already running on the screen, so
       when the body dissolves there is nothing to cut to: the pixels are
       already the same pixels. */
    this.mtex = this.src ? new THREE.CanvasTexture(this.src) : null;
    if (this.mtex){
      this.mtex.colorSpace = THREE.SRGBColorSpace;
      this.mtex.wrapS = this.mtex.wrapT = THREE.ClampToEdgeWrapping;
      this.mtex.generateMipmaps = false;
      this.mtex.minFilter = THREE.LinearFilter;
    }

    model.traverse(o => {
      if (!o.isMesh) return;
      const name = o.material && o.material.name || '';
      /* Silver metal has no diffuse worth the name — all of it is reflection.
         Tinting it grey and roughening it, which is what this used to do, is
         what made it read as a cartoon: it flattened every surface to one
         value. The fix belongs in the room (black flags), not in the material.
         Here we only sharpen: a crisper surface catches the flags harder. */
      if (o.material && o.material.isMeshStandardMaterial){
        o.material = o.material.clone();
        o.material.envMapIntensity = 1.15;
        o.material.roughness = Math.min(1, (o.material.roughness ?? 0.5) * 0.50);
      }
      if (name === '07_display'){
        this.panel = new THREE.MeshBasicMaterial({
          map: this.mtex, color: 0x000000, toneMapped: false, transparent: true });
        o.material = this.panel;
      } else if (name === '07_glass_NONE' || name === '07_glass'){
        /* The sheen sheet sits between the viewer and the panel. It kept its
           tenth of a veil all the way to the end, which is two things wrong at
           once: by then the panel is the whole viewport, so the veil is over
           the page itself, and a full-screen transparent pass over a
           full-screen transparent panel was three quarters of what this act
           cost per frame. So it goes out with the zoom instead, on its own
           rule in tick(), and starts at nothing rather than at a tenth. */
        o.material = o.material.clone();
        o.material.transparent = true;
        o.material.opacity = 0;
        o.material.depthWrite = false;
        this.glass = o;
      }
    });

    /* Everything that is not the screen. The monitor ends up covering the
       viewport, and at that point all of this is behind it and none of it can
       be seen — but a mesh nobody can see still costs every pixel it covers.
       Gathered once here rather than traversed every frame. */
    this._body = [];
    model.traverse(o => {
      if (o.isMesh && o.material !== this.panel && o !== this.glass) this._body.push(o);
    });
    this._buried = false;

    this.shadow = shadowSprite();
    this.shadow.scale.set(this.bodyW * 1.9, this.bodyH * 2.1, 1);
    this.shadow.position.set(this.bodyW * 0.07, -this.bodyH * 0.16, -3.6);
    this.shadow.visible = false;
    gl.scene.add(this.shadow);

    this.zoomed = 0;
    this.freeze = null;          // verification harness only
    this.resize();
  }

  resize(){
    const fill = window.innerWidth < 640 ? 0.86 : 0.60;
    this.dFar  = this.gl.distanceFor(this.bodyW, this.bodyH, fill);
    this.dNear = this.gl.distanceFor(this.dispW, this.dispH, 1, 'cover') / CAM.overshoot;

    /* Map the page onto the panel so that at full zoom the part of the panel
       still on screen is EXACTLY the whole page, pixel for pixel — otherwise
       the hand-off is a visible jump in scale. Two mappings, lerped by the
       zoom: aspect-correct cover while the camera is still whole, and the
       exact one by the time the panel is the viewport. */
    const aspect = this.gl.camera.aspect;
    const visH = 2 * this.dNear * Math.tan(FOV * DEG / 2);
    const visW = visH * aspect;
    const fx = Math.min(1, visW / this.dispW), fy = Math.min(1, visH / this.dispH);
    this.uvEnd = { rx: 1 / fx, ry: 1 / fy,
                   ox: -(1 - fx) / (2 * fx), oy: -(1 - fy) / (2 * fy) };

    const Aq = this.dispW / this.dispH;
    let rx = 1, ry = 1;
    if (aspect > Aq) rx = Aq / aspect; else ry = aspect / Aq;
    this.uvStart = { rx, ry, ox: (1 - rx) / 2, oy: (1 - ry) / 2 };
  }

  /** total run time of the act, ms */
  get duration(){ return this.reduced ? 900 : 5400; }

  begin(){
    this.rig.visible = true;
    this.shadow.visible = true;
    this.gl.look('studio');
    this.t0 = performance.now();
    this.running = true;
    /* The room's own exposure, and the act arrives by climbing to it. This
       used to mark all 23 of the body's materials transparent and fade their
       opacity up together, which is 23 blended layers that cannot reject one
       another: measured at 13.6ms a frame against 5.0 with the same object
       opaque. The act now opens over the black the iPod's screen left behind,
       and out of black a light coming up and an alpha coming up look the same
       — so this is the same arrival for a third of the cost, and it takes the
       opacity bookkeeping with it.
       Only the body follows this. The panel and the shadow are both
       toneMapped:false and do their own thing below. */
    this.e1 = this.gl.renderer.toneMappingExposure;
    this.panel.transparent = false;
    this.panel.opacity = 1;
  }

  tick(_, now){
    if (!this.running) return;
    const e = this.freeze != null ? this.freeze : now - this.t0;
    const R = this.reduced;

    /* 700 and not the 460 this was: the act used to open over paper, where a
       body arriving quickly reads as arriving. It now opens over the black the
       iPod's screen left behind, and out of black the same 460 reads as a
       light being switched on rather than as something coming into view. */
    const pIn   = clamp01(e / (R ? 120 : 700));
    const pTurn = inOut(clamp01((e - (R ? 120 : 820)) / (R ? 200 : 1560)));
    const pWake = clamp01((e - (R ? 200 : 1900)) / (R ? 200 : 700));
    const pZoom = inOut(clamp01((e - (R ? 320 : 2620)) / (R ? 300 : 1980)));
    const pOut  = clamp01((e - (R ? 620 : 4620)) / (R ? 200 : 640));

    // lens at the viewer, then turned right around to the monitor
    this.rig.rotation.y = lerp(0, Math.PI, pTurn);
    // a whisper of settle on the other axis so it reads as handled by someone,
    // not motorised — resolves to exactly zero
    this.rig.rotation.x = lerp(-0.09, 0, inOut(clamp01((e - 820) / 2200)));

    // the pivot slides from the body's centre to the monitor's centre, so the
    // monitor is dead centre by the time the frame closes in on it
    const p = this.bodyPivot.clone().lerp(this.dispPivot, pTurn);
    this.inner.position.copy(p).multiplyScalar(-1);

    this.zoomed = pZoom;                     // read by the vignette
    const d = lerp(this.dFar, this.dNear, pZoom);
    this.gl.camera.position.set(0, 0, d);
    this.gl.camera.lookAt(0, 0, 0);

    this.paintPanel(inOut(pWake), pZoom);

    // the shadow retires as the frame closes in — by then the monitor is the
    // whole viewport and there is no paper left to cast onto
    this.shadow.material.opacity = 0.8 * Math.min(pIn, 1 - pOut) * (1 - pZoom);

    // the body arrives by being lit, not by being blended in — see begin()
    this.gl.renderer.toneMappingExposure = this.e1 * inOut(pIn);
    /* And the page is told when that has finished, because the two have to
       happen in that order rather than at once. Off the act's own progress and
       not a timer, the same as the reveal below. */
    if (pIn >= 1 && !this._lit){ this._lit = true; this.onLit(); }

    /* The panel is the exception, and only at the very end. It has to dissolve
       into the page underneath it, so for the length of that dissolve it goes
       back to being blended — and for every frame before it, being an opaque
       is what stops the body behind it from being shaded at all. Measured at
       the end of the zoom: 75ms a frame blended, 17 solid.
       No `needsUpdate` on either flip. `transparent` picks the queue and the
       blend state, both read per draw; it is also a program parameter, so
       asking for a recompile would put a shader compile in the middle of a
       move. The program compiled at construction is right for both states —
       this panel's alpha is 1 whichever queue it is in. */
    if (pOut > 0){
      this.panel.transparent = true;
      this.panel.opacity = 1 - pOut;
    }

    /* The sheen, going out as the frame closes on the picture it sits over.
       `visible` and not merely an opacity of zero: a transparent material at
       zero alpha is still a full-screen draw, which is the whole of what this
       is here to avoid. */
    if (this.glass){
      const v = 0.10 * (1 - pZoom);
      this.glass.material.opacity = v;
      this.glass.visible = v > 0.004;
    }

    /* And the body, once the monitor's edges have left the frame. The test is
       the distance rather than a hand-picked progress: dNear is already the
       cover distance divided by the overshoot, so multiplying it back is
       exactly the point at which the panel fills the viewport. Everything
       behind it is hidden by it from here on, including through the fade-out
       — where the panel is blended again and would otherwise stop hiding it. */
    const buried = d <= this.dNear * CAM.overshoot;
    if (buried !== this._buried){
      this._buried = buried;
      for (const m of this._body) m.visible = !buried;
    }
    // the hand-off rides the act's own progress, never a wall clock: on a
    // slow machine a setTimeout fires while the camera is still turning.
    if (pZoom > 0.99 && !this._revealed){ this._revealed = true; this.onReveal(); }
    if (pOut >= 1 && !this._done){
      this._done = true; this.running = false;
      this.rig.visible = false; this.shadow.visible = false; this.onDone();
    }
  }

  /** The panel wakes from dead black to the page itself. `color` on a basic
      material multiplies the map, so it doubles as the backlight ramp. */
  paintPanel(lit, zoom){
    if (!this.panel) return;
    this.panel.color.setScalar(lit);
    if (!this.mtex) return;
    const a = this.uvStart, b = this.uvEnd, t = zoom;
    this.mtex.repeat.set(lerp(a.rx, b.rx, t), lerp(a.ry, b.ry, t));
    this.mtex.offset.set(lerp(a.ox, b.ox, t), lerp(a.oy, b.oy, t));
    if (lit > 0.01) this.mtex.needsUpdate = true;   // the page is live
  }

  dispose(){
    this.gl.scene.remove(this.rig);
    this.gl.scene.remove(this.shadow);
    purge(this.rig);                 // takes this.panel and this.mtex with it
    purge(this.shadow);              // its own canvas texture, built in env.js
  }
}
