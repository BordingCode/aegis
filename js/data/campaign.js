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
    level: makeLevel({ id: 'm_marathon', act: 1, name: 'The Plain of Marathon', D: 5, scale: 1.1, W: 6, favorStart: 90, reward: 28 }),
    reward: { meta: 28 }, blurb: 'A horde sweeps across the open plain — hold the line.' },
  { id: 'nemea', name: 'The Nemean Den', type: 'assault', pos: { x: 34, y: 58 }, requires: ['athens'],
    level: makeLevel({ id: 'm_nemea', act: 1, name: 'The Nemean Den', mode: 'assault', target: { kind: 'stronghold', hp: 1200 }, D: 4, scale: 1.2, W: 6, favorStart: 120, favorMax: 540, reward: 36 }),
    reward: { meta: 36 }, blurb: "Storm the lion's den and break open its lair." },
  { id: 'delphi', name: 'The Oracle at Delphi', type: 'defense', pos: { x: 42, y: 38 }, requires: ['marathon'],
    level: makeLevel({ id: 'm_delphi', act: 1, name: 'The Oracle at Delphi', D: 5, scale: 1.2, W: 7, favorStart: 95, reward: 34 }),
    reward: { meta: 34 }, blurb: 'Defend the sacred sanctuary from those who would defile it.' },
  { id: 'thebes', name: 'The Gates of Thebes', type: 'assault', pos: { x: 40, y: 26 }, requires: ['delphi'],
    level: makeLevel({ id: 'm_thebes', act: 1, name: 'The Gates of Thebes', mode: 'assault', target: { kind: 'stronghold', hp: 1600 }, D: 6, scale: 1.4, W: 7, favorStart: 120, favorMax: 580, reward: 48 }),
    reward: { meta: 48 }, blurb: 'Lay siege to the seven-gated city.' },
  { id: 'crete', name: 'The Labyrinth of Crete', type: 'boss', pos: { x: 60, y: 88 }, requires: ['nemea'],
    level: makeLevel({ id: 'm_crete', act: 1, name: 'The Labyrinth of Crete', mode: 'boss', target: { kind: 'boss', bossId: 'minotaur', hp: 2800 }, relic: 'achilles_spear', D: 5, scale: 1.5, W: 6, favorStart: 115, favorMax: 580, reward: 60 }),
    reward: { meta: 60, relic: 'achilles_spear' }, blurb: 'Descend into the maze and slay the Minotaur.' },
  { id: 'polyphemus', name: 'The Cave of Polyphemus', type: 'boss', pos: { x: 74, y: 20 }, requires: ['crete', 'thebes'],
    level: makeLevel({ id: 'm_poly', act: 1, name: 'The Cave of Polyphemus', mode: 'boss', target: { kind: 'boss', bossId: 'cyclops', hp: 3200 }, relic: 'golden_fleece', D: 6, scale: 1.6, W: 7, favorStart: 125, favorMax: 620, reward: 100 }),
    reward: { meta: 100, relic: 'golden_fleece' }, realmEnd: true,
    blurb: "Blind the Cyclops in his cave. With his fall, the road to the Underworld opens." },
];

// --- Act II: the Underworld (Hades backdrop; the medium roster — a step up from Earth) ---
const UW = (o) => makeLevel({ ...o, bg: 'backgrounds/act3.webp', enemyAct: 2 });
const UNDERWORLD = [
  { id: 'styx', name: 'The Crossing of the Styx', type: 'defense', pos: { x: 22, y: 70 }, requires: [],
    level: UW({ id: 'u_styx', act: 2, name: 'The Crossing of the Styx', D: 5, scale: 1.1, W: 7, favorStart: 100, reward: 40 }), reward: { meta: 40 },
    blurb: 'Charon ferries you across — hold the far bank as the dead swarm.' },
  { id: 'cerberus_gate', name: 'The Gate of Cerberus', type: 'boss', pos: { x: 40, y: 56 }, requires: ['styx'],
    level: UW({ id: 'u_cerb', act: 2, name: 'The Gate of Cerberus', mode: 'boss', target: { kind: 'boss', bossId: 'cerberus', hp: 1600 }, relic: 'winged_sandals', D: 4, scale: 1.2, W: 6, favorStart: 120, favorMax: 640, reward: 70 }), reward: { meta: 70, relic: 'winged_sandals' },
    blurb: 'The three-headed hound bars the way. Slay it to go deeper.' },
  { id: 'asphodel', name: 'The Fields of Asphodel', type: 'assault', pos: { x: 36, y: 32 }, requires: ['styx'],
    level: UW({ id: 'u_asph', act: 2, name: 'The Fields of Asphodel', mode: 'assault', target: { kind: 'stronghold', hp: 1700 }, D: 5, scale: 1.3, W: 7, favorStart: 125, favorMax: 640, reward: 52 }), reward: { meta: 52 },
    blurb: 'Break the grey host massed upon the fields of the dead.' },
  { id: 'tartarus', name: 'The Pit of Tartarus', type: 'defense', pos: { x: 60, y: 64 }, requires: ['cerberus_gate'],
    level: UW({ id: 'u_tart', act: 2, name: 'The Pit of Tartarus', D: 5, scale: 1.2, W: 7, favorStart: 110, favorMax: 640, reward: 56 }), reward: { meta: 56 },
    blurb: 'From the prison of the Titans, horrors climb. Hold the rim.' },
  { id: 'lethe', name: 'The Banks of Lethe', type: 'assault', pos: { x: 58, y: 28 }, requires: ['asphodel'],
    level: UW({ id: 'u_lethe', act: 2, name: 'The Banks of Lethe', mode: 'assault', target: { kind: 'stronghold', hp: 1900 }, D: 5, scale: 1.4, W: 7, favorStart: 125, favorMax: 680, reward: 58 }), reward: { meta: 58 },
    blurb: 'Storm the forgotten keep by the river of oblivion.' },
  { id: 'hydra_depths', name: 'The Hydra of the Depths', type: 'boss', pos: { x: 80, y: 46 }, requires: ['tartarus', 'lethe'],
    level: UW({ id: 'u_hydra', act: 2, name: 'The Hydra of the Depths', mode: 'boss', target: { kind: 'boss', bossId: 'hydra', hp: 3400 }, relic: 'medusa_gaze', D: 6, scale: 1.6, W: 8, favorStart: 135, favorMax: 720, reward: 120 }), reward: { meta: 120, relic: 'medusa_gaze' }, realmEnd: true,
    blurb: 'The many-headed serpent guards the way up. Fell it, and Olympus opens.' },
];

