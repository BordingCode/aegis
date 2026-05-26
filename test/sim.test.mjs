// Balance + determinism regression guard. Runs the headless battle sim with
// scripted strategies and asserts the Act-1 map stays "tough but winnable":
// no defence loses, competent play wins but takes fort damage.
//   npm test   (node --test test/)
import { test } from 'node:test';
import assert from 'node:assert';
import { LEVELS } from '../js/data/levels.js';
import { run, noPlay, competent } from '../tools/sim.mjs';

test('Act 1: no defence loses', () => {
  assert.equal(run(LEVELS[0], noPlay, 'no-play').status, 'lost');
});

test('Act 1: competent play wins but takes fort damage (tough, not trivial)', () => {
  const r = run(LEVELS[0], competent(0.4), 'competent');
  assert.equal(r.status, 'won', 'competent play should win');
  assert.ok(r.pct < 95, `fort should take real damage (tough); got ${r.pct}%`);
  assert.ok(r.killed >= r.total - 40, `should clear most enemies; got ${r.killed}/${r.total}`);
  assert.ok(r.boons >= 3, `should pick boons between waves; got ${r.boons}`);
});

test('determinism: same seed → same result', () => {
  const a = run(LEVELS[0], competent(0.4), 'a');
  const b = run(LEVELS[0], competent(0.4), 'b');
  assert.deepEqual({ s: a.status, p: a.pct, k: a.killed }, { s: b.status, p: b.pct, k: b.killed });
});
