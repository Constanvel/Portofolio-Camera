// ══ portfolio · autofocus tracker ═══════════════════════════════════════════
// The bracket locks onto whichever film is nearest the centre and follows it
// as the plane moves. It keeps the camera-monitor idea without placing moving
// decoration around the empty edges of the page.
//
// Everything composites with `difference` in ONE neutral grey — the trick
// carried over from the last build. A plain white hairline disappears over
// white paper and a black one disappears over dark footage; a mid grey under
// difference reads the same faint line over paper, over a bright frame and
// over a dark one alike.

const INK = 'rgb(118,118,124)';

export class Trackers {
  constructor(){
    this.t = 0;
    this.lock = null;      // the bracket's current rect, lerped
  }

  resize(w, h){ this.w = w; this.h = h; }

  /** @param tiles rects of the films currently on screen */
  draw(ctx, dt, tiles){
    this.t += dt;
    const t = this.t / 1000;

    ctx.save();
    ctx.globalCompositeOperation = 'difference';
    ctx.strokeStyle = INK;
    ctx.fillStyle = INK;
    ctx.lineWidth = 1;

    // ── autofocus: lock the bracket to the film nearest the centre
    const cx = this.w / 2, cy = this.h / 2;
    let best = null, bestD = Infinity;
    for (const r of tiles){
      const d = Math.hypot(r.x + r.w / 2 - cx, r.y + r.h / 2 - cy);
      if (d < bestD){ bestD = d; best = r; }
    }
    if (best){
      const pad = 10;
      const target = { x: best.x - pad, y: best.y - pad, w: best.w + pad * 2, h: best.h + pad * 2 };
      if (!this.lock) this.lock = { ...target };
      // snap rather than crawl across the plane when the lock changes film
      const jump = Math.hypot(this.lock.x - target.x, this.lock.y - target.y) > best.w * 1.2;
      const k = jump ? 1 : 1 - Math.pow(0.002, dt / 1000);
      for (const key of ['x', 'y', 'w', 'h']) this.lock[key] += (target[key] - this.lock[key]) * k;

      const L = this.lock, arm = Math.min(26, L.w * 0.10);
      const corner = (x, y, sx, sy) => {
        ctx.beginPath();
        ctx.moveTo(x, y + sy * arm); ctx.lineTo(x, y); ctx.lineTo(x + sx * arm, y);
        ctx.stroke();
      };
      corner(L.x,        L.y,        1, 1);
      corner(L.x + L.w,  L.y,       -1, 1);
      corner(L.x,        L.y + L.h,  1, -1);
      corner(L.x + L.w,  L.y + L.h, -1, -1);

      // a small breathing crosshair at the centre of the lock
      const mx = L.x + L.w / 2, my = L.y + L.h / 2;
      const s = 5 + Math.sin(t * 1.6) * 1.4;
      ctx.beginPath();
      ctx.moveTo(mx - s, my); ctx.lineTo(mx + s, my);
      ctx.moveTo(mx, my - s); ctx.lineTo(mx, my + s);
      ctx.stroke();
    }

    ctx.restore();
  }
}
