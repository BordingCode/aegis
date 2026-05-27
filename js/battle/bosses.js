// Boss behaviours for 'boss' missions. The boss IS world.target (a big creature drawn
// on the right with its own HP bar). It periodically performs telegraphed attacks and
// spawns adds; its phase escalates to 2 below half HP (attacks come faster/harder).
// Adds it spawns go into world.enemies; the player whittles the boss with units, ranged
// fire and god-powers. Called from world.step when level.mode === 'boss'.

export function stepBoss(world, dt) {
  const b = world.target;
  if (!b || b.hp <= 0) return;
  if (b.hitFlash > 0) b.hitFlash -= dt;
  b.phase = b.hp <= b.hpMax * 0.5 ? 2 : 1;
  b.cdT -= dt;
  if (b.cdT > 0) return;
  const fast = b.phase === 2;
  (BEHAVIOURS[b.bossId] || genericBoss)(world, b, fast);
}

const lanes = (w) => w.level.lanes;

function cerberus(world, b, fast) {
  b._beat = (b._beat || 0) + 1;
  if (b._beat % 2 === 0) {
    // three heads howl — loose a fast pack of shades/hounds across the flanks
    for (const lane of [0, 2, 4]) world.spawnEnemy('satyr', lane);
    if (fast) world.spawnEnemy('wraith', 2);
  } else {
    // maul a lane: savage your line there (telegraphed by 'bossSlam')
    const lane = world.rng.int(0, lanes(world) - 1);
    world.emit('bossSlam', { lane, y: world.laneCenterY(lane) });
    const dmg = fast ? 90 : 60;
    for (const u of world.units) if (!u.dead && u.lane === lane) world.damageAlly(u, dmg);
    for (const d of world.defenders) if (!d.dead && d.lane === lane) world.damageAlly(d, dmg);
  }
  b.cdT = fast ? 4.0 : 6.5;
}

function genericBoss(world, b, fast) {
  const lane = world.rng.int(0, lanes(world) - 1);
  world.spawnEnemy('shade', lane);
  world.spawnEnemy('shade', lane);
  if (fast) world.spawnEnemy('skeleton', world.rng.int(0, lanes(world) - 1));
  b.cdT = fast ? 4.0 : 7.0;
}

function hydra(world, b, fast) {
  b._beat = (b._beat || 0) + 1;
  if (b._beat % 2 === 0) {
    for (const lane of [1, 3]) world.spawnEnemy('skeleton', lane);
    if (fast) world.spawnEnemy('wraith', 2);
  } else if (!fast) {
    b.hp = Math.min(b.hpMax, b.hp + Math.round(b.hpMax * 0.04)); // regrow heads (phase 1 only)
    world.emit('bossSlam', { lane: 2, y: world.laneCenterY(2) });
  } else {
    const lane = world.rng.int(0, lanes(world) - 1);
    world.emit('bossSlam', { lane, y: world.laneCenterY(lane) });
    for (const u of world.units) if (!u.dead && u.lane === lane) world.damageAlly(u, 70);
  }
  b.cdT = fast ? 4.0 : 6.0;
}

function typhon(world, b, fast) {
  b._beat = (b._beat || 0) + 1;
  const m = b._beat % 3;
  if (m === 0) {
    for (const lane of [0, 2, 4]) world.spawnEnemy('wraith', lane);
  } else if (m === 1) {
    const lane = world.rng.int(0, lanes(world) - 1);
    world.emit('bossSlam', { lane, y: world.laneCenterY(lane) });
    const dmg = fast ? 120 : 80;
    for (const u of world.units) if (!u.dead && u.lane === lane) world.damageAlly(u, dmg);
    for (const d of world.defenders) if (!d.dead && d.lane === lane) world.damageAlly(d, dmg);
  } else {
    world.spawnEnemy('skeleton', world.rng.int(0, lanes(world) - 1));
    world.spawnEnemy('satyr', world.rng.int(0, lanes(world) - 1));
    if (fast) { // phase 2 — a firestorm across every lane
      for (let l = 0; l < lanes(world); l++) { world.emit('bossSlam', { lane: l, y: world.laneCenterY(l) }); for (const u of world.units) if (!u.dead && u.lane === l) world.damageAlly(u, 50); }
    }
  }
  b.cdT = fast ? 3.5 : 5.5;
}

const BEHAVIOURS = { cerberus, hydra, typhon };
