// Persistent meta-progression. Stored in localStorage as a single JSON object.
// The active RUN is NOT saved here — death restarts the run from map 1; only
// meta (unlocks, Drachma, permanent upgrades, codex) carries over.

const KEY = 'aegis_meta_v1';

export function defaultMeta() {
  return {
    v: 1,
    currency: 0,                          // Drachma — earned per run, spent in the hub
    unlockedDefenders: ['shrine', 'hoplite', 'toxotes', 'oracle'], // prototype starters
    unlockedPowers: ['zeus_bolt'],
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
