// Boss behaviours for 'boss' missions. The boss IS world.target (a big creature drawn
// on the right with its own HP bar). It periodically performs telegraphed attacks and
// spawns adds; its phase escalates to 2 below half HP (attacks come faster/harder).
// Adds it spawns go into world.enemies; the player whittles the boss with units, ranged
// fire and god-powers. Called from world.step when level.mode === 'boss'.

export function stepBoss(world, dt) {
  const b = world.target;
  if (!b || b.hp <= 0) return;
  if (b.hitFlash > 0) b.hitFlash -= dt;
  // resolve any pending slam: the tell ran for ~0.7s, NOW the blow lands on its lane(s)
  if (b.slamT > 0) {
    b.slamT -= dt;
    if (b.slamT <= 0) { resolveSlam(world, b); b.slams = null; }
  }
  b.phase = b.hp <= b.hpMax * 0.5 ? 2 : 1;
  b.cdT -= dt;
  if (b.cdT > 0) return;
  const fast = b.phase === 2;
  (BEHAVIOURS[b.bossId] || genericBoss)(world, b, fast);
}

const lanes = (w) => w.level.lanes;

// Telegraph one or more lane slams: show the tell now, deal damage when slamT expires.
// `slams` is [{lane, dmg, hitDefenders}]. Deterministic — lanes are picked by seeded rng
// at telegraph time, never at resolve.
function telegraphSlam(world, b, slams) {
  b.slams = slams; b.slamT = 0.7;
  b.slamLanes = slams.map((s) => s.lane); // for the render warning glow
  for (const s of slams) world.emit('bossSlam', { lane: s.lane, y: world.laneCenterY(s.lane) });
}
function resolveSlam(world, b) {
  if (!b.slams) return;
  for (const s of b.slams) {
    for (const u of world.units) if (!u.dead && u.lane === s.lane) world.damageAlly(u, s.dmg);
    if (s.hitDefenders) for (const d of world.defenders) if (!d.dead && d.lane === s.lane) world.damageAlly(d, s.dmg);
  }
  b.slamLanes = null;
}

function cerberus(world, b, fast) {
  b._beat = (b._beat || 0) + 1;
  if (b._beat % 2 === 0) {
    // three heads howl — loose a fast pack of shades/hounds across the flanks
    for (const lane of [0, 2, 4]) world.spawnEnemy('satyr', lane);
    if (fast) world.spawnEnemy('wraith', 2);
  } else {
    // maul a lane: savage your line there (telegraphed, lands ~0.7s later)
    const lane = world.rng.int(0, lanes(world) - 1);
    telegraphSlam(world, b, [{ lane, dmg: fast ? 90 : 60, hitDefenders: true }]);
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
    telegraphSlam(world, b, [{ lane: 2, dmg: 0, hitDefenders: false }]); // a feint — no damage, just the tell
  } else {
    const lane = world.rng.int(0, lanes(world) - 1);
    telegraphSlam(world, b, [{ lane, dmg: 70, hitDefenders: false }]);
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
    telegraphSlam(world, b, [{ lane, dmg: fast ? 75 : 50, hitDefenders: true }]);
  } else {
    world.spawnEnemy('skeleton', world.rng.int(0, lanes(world) - 1));
    world.spawnEnemy('satyr', world.rng.int(0, lanes(world) - 1));
    if (fast) { // phase 2 — a firestorm telegraphed across every lane
      const slams = [];
      for (let l = 0; l < lanes(world); l++) slams.push({ lane: l, dmg: 32, hitDefenders: false });
      telegraphSlam(world, b, slams);
    }
  }
  b.cdT = fast ? 4.5 : 6.5;
}

const BEHAVIOURS = { cerberus, hydra, typhon };
