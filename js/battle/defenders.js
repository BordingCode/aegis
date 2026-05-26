// Stationary defenders sit on a grid cell, have HP, and can be eaten by enemies.
//   favor  — Shrine: adds to Favor rate (set on build); floats +Favor so it reads.
//   aura   — Oracle: buffs the attack speed of nearby defenders AND troops.
//   ranged — Toxotes: shoots the nearest enemy ahead in its own lane.

function rangedTarget(world, d) {
  let best = null, bestX = Infinity;
  for (const e of world.enemies) {
    if (e.dead || e.lane !== d.lane) continue;
    if (e.flying && !d.canHitFlying) continue;
    if (e.x > d.x && e.x - d.x <= d.range && e.x < bestX) { best = e; bestX = e.x; }
  }
  return best;
}

export function makeDefender(def, lane, x, y) {
  return {
    side: 'ally', defId: def.id, name: def.name, emoji: def.emoji, art: def.art, color: def.color, icon: def.icon, kind: def.kind,
    lane, x, y, slot: 0, level: 1,
    hp: def.hp, maxHp: def.hp,
    range: def.range || 0, cooldown: def.cooldown || 0, cdT: 0, dmg: def.dmg || 0,
    proj: def.proj || null, canHitFlying: !!def.canHitFlying,
    gen: def.gen || 0, fxT: 1.0,
    auraRange: def.auraRange || 0, auraMult: def.auraMult || 1,
    fireRateMult: 1, fireFlash: 0, hitFlash: 0, dead: false, def,
  };
}

export function stepDefenders(world, dt) {
  const ds = world.defenders;
  for (const d of ds) d.fireRateMult = 1;
  for (const u of world.units) u.fireRateMult = 1;

  // Oracle auras buff nearby attackers (defenders + troops).
  for (const a of ds) {
    if (a.dead || a.kind !== 'aura') continue;
    const r2 = a.auraRange * a.auraRange;
    const buff = (t) => { const dx = t.x - a.x, dy = t.y - a.y; if (dx * dx + dy * dy <= r2) t.fireRateMult = Math.max(t.fireRateMult, a.auraMult); };
    for (const d of ds) { if (d !== a && d.kind !== 'aura' && d.kind !== 'favor') buff(d); }
    for (const u of world.units) buff(u);
  }

  let anyDead = false;
  for (const d of ds) {
    if (d.dead) { anyDead = true; continue; }
    if (d.hitFlash > 0) d.hitFlash -= dt;
    if (d.fireFlash > 0) d.fireFlash -= dt;
    if (d.kind === 'favor') {
      d.fxT -= dt;
      if (d.fxT <= 0) { world.emit('favorFloat', { x: d.x, y: d.y - 28, amt: d.gen }); d.fxT = 1.0; }
      continue;
    }
    if (d.kind === 'aura') continue;
    if (d.kind === 'ranged') {
      d.cdT -= dt * d.fireRateMult;
      if (d.cdT <= 0) {
        const target = rangedTarget(world, d);
        if (target) { world.spawnProjectile(d, target); d.cdT = d.cooldown; d.fireFlash = 0.12; }
      }
    }
  }
  if (anyDead) world.defenders = world.defenders.filter((d) => !d.dead);
}