// --- Act III: Olympus (radiant backdrop; the medium roster at the highest scale) ---
const OL = (o) => makeLevel({ ...o, bg: 'backgrounds/act2.webp', enemyAct: 2 });
const OLYMPUS = [
  { id: 'ascent', name: 'The Cloudward Ascent', type: 'assault', pos: { x: 30, y: 80 }, requires: [],
    level: OL({ id: 'o_ascent', act: 3, name: 'The Cloudward Ascent', mode: 'assault', target: { kind: 'stronghold', hp: 2200 }, D: 5, scale: 1.5, W: 7, favorStart: 125, favorMax: 720, reward: 60 }), reward: { meta: 60 },
    blurb: 'Fight your way up the storm-wracked stair to the summit.' },
  { id: 'gigantomachy', name: 'The Gigantomachy', type: 'defense', pos: { x: 48, y: 60 }, requires: ['ascent'],
    level: OL({ id: 'o_giant', act: 3, name: 'The Gigantomachy', D: 5, scale: 1.4, W: 8, favorStart: 120, favorMax: 760, reward: 70 }), reward: { meta: 70 },
    blurb: 'The giants storm heaven. Hold the gods’ own gate.' },
  { id: 'titan', name: 'The Chained Titan', type: 'boss', pos: { x: 28, y: 46 }, requires: ['ascent'],
    level: OL({ id: 'o_titan', act: 3, name: 'The Chained Titan', mode: 'boss', target: { kind: 'boss', bossId: 'cyclops', hp: 3800 }, relic: 'phalanx_discipline', D: 6, scale: 1.8, W: 7, favorStart: 135, favorMax: 760, reward: 110 }), reward: { meta: 110, relic: 'phalanx_discipline' },
    blurb: 'A freed Titan rampages across the slopes. Bring it down.' },
  { id: 'pantheon', name: 'The Hall of the Gods', type: 'defense', pos: { x: 56, y: 34 }, requires: ['gigantomachy'],
    level: OL({ id: 'o_hall', act: 3, name: 'The Hall of the Gods', D: 5, scale: 1.4, W: 8, favorStart: 125, favorMax: 800, reward: 80 }), reward: { meta: 80 },
    blurb: 'The last sanctuary. Let nothing through.' },
  { id: 'typhon', name: 'Typhon, Father of Monsters', type: 'boss', pos: { x: 70, y: 18 }, requires: ['titan', 'pantheon'],
    level: OL({ id: 'o_typhon', act: 3, name: 'Typhon, Father of Monsters', mode: 'boss', target: { kind: 'boss', bossId: 'typhon', hp: 3000 }, relic: 'bolt_of_olympus', D: 4, scale: 1.0, W: 7, favorStart: 185, favorMax: 880, reward: 250 }), reward: { meta: 250, relic: 'bolt_of_olympus' }, realmEnd: true,
    blurb: 'The deadliest foe of the gods, storm and fire made flesh. End the journey here.' },
];

export const REALMS = [
  { id: 'earth', name: 'The Mortal Realm', sub: 'Ancient Greece', bg: 'maps/earth.webp', missions: EARTH },
  { id: 'underworld', name: 'The Underworld', sub: 'The realm of Hades', bg: 'maps/underworld.webp', missions: UNDERWORLD },
  { id: 'olympus', name: 'Mount Olympus', sub: 'The seat of the gods', bg: 'maps/olympus.webp', missions: OLYMPUS },
];
export const REALM_BY_ID = Object.fromEntries(REALMS.map((r) => [r.id, r]));
export const REALM_ORDER = REALMS.map((r) => r.id);

export function missionsOf(realmId) { const r = REALM_BY_ID[realmId]; return r ? r.missions : []; }
export function missionById(realmId, id) { return missionsOf(realmId).find((m) => m.id === id) || null; }
export function isUnlocked(mission, clearedSet) { return mission.requires.every((id) => clearedSet.has(id)); }
export function realmEndMission(realmId) { return missionsOf(realmId).find((m) => m.realmEnd) || null; }
export function clearedSetFor(meta, realmId) { return new Set((meta.campaign && meta.campaign.cleared && meta.campaign.cleared[realmId]) || []); }
export function realmComplete(realmId, clearedSet) { const e = realmEndMission(realmId); return !!e && clearedSet.has(e.id); }
// a realm is open if it's the first, or the previous realm has been completed
export function realmUnlocked(realmId, meta) {
  const i = REALM_ORDER.indexOf(realmId);
  if (i <= 0) return true;
  const prev = REALM_ORDER[i - 1];
  return realmComplete(prev, clearedSetFor(meta, prev));
}
