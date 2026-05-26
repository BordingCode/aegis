// Defenders sit on fixed plots. Kinds:
//   favor  — Shrine: generates Favor, no attack.
//   aura   — Oracle: buffs nearby attackers' fire rate, no attack.
//   melee  — Hoplite: short range, instant damage on cooldown (can't hit flyers).
//   projectile — Toxotes: spawns a homing projectile (can hit flyers).

import { dist2 } from '../engine/vec.js';

export function makeDefender(def, plot) {
  return {
    defId: def.id, name: def.name, emoji: def.emoji, art: def.art, color: def.color, icon: def.icon, kind: def.kind,
    x: plot.x, y: plot.y, plotId: plot.id,
    range: def.range || 0, cooldown: def.cooldown || 0, cdT: 0,
    dmg: def.dmg || 0, proj: def.proj || null, splash: def.splash || 0,
    canHitFlying: !!def.canHitFlying,
    gen: def.gen || 0, auraRange: def.auraRange || 0, auraMult: def.auraMult || 1,
    tier: 1, fireRateMult: 1, fireFlash: 0, def,
  };
}

function acquire(world, d) {
  const r2 = d.range * d.range;
  let best = null, bestDist = -1;
  for (const e of world.enemies) {
    if (e.dead) continue;
    if (e.flying && !d.canHitFlying) continue;
    if (dist2(d.x, d.y, e.x, e.y) <= r2 && e.dist > bestDist) { best = e; bestDist = e.dist; }
  }
  return best;
}

export function stepDefenders(world, step) {
  const ds = world.defenders;
  // recompute aura buffs each step (cheap at our counts)
  for (const d of ds) d.fireRateMult = 1;
  for (const a of ds) {
    if (a.kind !== 'aura') continue;
    const r2 = a.auraRange * a.auraRange;
    for (const d of ds) {
      if (d === a || d.kind === 'aura' || d.kind === 'favor') continue;
      if (dist2(a.x, a.y, d.x, d.y) <= r2) d.fireRateMult = Math.max(d.fireRateMult, a.auraMult);
    }
  }
  for (const d of ds) {
    if (d.fireFlash > 0) d.fireFlash -= step;
    if (d.kind === 'favor' || d.kind === 'aura') continue;
    d.cdT -= step * d.fireRateMult;
    if (d.cdT > 0) continue;
    const target = acquire(world, d);
    if (!target) continue;
    d.cdT = d.cooldown;
    d.fireFlash = 0.12;
    if (d.kind === 'melee') { world.damageEnemy(target, d.dmg); world.emit('melee', { d, target }); }
    else if (d.kind === 'projectile') { world.spawnProjectile(d, target); }
  }
}
