// Central game state + a debug/test hook on window.__gameState so Playwright
// (and the console) can read/assert state without inspecting canvas pixels.

import { RNG } from './rng.js';

export const Game = {
  screen: 'title',        // title | hub | battle | boon | result
  rng: new RNG(),         // run-scoped seed (reset per run)
  run: null,              // active run (in-memory only, never persisted)
  meta: null,             // persistent meta-progression (loaded from storage)
  battle: null,           // live battle World while on the battle screen
};

// Keep a flat snapshot on window for testing/debugging.
export function syncDebug(extra = {}) {
  window.__gameState = {
    screen: Game.screen,
    seed: Game.rng.seed,
    run: Game.run ? { mapIndex: Game.run.mapIndex, boons: (Game.run.boons || []).slice(), gods: (Game.run.gods || []).slice(), units: (Game.run.units || []).slice() } : null,
    meta: Game.meta ? { drachma: Game.meta.currency } : null,
    ...extra,
  };
  return window.__gameState;
}

// Collect console/runtime errors for the smoke-test gate.
window.__errors = window.__errors || [];
window.addEventListener('error', (e) => window.__errors.push(String(e.message || e)));
window.addEventListener('unhandledrejection', (e) => window.__errors.push('promise: ' + e.reason));
