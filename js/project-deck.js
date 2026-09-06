import * as THREE from 'three';

const CARD_W = 3.6;
const CARD_H = 2.25;
const CARD_D = 0.12;

function roundedCardGeometry(width, height, radius, depth){
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled:true,
    bevelSegments:2,
    bevelSize:0.035,
    bevelThickness:0.025,
    curveSegments:6
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function circularDifference(index, active, count){
  let difference = index - active;
  if (difference > count / 2) difference -= count;
  if (difference < -count / 2) difference += count;
  return difference;
}

function cssColour(styles, name, fallback){
  return styles.getPropertyValue(name).trim() || fallback;
}

export class ProjectDeck {
  constructor(canvas, works, { onChange = () => {}, onOpen = () => {}, reducedMotion = false } = {}){
    if (!canvas || !works?.length) throw new Error('ProjectDeck needs a canvas and project data');

    this.canvas = canvas;
    this.works = works;
    this.onChange = onChange;
    this.onOpen = onOpen;
    this.reducedMotion = reducedMotion;
    this.index = 0;
    this.enabled = false;
    this.disposed = false;
    this.frame = 0;
    this.lastTime = 0;
    this.drag = null;
    this.dragShift = 0;
    this.hoverX = 0;
    this.hoverY = 0;
    this.wheelAt = 0;
    this.textures = new Set();
    this.materials = new Set();

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha:true,
      antialias:devicePixelRatio <= 1.5,
      powerPreference:'high-performance'
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30);
    this.camera.position.set(0, 0, 8.4);

    this.rig = new THREE.Group();
    this.scene.add(this.rig);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x777788, 1.25));
    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(-4, 5, 7);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.8);
    rim.position.set(5, -2, 4);
    this.scene.add(rim);

    this.cardGeometry = roundedCardGeometry(CARD_W, CARD_H, 0.16, CARD_D);
    this.imageGeometry = new THREE.PlaneGeometry(3.28, 1.845);
    this.bodyMaterial = new THREE.MeshStandardMaterial({
      roughness:0.7,
      metalness:0.08
    });
    this.materials.add(this.bodyMaterial);

    const loader = new THREE.TextureLoader();
    this.cards = works.map((work, index) => {
      const group = new THREE.Group();
      const body = new THREE.Mesh(this.cardGeometry, this.bodyMaterial);
      group.add(body);

      const imageMaterial = new THREE.MeshBasicMaterial({ toneMapped:false });
      this.materials.add(imageMaterial);
      const image = new THREE.Mesh(this.imageGeometry, imageMaterial);
      image.position.z = CARD_D / 2 + 0.035;
      group.add(image);

      loader.load(work.src, texture => {
        if (this.disposed){ texture.dispose(); return; }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        this.textures.add(texture);
        imageMaterial.map = texture;
        imageMaterial.needsUpdate = true;
        this.invalidate();
      }, undefined, () => this.invalidate());

      group.userData.index = index;
      group.position.set(circularDifference(index, 0, works.length) * 2.15, 0, -3);
      this.rig.add(group);
      return group;
    });

    this.boundResize = () => this.resize();
    this.boundPointerDown = event => this.pointerDown(event);
    this.boundPointerMove = event => this.pointerMove(event);
    this.boundPointerUp = event => this.pointerUp(event);
    this.boundPointerCancel = () => this.cancelDrag();
    this.boundPointerLeave = () => this.pointerLeave();
    this.boundWheel = event => this.wheel(event);
    this.boundKeyDown = event => this.keyDown(event);
    this.boundVisibility = () => {
      if (document.hidden){
        cancelAnimationFrame(this.frame);
        this.frame = 0;
        this.lastTime = 0;
      }
      else if (this.enabled) this.invalidate();
    };

    canvas.addEventListener('pointerdown', this.boundPointerDown);
    canvas.addEventListener('pointermove', this.boundPointerMove);
    canvas.addEventListener('pointerup', this.boundPointerUp);
    canvas.addEventListener('pointercancel', this.boundPointerCancel);
    canvas.addEventListener('pointerleave', this.boundPointerLeave);
    canvas.addEventListener('wheel', this.boundWheel, { passive:true });
    canvas.addEventListener('keydown', this.boundKeyDown);
    document.addEventListener('visibilitychange', this.boundVisibility);

    this.resizeObserver = new ResizeObserver(this.boundResize);
    this.resizeObserver.observe(canvas);
    this.syncTheme();
    this.resize();
    this.layout(1);
    this.onChange(this.index);
  }

  get cardCount(){ return this.cards.length; }
  get activeIndex(){ return this.index; }

  start(){
    if (this.disposed) return;
    this.enabled = true;
    this.invalidate();
  }

  stop(){
    this.enabled = false;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  invalidate(){
    if (!this.enabled || this.disposed || document.hidden || this.frame) return;
    this.frame = requestAnimationFrame(time => this.tick(time));
  }

  tick(time){
    this.frame = 0;
    if (!this.enabled || this.disposed) return;
    const dt = this.lastTime ? Math.min(0.05, (time - this.lastTime) / 1000) : 1 / 60;
    this.lastTime = time;
    const amount = this.reducedMotion ? 1 : 1 - Math.exp(-12 * dt);
    const moving = this.layout(amount);
    this.renderer.render(this.scene, this.camera);
    if (moving) this.invalidate();
  }

  layout(amount){
    let moving = false;
    for (let i = 0; i < this.cards.length; i++){
      const card = this.cards[i];
      const difference = circularDifference(i, this.index, this.cards.length) + this.dragShift;
      const distance = Math.abs(difference);
      const targetX = difference * 2.18;
      const targetY = -distance * 0.11;
      const targetZ = -distance * 0.72;
      const targetYRotation = -difference * 0.18;
      const targetZRotation = -difference * 0.045;
      const targetScale = 1 - Math.min(distance, 2.5) * 0.075;

      card.position.x = THREE.MathUtils.lerp(card.position.x, targetX, amount);
      card.position.y = THREE.MathUtils.lerp(card.position.y, targetY, amount);
      card.position.z = THREE.MathUtils.lerp(card.position.z, targetZ, amount);
      card.rotation.y = THREE.MathUtils.lerp(card.rotation.y, targetYRotation, amount);
      card.rotation.z = THREE.MathUtils.lerp(card.rotation.z, targetZRotation, amount);
      const scale = THREE.MathUtils.lerp(card.scale.x, targetScale, amount);
      card.scale.setScalar(scale);

      if (Math.abs(card.position.x - targetX) > 0.002
          || Math.abs(card.position.z - targetZ) > 0.002
          || Math.abs(card.rotation.y - targetYRotation) > 0.002) moving = true;
    }

    const rigY = this.hoverX * 0.075;
    const rigX = -this.hoverY * 0.055;
    this.rig.rotation.y = THREE.MathUtils.lerp(this.rig.rotation.y, rigY, amount);
    this.rig.rotation.x = THREE.MathUtils.lerp(this.rig.rotation.x, rigX, amount);
    if (Math.abs(this.rig.rotation.y - rigY) > 0.001
        || Math.abs(this.rig.rotation.x - rigX) > 0.001) moving = true;
    return moving && !this.reducedMotion;
  }

  next(step = 1){
    if (this.disposed) return;
    this.index = (this.index + step + this.cards.length) % this.cards.length;
    this.dragShift = 0;
    this.onChange(this.index);
    this.invalidate();
  }

  pointerDown(event){
    if (!this.enabled) return;
    this.drag = { id:event.pointerId, x:event.clientX, y:event.clientY, dx:0, dy:0 };
    this.canvas.setPointerCapture?.(event.pointerId);
    this.canvas.closest('.deck')?.classList.add('is-dragging');
  }

  pointerMove(event){
    const rect = this.canvas.getBoundingClientRect();
    this.hoverX = THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    this.hoverY = THREE.MathUtils.clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
    if (this.drag?.id === event.pointerId){
      this.drag.dx = event.clientX - this.drag.x;
      this.drag.dy = event.clientY - this.drag.y;
      this.dragShift = THREE.MathUtils.clamp(this.drag.dx / Math.max(150, rect.width * 0.3), -0.9, 0.9);
    }
    this.invalidate();
  }

  pointerUp(event){
    if (this.drag?.id !== event.pointerId) return;
    const { dx, dy } = this.drag;
    this.canvas.releasePointerCapture?.(event.pointerId);
    this.canvas.closest('.deck')?.classList.remove('is-dragging');
    this.drag = null;
    this.dragShift = 0;
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) this.next(dx < 0 ? 1 : -1);
    else if (Math.hypot(dx, dy) < 8) this.onOpen(this.index);
    else this.invalidate();
  }

  cancelDrag(){
    this.drag = null;
    this.dragShift = 0;
    this.canvas.closest('.deck')?.classList.remove('is-dragging');
    this.invalidate();
  }

  pointerLeave(){
    if (!this.drag){ this.hoverX = 0; this.hoverY = 0; }
    this.invalidate();
  }

  wheel(event){
    const now = performance.now();
    if (now - this.wheelAt < 260 || Math.max(Math.abs(event.deltaX), Math.abs(event.deltaY)) < 8) return;
    this.wheelAt = now;
    this.next((Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY) > 0 ? 1 : -1);
  }

  keyDown(event){
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight'){
      event.preventDefault();
      this.next(event.key === 'ArrowRight' ? 1 : -1);
    } else if (event.key === 'Enter' || event.key === ' '){
      event.preventDefault();
      this.onOpen(this.index);
    }
  }

  resize(){
    if (this.disposed) return;
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.invalidate();
  }

  syncTheme(){
    if (this.disposed) return;
    const styles = getComputedStyle(document.documentElement);
    this.bodyMaterial.color.setStyle(cssColour(styles, '--paper', '#ffffff'));
    this.bodyMaterial.emissive.setStyle(cssColour(styles, '--ink', '#111014'));
    this.bodyMaterial.emissiveIntensity = 0.018;
    for (const material of this.materials){
      if (material !== this.bodyMaterial && !material.map){
        material.color.setStyle(cssColour(styles, '--sunk', '#f2f1f4'));
      }
    }
    this.invalidate();
  }

  dispose(){
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    this.resizeObserver.disconnect();
    document.removeEventListener('visibilitychange', this.boundVisibility);
    this.canvas.removeEventListener('pointerdown', this.boundPointerDown);
    this.canvas.removeEventListener('pointermove', this.boundPointerMove);
    this.canvas.removeEventListener('pointerup', this.boundPointerUp);
    this.canvas.removeEventListener('pointercancel', this.boundPointerCancel);
    this.canvas.removeEventListener('pointerleave', this.boundPointerLeave);
    this.canvas.removeEventListener('wheel', this.boundWheel);
    this.canvas.removeEventListener('keydown', this.boundKeyDown);
    for (const texture of this.textures) texture.dispose();
    for (const material of this.materials) material.dispose();
    this.cardGeometry.dispose();
    this.imageGeometry.dispose();
    this.scene.clear();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.canvas.width = 0;
    this.canvas.height = 0;
  }
}
