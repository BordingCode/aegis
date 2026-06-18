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
    // slowT>0 marks a foe as "slowed" — read by interacting boons (Frostbite,
    // Conduction, Tidal Bounty) AND scales march speed via marchSpeed() below.
    stunT: 0, slowMult: 1, slowT: 0, hitFlash: 0, dead: false,
  };
}

// How much a slow source's speed reduction actually bites movement. The slow data
// (e.slowMult) is shared with the boon STATE layer; we apply it to movement gently
// so slows visibly matter without trivialising the march (a strong source like
// Poseidon's 0.4 mult becomes a ~30% slow, not a 60% lockdown).
const SLOW_BITE = 0.5;
// Effective march speed for an enemy this step, honouring an active slow.
export function marchSpeed(e) {
  if (e.slowT > 0 && e.slowMult < 1) return e.speed * (1 - (1 - e.slowMult) * SLOW_BITE);
  return e.speed;
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
    // Tick the slow timer so "slowed" is a transient STATE (read by the interacting
    // boons via e.slowT>0). While active it ALSO scales march speed (gently — see
    // marchSpeed below): slow now actually slows, and the Frost boons feed off slowT.
    if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) e.slowMult = 1; }
    if (e.stunT > 0) { e.stunT -= dt; continue; }
    e.y = world.laneCenterY(e.lane);
    const spd = marchSpeed(e);

    if (e.flying) {
      e.x -= spd * dt;
      if (e.x <= world.fortX) { e.dead = true; anyDead = true; world.hitGate(e); }
      continue;
    }
    const blocker = blockerFor(world, e);
    if (blocker) {
      e.atkT -= dt;
      if (e.atkT <= 0) { world.damageAlly(blocker, e.dmg); e.atkT = e.atkCd; }
    } else {
      e.x -= spd * dt;
      if (e.x <= world.fortX) { e.dead = true; anyDead = true; world.hitGate(e); }
    }
  }
  if (anyDead) world.enemies = world.enemies.filter((e) => !e.dead);
}
