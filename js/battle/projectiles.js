// Pooled projectiles. Homing onto their target; on impact apply damage (with
// optional splash radius). Uses the engine Pool to avoid per-frame allocation.

import { Pool } from '../engine/pool.js';
import { dist2 } from '../engine/vec.js';

export function createProjectilePool() {
  return new Pool(
    () => ({}),
    (o, d, target) => {
      o.x = d.x; o.y = d.y - 18;
      o.target = target; o.tx = target.x; o.ty = target.y;
      o.speed = 480; o.dmg = d.dmg; o.splash = d.splash || 0; o.proj = d.proj; o.type = d.dmgType || 'ranged';
    },
  );
}

export function stepProjectiles(world, step) {
  for (const p of world.projectiles.active) {
    if (p._dead) continue;
    if (p.target && !p.target.dead) { p.tx = p.target.x; p.ty = p.target.y; }
    const dx = p.tx - p.x, dy = p.ty - p.y;
    const len = Math.hypot(dx, dy);
    const stepLen = p.speed * step;
    if (len <= stepLen || len < 6) {
      if (p.splash > 0) {
        const s2 = p.splash * p.splash;
        for (const e of world.enemies) { if (!e.dead && dist2(p.tx, p.ty, e.x, e.y) <= s2) world.damageEnemy(e, p.dmg, p.type); }
      } else if (p.target && !p.target.dead) {
        world.damageEnemy(p.target, p.dmg, p.type);
      }
      p._dead = true;
      world.emit('impact', { x: p.tx, y: p.ty, splash: p.splash });
    } else {
      p.x += (dx / len) * stepLen; p.y += (dy / len) * stepLen;
    }
  }
  world.projectiles.sweep();
}
