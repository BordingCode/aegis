// Headless balance harness. The battle modules are pure logic (no DOM), so we can
// create a World and step it at 1/60s while a scripted "player" strategy spends
// REAL Favor (no cheats). Reports win/lose, fort damage, slain, timing.
//   node test/sim.mjs
import { createWorld } from '../js/battle/world.js';
import { LEVELS } from '../js/data/levels.js';
import { RNG } from '../js/rng.js';

const STEP = 1 / 60;

// ---- strategies ----------------------------------------------------------
export function noPlay() {}

// A "competent but human-paced" player: at most one action every `interval` s.
export function competent(interval = 0.4) {
  let nextT = 0;
  return (w, t) => {
    if (t < nextT) return; nextT = t + interval;
    const L = w.level, lanes = L.lanes, f = w.favor.value;
    const enemyByLane = Array.from({ length: lanes }, () => []);
    for (const e of w.enemies) if (!e.dead) enemyByLane[e.lane].push(e);
    const toxByLane = Array.from({ length: lanes }, () => 0);
    let shrines = 0;
    for (const d of w.defenders) { if (d.defId === 'toxotes') toxByLane[d.lane]++; if (d.defId === 'shrine') shrines++; }
    const unitByLane = Array.from({ length: lanes }, () => 0);
    for (const u of w.units) if (!u.dead) unitByLane[u.lane]++;
    const place = (lane, defId, cols) => { for (const c of cols) if (w.canPlace(lane, c)) return w.buildCell(lane, c, defId); return false; };
    const minEnemyX = (lane) => enemyByLane[lane].reduce((m, e) => Math.min(m, e.x), Infinity);

    // 1. emergency: enemy close to fort with no blocker -> hoplite
    for (let l = 0; l < lanes; l++) if (minEnemyX(l) < 470 && unitByLane[l] === 0 && f >= 60) return void w.deployLane('hoplite', l);
    // 2. defend any active lane lacking an archer
    for (let l = 0; l < lanes; l++) if (enemyByLane[l].length && toxByLane[l] < 1 && f >= 75) return void place(l, 'toxotes', [6, 5, 7, 4]);
    // 3. economy early
    if (shrines < 3 && t < 35 && f >= 50) { for (let l = 0; l < lanes; l++) if (place(l, 'shrine', [0, 1])) return; }
    // 4. reinforce active lanes to 2 archers
    for (let l = 0; l < lanes; l++) if (enemyByLane[l].length && toxByLane[l] < 2 && f >= 75) return void place(l, 'toxotes', [5, 4, 6, 7, 3]);
    // 5. keep threatened lanes blocked
    for (let l = 0; l < lanes; l++) if (minEnemyX(l) < 760 && unitByLane[l] === 0 && f >= 60) return void w.deployLane('hoplite', l);
    // 6. Zeus on the densest cluster
    if (w.powerReady() && w.enemies.length >= 3) {
      const R = w.power.radius; let best = null, bestN = 2;
      for (const e of w.enemies) { if (e.dead) continue; let n = 0; for (const o of w.enemies) { if (o.dead) continue; const dx = o.x - e.x, dy = o.y - e.y; if (dx * dx + dy * dy <= R * R) n++; } if (n > bestN) { bestN = n; best = e; } }
      if (best) return void w.castPowerAt(best.x, best.y);
    }
  };
}

// A naive player: only spams archers reactively. No economy, no troops, no Zeus.
export function naive(interval = 0.5) {
  let nextT = 0;
  return (w, t) => {
    if (t < nextT) return; nextT = t + interval;
    const lanes = w.level.lanes, f = w.favor.value;
    const enemyByLane = Array.from({ length: lanes }, () => 0);
    for (const e of w.enemies) if (!e.dead) enemyByLane[e.lane]++;
    const toxByLane = Array.from({ length: lanes }, () => 0);
    for (const d of w.defenders) if (d.defId === 'toxotes') toxByLane[d.lane]++;
    for (let l = 0; l < lanes; l++) if (enemyByLane[l] && toxByLane[l] < 2 && f >= 75) { for (const c of [6, 5, 7, 4, 3]) if (w.canPlace(l, c)) return void w.buildCell(l, c, 'toxotes'); }
  };
}

// ---- runner --------------------------------------------------------------
export function run(level, strategy, label) {
  const w = createWorld(level, { rng: new RNG(7), onEvent: () => {} });
  let minFort = w.gateHp, firstLeak = null, builds = 0, deploys = 0, casts = 0;
  const _b = w.buildCell.bind(w), _d = w.deployLane.bind(w), _c = w.castPowerAt.bind(w);
  w.buildCell = (...a) => { const r = _b(...a); if (r) builds++; return r; };
  w.deployLane = (...a) => { const r = _d(...a); if (r) deploys++; return r; };
  w.castPowerAt = (...a) => { const r = _c(...a); if (r) casts++; return r; };
  let t = 0;
  for (let s = 0; w.status === 'playing' && t < 300; s++, t += STEP) {
    w.step(STEP);
    strategy(w, t);
    if (w.gateHp < minFort) minFort = w.gateHp;
    if (firstLeak === null && w.gateHp < w.gateHpMax) firstLeak = t;
  }
  const pct = Math.round((w.gateHp / w.gateHpMax) * 100);
  console.log(`${label.padEnd(12)} ${w.status.toUpperCase().padEnd(5)}  fort ${Math.max(0, Math.round(w.gateHp))}/${w.gateHpMax} (${pct}%)  slain ${w.killed}/${w.spawner.total}  firstLeak ${firstLeak ? firstLeak.toFixed(0) + 's' : '—'}  builds ${builds} troops ${deploys} casts ${casts}  end ${Math.round(w.elapsed)}s`);
  return { status: w.status, pct, killed: w.killed, total: w.spawner.total };
}

// Only run the report when invoked directly (node test/sim.mjs), not on import.
if (import.meta.url === `file://${process.argv[1]}`) {
  const level = LEVELS[0];
  console.log('=== Aegis balance —', level.name, `(favor start ${level.favor.start}, rate ${level.favor.rate}/s) ===`);
  run(level, noPlay, 'no-play');
  run(level, naive(0.5), 'naive');
  run(level, competent(0.6), 'slow(0.6s)');
  run(level, competent(0.4), 'competent');
  run(level, competent(0.25), 'fast(0.25s)');
}
