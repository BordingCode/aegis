// Enemies march LEFT along their lane toward the fort. A ground enemy stops to
// attack (destroy) the nearest friendly in its path within contact range — your
// stationary defenders AND mobile troops (PvZ "eat"). Flyers ignore all ground
// units and rush the fort; only ranged/Zeus can kill them.

const CONTACT = 54;

export function makeEnemy(def, lane) {
  return {
    side: 'enemy', defId: def.id, name: def.name, emoji: def.emoji, art: def.art, color: def.color,
    lane, x: 0, y: 0,
    hp: def.hp, maxHp: def.hp, armor: def.armor || 0, speed: def.speed, flying: !!def.flying,
    resist: def.resist || null,
    dmg: def.dmg || 0, atkCd: def.atkCd || 1, atkT: 0,
    bounty: def.bounty, gateDmg: def.gateDmg, boss: !!def.boss,
    stunT: 0, hitFlash: 0, dead: false,
  };
}

// nearest friendly in the same lane that is to the LEFT of the enemy and within
// contact range (the thing it bumps into and eats).
function blockerFor(world, e) {
  let best = null, bestX = -Infinity;
  const consider = (f) => {
    if (f.dead || f.lane !== e.lane) return;
    if (f.x <= e.x && e.x - f.x <= CONTACT && f.x > bestX) { best = f; bestX = f.x; }
  };
  for (const u of world.units) consider(u);
  for (const d of world.defenders) consider(d);
  return best;
}

export function stepEnemies(world, dt) {
  let anyDead = false;
  for (const e of world.enemies) {
    if (e.dead) { anyDead = true; continue; }
    if (e.hitFlash > 0) e.hitFlash -= dt;
    if (e.stunT > 0) { e.stunT -= dt; continue; }
    e.y = world.laneCenterY(e.lane);

    if (e.flying) {
      e.x -= e.speed * dt;
      if (e.x <= world.fortX) { e.dead = true; anyDead = true; world.hitGate(e); }
      continue;
    }
    const blocker = blockerFor(world, e);
    if (blocker) {
      e.atkT -= dt;
      if (e.atkT <= 0) { world.damageAlly(blocker, e.dmg); e.atkT = e.atkCd; }
    } else {
      e.x -= e.speed * dt;
      if (e.x <= world.fortX) { e.dead = true; anyDead = true; world.hitGate(e); }
    }
  }
  if (anyDead) world.enemies = world.enemies.filter((e) => !e.dead);
}
