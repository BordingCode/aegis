// Balance + determinism regression guard. Runs the headless battle sim with
// scripted strategies and asserts the Act-1 map stays "tough but winnable":
// no defence loses, competent play wins but takes fort damage.
//   npm test   (node --test test/)
import { test } from 'node:test';
import assert from 'node:assert';
import { LEVELS, RUN_LENGTH } from '../js/data/levels.js';
import { run, noPlay, competent, runFull } from '../tools/sim.mjs';
import { RNG } from '../js/rng.js';
import { createWorld } from '../js/battle/world.js';

// minimal localStorage shim so save.js works under Node
globalThis.localStorage = globalThis.localStorage || (() => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
})();
const { saveRun, loadRun, clearRun } = await import('../js/save.js');

test('Act 1 map 1: no defence loses', () => {
  assert.equal(run(LEVELS[0], noPlay, 'no-play').status, 'lost');
});

test('Act 1 map 1: competent play wins but takes fort damage (the early skill gate)', () => {
  const r = run(LEVELS[0], competent(0.4), 'competent');
  assert.equal(r.status, 'won', 'competent play should win');
  assert.ok(r.pct < 95, `fort should take real damage (tough); got ${r.pct}%`);
  assert.ok(r.killed >= r.total - 40, `should clear most enemies; got ${r.killed}/${r.total}`);
  assert.ok(r.boons >= 3, `should pick boons between waves; got ${r.boons}`);
});

test('Full run: competent play clears all maps, boons compounding across them', () => {
  const r = runFull(() => competent(0.4), 'full');
  assert.equal(r.status, 'won', 'competent should clear the whole run');
  assert.equal(r.mapsCleared, RUN_LENGTH, `should clear every map; got ${r.mapsCleared}/${RUN_LENGTH}`);
  assert.ok(r.boons >= 40, `boons should persist + stack across maps; got ${r.boons}`);
});

test('powers are built from the loadout gods', () => {
  const w = createWorld(LEVELS[0], { rng: new RNG(1), loadout: { gods: ['zeus', 'poseidon'] } });
  assert.deepEqual(w.powers.map((p) => p.god), ['zeus', 'poseidon']);
  const all = createWorld(LEVELS[0], { rng: new RNG(1) }); // no loadout → every god
  assert.ok(all.powers.length >= 4, `default should bring all gods; got ${all.powers.length}`);
});

test('a run round-trips through saveRun → loadRun, and clears', () => {
  clearRun();
  saveRun({ seed: 123, mapIndex: 3, boons: ['ares_edge', 'zeus_thunder'], gods: ['zeus', 'ares'], units: ['toxotes', 'phalanx'] });
  const r = loadRun();
  assert.equal(r.mapIndex, 3);
  assert.deepEqual(r.gods, ['zeus', 'ares']);
  assert.deepEqual(r.boons, ['ares_edge', 'zeus_thunder']);
  clearRun();
  assert.equal(loadRun(), null);
});

test('Campaign: every mission is clearable standalone by competent play', async () => {
  const { REALMS } = await import('../js/data/campaign.js');
  const KIT = {
    earth: { gods: ['zeus'], relics: [] },
    underworld: { gods: ['zeus', 'poseidon'], relics: ['achilles_spear', 'golden_fleece'] },
    olympus: { gods: ['zeus', 'poseidon'], relics: ['achilles_spear', 'golden_fleece', 'winged_sandals', 'medusa_gaze'] },
  };
  for (const realm of REALMS) for (const m of realm.missions) {
    const r = run(m.level, competent(0.4), m.id, KIT[realm.id]);
    assert.equal(r.status, 'won', `${realm.id}/${m.id} (${m.level.mode || 'defense'}) should be clearable; got ${r.status}`);
  }
});

test('determinism: same seed → same result', () => {
  const a = run(LEVELS[0], competent(0.4), 'a');
  const b = run(LEVELS[0], competent(0.4), 'b');
  assert.deepEqual({ s: a.status, p: a.pct, k: a.killed }, { s: b.status, p: b.pct, k: b.killed });
});
