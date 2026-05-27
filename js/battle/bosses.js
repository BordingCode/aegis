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

const BEHAVIOURS = { cerberus };
