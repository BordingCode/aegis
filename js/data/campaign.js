// The campaign — realms travelled as geographic branching mission maps. Each mission
// sits at a map position (pos, % of the board) and unlocks once its `requires` are
// cleared. `type` drives the node icon + battle mode; `level` is the battle config.
// Phase 3 builds the Mortal Realm (Greece); Phase 4 adds the Underworld + Olympus.

import { makeLevel, A1M1 } from './levels.js';

const EARTH = [
  { id: 'athens', name: 'The Dipylon Gate', type: 'defense', pos: { x: 49, y: 64 }, requires: [],
    level: A1M1, reward: { meta: 30 },
    blurb: 'Hold the gates of Athens against the first of the restless dead.' },
  { id: 'marathon', name: 'The Plain of Marathon', type: 'defense', pos: { x: 62, y: 50 }, requires: ['athens'],
    level: makeLevel({ id: 'm_marathon', act: 1, name: 'The Plain of Marathon', D: 6, scale: 1.3, W: 7, reward: 28 }),
    reward: { meta: 28 }, blurb: 'A horde sweeps across the open plain — hold the line.' },
  { id: 'nemea', name: 'The Nemean Den', type: 'assault', pos: { x: 34, y: 58 }, requires: ['athens'],
    level: makeLevel({ id: 'm_nemea', act: 1, name: 'The Nemean Den', mode: 'assault', target: { kind: 'stronghold', hp: 1500 }, D: 5, scale: 1.4, W: 6, favorStart: 110, favorMax: 520, reward: 36 }),
    reward: { meta: 36 }, blurb: "Storm the lion's den and break open its lair." },
  { id: 'delphi', name: 'The Oracle at Delphi', type: 'defense', pos: { x: 42, y: 38 }, requires: ['marathon'],
    level: makeLevel({ id: 'm_delphi', act: 1, name: 'The Oracle at Delphi', D: 8, scale: 1.7, W: 7, reward: 34 }),
    reward: { meta: 34 }, blurb: 'Defend the sacred sanctuary from those who would defile it.' },
  { id: 'thebes', name: 'The Gates of Thebes', type: 'assault', pos: { x: 40, y: 26 }, requires: ['delphi'],
    level: makeLevel({ id: 'm_thebes', act: 1, name: 'The Gates of Thebes', mode: 'assault', target: { kind: 'stronghold', hp: 2200 }, D: 7, scale: 1.8, W: 7, favorStart: 120, favorMax: 560, reward: 48 }),
    reward: { meta: 48 }, blurb: 'Lay siege to the seven-gated city.' },
  { id: 'crete', name: 'The Labyrinth of Crete', type: 'boss', pos: { x: 60, y: 88 }, requires: ['nemea'],
    level: makeLevel({ id: 'm_crete', act: 1, name: 'The Labyrinth of Crete', mode: 'boss', target: { kind: 'boss', bossId: 'minotaur', hp: 2600 }, relic: 'achilles_spear', D: 5, scale: 1.5, W: 6, favorStart: 110, favorMax: 560, reward: 60 }),
    reward: { meta: 60, relic: 'achilles_spear' }, blurb: 'Descend into the maze and slay the Minotaur.' },
  { id: 'polyphemus', name: 'The Cave of Polyphemus', type: 'boss', pos: { x: 74, y: 20 }, requires: ['crete', 'thebes'],
    level: makeLevel({ id: 'm_poly', act: 1, name: 'The Cave of Polyphemus', mode: 'boss', target: { kind: 'boss', bossId: 'cyclops', hp: 3600 }, relic: 'golden_fleece', D: 7, scale: 2.0, W: 7, favorStart: 120, favorMax: 600, reward: 100 }),
    reward: { meta: 100, relic: 'golden_fleece' }, realmEnd: true,
    blurb: "Blind the Cyclops in his cave. With his fall, the road to the Underworld opens." },
];

export const REALMS = [
  { id: 'earth', name: 'The Mortal Realm', sub: 'Ancient Greece', bg: 'maps/earth.webp', missions: EARTH },
  // Phase 4: { id: 'underworld', … }, { id: 'olympus', … }
];
export const REALM_BY_ID = Object.fromEntries(REALMS.map((r) => [r.id, r]));

export function missionsOf(realmId) { const r = REALM_BY_ID[realmId]; return r ? r.missions : []; }
export function missionById(realmId, id) { return missionsOf(realmId).find((m) => m.id === id) || null; }
export function isUnlocked(mission, clearedSet) { return mission.requires.every((id) => clearedSet.has(id)); }
export function realmEndMission(realmId) { return missionsOf(realmId).find((m) => m.realmEnd) || null; }
export function realmComplete(realmId, clearedSet) { const e = realmEndMission(realmId); return !!e && clearedSet.has(e.id); }
