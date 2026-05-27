// Persistent meta-progression. Stored in localStorage as a single JSON object.
// The active RUN is NOT saved here — death restarts the run from map 1; only
// meta (unlocks, Drachma, permanent upgrades, codex) carries over.

const KEY = 'aegis_meta_v1';
const RUN_KEY = 'aegis_run_v1';

export function defaultMeta() {
  return {
    v: 1,
    currency: 0,                          // Drachma — earned per run, spent in the hub
    unlockedDefenders: ['shrine', 'hoplite', 'toxotes', 'oracle'], // starters; rest bought in the hub
    unlockedPowers: ['zeus_bolt'],
    unlockedGods: ['zeus'],               // gods you can bring; more bought in the hub
    upgrades: {},                         // { upgradeId: true } purchased permanent upgrades
    progress: { bestLevel: 0, runs: 0, wins: 0 },
    settings: { speed: 1 },
    codex: { enemiesSeen: [], lore: [] },
  };
}

export function loadMeta() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const m = JSON.parse(raw);
      if (m && m.v === 1) {
        const d = defaultMeta();
        return {
          ...d, ...m,
          unlockedDefenders: m.unlockedDefenders || d.unlockedDefenders,
          unlockedPowers: m.unlockedPowers || d.unlockedPowers,
          unlockedGods: m.unlockedGods || d.unlockedGods,
          upgrades: { ...(m.upgrades || {}) },
          progress: { ...d.progress, ...(m.progress || {}) },
          settings: { ...d.settings, ...(m.settings || {}) },
          codex: { ...d.codex, ...(m.codex || {}) },
        };
      }
    }
  } catch (_) { /* corrupt → fresh */ }
  return defaultMeta();
}

export function saveMeta(meta) {
  try { localStorage.setItem(KEY, JSON.stringify(meta)); } catch (_) { /* private mode / full */ }
}

export function resetMeta() {
  try { localStorage.removeItem(KEY); } catch (_) {}
  return defaultMeta();
}

// --- active run persistence (so you can leave the page and Continue) ---------
// Only the resumable shape is stored: which map, stacked boons, and the loadout.
// Resuming restarts the CURRENT map from its first wave (no mid-battle state).
export function saveRun(run) {
  if (!run) return clearRun();
  try {
    localStorage.setItem(RUN_KEY, JSON.stringify({
      v: 1, seed: run.seed, mapIndex: run.mapIndex,
      boons: run.boons || [], gods: run.gods || [], units: run.units || [], earned: run.earned || 0,
    }));
  } catch (_) { /* private mode / full */ }
}

export function loadRun() {
  try {
    const raw = localStorage.getItem(RUN_KEY);
    if (raw) {
      const r = JSON.parse(raw);
      if (r && r.v === 1 && Number.isInteger(r.mapIndex)) {
        return { seed: r.seed >>> 0, mapIndex: r.mapIndex, boons: r.boons || [], gods: r.gods || [], units: r.units || [], earned: r.earned || 0 };
      }
    }
  } catch (_) { /* corrupt → no run */ }
  return null;
}

export function clearRun() {
  try { localStorage.removeItem(RUN_KEY); } catch (_) {}
}
