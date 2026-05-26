// Headless balance harness. The battle modules are pure logic (no DOM), so we can
// create a World and step it at 1/60s while a scripted "player" strategy spends
// REAL Favor (no cheats). Reports win/lose, fort damage, slain, timing.
//   node test/sim.mjs
import { createWorld } from '../js/battle/world.js';
import { LEVELS } from '../js/data/levels.js';
import { BOON_BY_ID } from '../js/data/boons.js';
import { RNG } from '../js/rng.js';

const STEP = 1 / 60;
// what the scripted player grabs between waves (cycled)
const BOON_PICKS = ['ares_edge', 'hermes_spoils', 'ares_frenzy', 'athena_aegis', 'zeus_thunder', 'athena_phalanx'];

// ---- strategies ----------------------------------------------------------
export function noPlay() {}

// A "competent but human-paced" player: at most one action every `interval` s.
export function competent(interval = 0.4) {
  let nextT = 0;
  return (w, t) => {
    if (t < nextT) return; nextT = t + interval;
    const lanes = w.level.lanes, f = w.favor.value;
    const enemyByLane = Array.from({ length: lanes }, () => []);
    for (const e of w.enemies) if (!e.dead) enemyByLane[e.lane].push(e);
    const archLvl = Array.from({ length: lanes }, () => 0);
    const shrineLane = Array.from({ length: lanes }, () => false);
    let shrines = 0;
    for (const d of w.defenders) { if (d.dead) continue; if (d.defId === 'toxotes') archLvl[d.lane] = Math.max(archLvl[d.lane], d.level); if (d.defId === 'shrine') { shrines++; shrineLane[d.lane] = true; } }
    const unitByLane = Array.from({ length: lanes }, () => 0);
    for (const u of w.units) if (!u.dead) unitByLane[u.lane]++;
    const minEnemyX = (l) => enemyByLane[l].reduce((m, e) => Math.min(m, e.x), Infinity);

    // 1. every active lane needs an archer on the wall
    for (let l = 0; l < lanes; l++) if (enemyByLane[l].length && archLvl[l] < 1 && f >= 60) return void w.recruitFort('toxotes', l);
    // 2. early economy: a few Shrines, spread across lanes
    if (shrines < 3 && t < 32 && f >= 50) { for (const l of [2, 0, 4, 1, 3]) if (!shrineLane[l]) return void w.recruitFort('shrine', l); }
    // 3. protect the wall: enemy nearing the fort with no troop holding -> sortie a Hoplite
    for (let l = 0; l < lanes; l++) if (minEnemyX(l) < 560 && unitByLane[l] === 0 && f >= 55) return void w.deployLane('hoplite', l);
    // 4. level up archers on active lanes
    for (let l = 0; l < lanes; l++) if (enemyByLane[l].length && archLvl[l] < 3 && f >= 60) return void w.recruitFort('toxotes', l);
    // 5. keep threatened lanes blocked further out
    for (let l = 0; l < lanes; l++) if (minEnemyX(l) < 800 && unitByLane[l] < 1 && f >= 55) return void w.deployLane('hoplite', l);
    // 6. Zeus on the densest cluster
    if (w.powerReady() && w.enemies.length >= 3) {
      const R = w.power.radius; let best = null, bestN = 2;
      for (const e of w.enemies) { if (e.dead) continue; let n = 0; for (const o of w.enemies) { if (o.dead) continue; const dx = o.x - e.x, dy = o.y - e.y; if (dx * dx + dy * dy <= R * R) n++; } if (n > bestN) { bestN = n; best = e; } }
      if (best) return void w.castPowerAt(best.x, best.y);
    }
  };
}

// A naive player: only stacks archers on the wall. No economy, no troops, no Zeus.
export function naive(interval = 0.5) {
  let nextT = 0;
  return (w, t) => {
    if (t < nextT) return; nextT = t + interval;
    const lanes = w.level.lanes, f = w.favor.value;
    const enemyByLane = Array.from({ length: lanes }, () => 0);
    for (const e of w.enemies) if (!e.dead) enemyByLane[e.lane]++;
    const archLvl = Array.from({ length: lanes }, () => 0);
    for (const d of w.defenders) if (!d.dead && d.defId === 'toxotes') archLvl[d.lane] = Math.max(archLvl[d.lane], d.level);
    for (let l = 0; l < lanes; l++) if (enemyByLane[l] && archLvl[l] < 3 && f >= 60) return void w.recruitFort('toxotes', l);
  };
}

