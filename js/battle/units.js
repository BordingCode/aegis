// Mobile Age-of-War troops. Summoned at the fort, they march RIGHT down a lane
// until they meet an enemy, then stop and melee-trade. Have HP; enemies can kill
// them. Cannot hit flyers.

export function makeUnit(def, lane, dmgMult = 1) {
  return {
    side: 'ally', defId: def.id, name: def.name, emoji: def.emoji, art: def.art, color: def.color, kind: def.kind,
    lane, x: 0, y: 0,
    hp: def.hp, maxHp: def.hp, dmg: (def.dmg || 0) * dmgMult, atkCd: def.atkCd || 0.7, atkT: 0,
    speed: def.speed || 70, contact: def.contact || 52,
    fireRateMult: 1, hitFlash: 0, dead: false,
  };
}

// nearest enemy in the same lane ahead (to the RIGHT) within contact range.
function targetFor(world, u) {
  let best = null, bestX = Infinity;
  for (const e of world.enemies) {
    if (e.dead || e.flying || e.lane !== u.lane) continue;
    if (e.x >= u.x && e.x - u.x <= u.contact && e.x < bestX) { best = e; bestX = e.x; }
  }
  return best;
}

export function stepUnits(world, dt) {
  let anyDead = false;
  const rightLimit = world.level.spawnX - 20;
  for (const u of world.units) {
    if (u.dead) { anyDead = true; continue; }
    if (u.hitFlash > 0) u.hitFlash -= dt;
    u.y = world.laneCenterY(u.lane);
    const target = targetFor(world, u);
    if (target) {
      u.atkT -= dt * u.fireRateMult;
      if (u.atkT <= 0) { world.damageEnemy(target, u.dmg); u.atkT = u.atkCd; }
    } else {
      u.x = Math.min(rightLimit, u.x + u.speed * dt);
    }
  }
  if (anyDead) world.units = world.units.filter((u) => !u.dead);
}
