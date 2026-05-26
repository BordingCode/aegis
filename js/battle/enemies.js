// Enemy instances: a scalar `dist` along the path is the source of truth for
// position. Damage/death is applied via world.damageEnemy; here we just move them
// and detect reaching the gate.

export function makeEnemy(def, dist = 0) {
  return {
    defId: def.id, name: def.name, emoji: def.emoji, art: def.art, color: def.color,
    hp: def.hp, maxHp: def.hp, armor: def.armor || 0,
    speed: def.speed, flying: !!def.flying,
    bounty: def.bounty, gateDmg: def.gateDmg,
    dist, x: 0, y: 0, angle: 0,
    slowMult: 1, slowT: 0, stunT: 0, hitFlash: 0, dead: false,
  };
}

export function stepEnemies(world, step) {
  const path = world.path;
  let anyDead = false;
  for (const e of world.enemies) {
    if (e.dead) { anyDead = true; continue; }
    if (e.hitFlash > 0) e.hitFlash -= step;
    if (e.slowT > 0) { e.slowT -= step; if (e.slowT <= 0) e.slowMult = 1; }
    if (e.stunT > 0) { e.stunT -= step; }
    else { e.dist += e.speed * e.slowMult * step; }
    const p = path.posAt(e.dist);
    e.x = p.x; e.y = p.y; e.angle = p.angle;
    if (e.dist >= path.length) {
      e.dead = true; anyDead = true;
      world.gateHp = Math.max(0, world.gateHp - e.gateDmg);
      world.emit('gate', { e });
    }
  }
  if (anyDead) world.enemies = world.enemies.filter((e) => !e.dead);
}