// ---- runner --------------------------------------------------------------
export function run(level, strategy, label) {
  const w = createWorld(level, { rng: new RNG(7), onEvent: () => {} });
  let minFort = w.gateHp, firstLeak = null, builds = 0, deploys = 0, casts = 0;
  const _b = w.recruitFort.bind(w), _d = w.deployLane.bind(w), _c = w.castPowerAt.bind(w);
  w.recruitFort = (...a) => { const r = _b(...a); if (r) builds++; return r; };
  w.deployLane = (...a) => { const r = _d(...a); if (r) deploys++; return r; };
  w.castPowerAt = (...a) => { const r = _c(...a); if (r) casts++; return r; };
  let t = 0, boonIdx = 0, boons = 0;
  for (let s = 0; (w.status === 'playing' || w.status === 'waveclear') && t < 400; s++, t += STEP) {
    if (w.status === 'waveclear') {
      const b = BOON_BY_ID[BOON_PICKS[boonIdx++ % BOON_PICKS.length]];
      if (b) { w.pickBoon(b); boons++; }
      w.nextWave();
      continue;
    }
    w.step(STEP);
    strategy(w, t);
    if (w.gateHp < minFort) minFort = w.gateHp;
    if (firstLeak === null && w.gateHp < w.gateHpMax) firstLeak = t;
  }
  const pct = Math.round((w.gateHp / w.gateHpMax) * 100);
  console.log(`${label.padEnd(12)} ${w.status.toUpperCase().padEnd(5)}  fort ${Math.max(0, Math.round(w.gateHp))}/${w.gateHpMax} (${pct}%)  wave ${w.spawner.current + 1}/${w.spawner.waveCount}  slain ${w.killed}/${w.spawner.total}  boons ${boons}  builds ${builds} troops ${deploys} casts ${casts}`);
  return { status: w.status, pct, killed: w.killed, total: w.spawner.total, boons };
}

// Play the WHOLE run: map after map, carrying boons forward (re-applied to each
// fresh world) exactly like the real game. `makeStrat` is a factory so every map
// gets a fresh strategy closure (its action-timer resets per map).
export function runFull(makeStrat, label = 'full-run') {
  const carry = [];                 // boon ids accumulated across the run
  let totalKilled = 0, mapsCleared = 0, status = 'won', boonIdx = 0;
  for (let mi = 0; mi < LEVELS.length; mi++) {
    const level = LEVELS[mi];
    const w = createWorld(level, { rng: new RNG(7 + mi * 1013), onEvent: () => {} });
    for (const id of carry) { const b = BOON_BY_ID[id]; if (b) { b.apply(w); w.boons.push(id); } }
    const strategy = makeStrat();
    let t = 0;
    for (let s = 0; (w.status === 'playing' || w.status === 'waveclear') && t < 400; s++, t += STEP) {
      if (w.status === 'waveclear') {
        const id = BOON_PICKS[boonIdx++ % BOON_PICKS.length];
        const b = BOON_BY_ID[id]; if (b) { w.pickBoon(b); carry.push(id); }
        w.nextWave();
        continue;
      }
      w.step(STEP);
      strategy(w, t);
    }
    totalKilled += w.killed;
    const pct = Math.round((w.gateHp / w.gateHpMax) * 100);
    console.log(`  map ${mi + 1} ${level.id.padEnd(6)} ${w.status.toUpperCase().padEnd(5)} fort ${Math.max(0, Math.round(w.gateHp))}/${w.gateHpMax} (${String(pct).padStart(3)}%)  slain ${String(w.killed).padStart(3)}/${w.spawner.total}  scale ${level.enemyScale}  boons ${carry.length}`);
    if (w.status !== 'won') { status = w.status; mapsCleared = mi; break; }
    mapsCleared = mi + 1;
  }
  console.log(`${label.padEnd(12)} ${status.toUpperCase()} — cleared ${mapsCleared}/${LEVELS.length} maps, ${totalKilled} slain, ${carry.length} boons stacked`);
  return { status, mapsCleared, total: LEVELS.length, killed: totalKilled, boons: carry.length };
}

// Only run the report when invoked directly (node test/sim.mjs), not on import.
if (import.meta.url === `file://${process.argv[1]}`) {
  const level = LEVELS[0];
  console.log('=== Aegis balance — map 1:', level.name, `(favor start ${level.favor.start}, rate ${level.favor.rate}/s) ===`);
  run(level, noPlay, 'no-play');
  run(level, naive(0.5), 'naive');
  run(level, competent(0.6), 'slow(0.6s)');
  run(level, competent(0.4), 'competent');
  run(level, competent(0.25), 'fast(0.25s)');
  console.log('\n=== Full run (boons persist across maps) ===');
  runFull(() => competent(0.4), 'competent');
  runFull(() => competent(0.9), 'sluggish');
  runFull(() => competent(1.4), 'careless');
}
