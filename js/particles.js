// Small bounded particle pool; dt is measured in seconds, like the engine.
export class Particles {
  constructor() {
    this.particles = [];
    this.maxParticles = 480;
    this.reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  burst(x, y, color, count = 18) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    count = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 18;
    count = Math.min(this.reducedMotion ? 5 : 72, count, this.maxParticles - this.particles.length);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (65 + Math.random() * 230) * (this.reducedMotion ? .45 : 1);
      const life = .20 + Math.random() * .36;
      this.particles.push({x, y, px:x, py:y, vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed, life, maxLife:life, size:1 + Math.random()*2, color:color || '#63f2ef'});
    }
  }

  update(dt) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    const drag = Math.exp(-3.4 * dt);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles[i] = this.particles[this.particles.length - 1];
        this.particles.pop();
        continue;
      }
      p.px = p.x; p.py = p.y;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= drag; p.vy = p.vy * drag + 90 * dt;
    }
  }

  render(ctx) {
    if (!this.particles.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      ctx.beginPath();
      ctx.moveTo(p.x - p.vx * .022, p.y - p.vy * .022);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  clear() { this.particles.length = 0; }
}
