// Level definitions for the lane backbone. The battlefield is a 1280x720 virtual
// world: a fort on the left, `lanes` rows, and a grid of `cols` cells for
// stationary defenders. Enemies spawn at the right and march left along a lane.
// Each wave entry spawns `count` of `enemy` into `lane`, `gap` seconds apart,
// starting at `at` (+ optional `delay`).

export const LEVELS = [
  {
    id: 'a1_m1', act: 1, name: 'The Dipylon Gate',
    bg: 'backgrounds/act1.webp',
    world: { w: 1280, h: 720 },
    lanes: 5,
    grid: { x0: 200, cols: 8, cellW: 115 },   // cell j center x = x0 + j*cellW + cellW/2
    fort: { x: 178, hp: 30 },                  // enemies reaching x<=fort.x damage the fort
    spawnX: 1245,
    deployX: 190,                              // where mobile troops appear
    god: { id: 'zeus', range: 210, cooldown: 3.0, dmg: 22 }, // fort auto-defender (last resort)
    favor: { start: 105, rate: 6, max: 360 },
    waves: [
      // early probe
      { at: 3,  enemy: 'shade',    lane: 2, count: 5, gap: 0.8 },
      { at: 6,  enemy: 'shade',    lane: 0, count: 4, gap: 0.9 },
      { at: 6,  enemy: 'shade',    lane: 4, count: 4, gap: 0.9 },
      // build-up + first armour
      { at: 18, enemy: 'shade',    lane: 3, count: 6, gap: 0.7 },
      { at: 18, enemy: 'skeleton', lane: 1, count: 3, gap: 1.3 },
      { at: 22, enemy: 'shade',    lane: 2, count: 6, gap: 0.6 },
      // first flyers + ground
      { at: 32, enemy: 'harpy',    lane: 2, count: 4, gap: 1.0 },
      { at: 34, enemy: 'shade',    lane: 0, count: 7, gap: 0.6 },
      { at: 34, enemy: 'skeleton', lane: 4, count: 4, gap: 1.2 },
      { at: 40, enemy: 'shade',    lane: 3, count: 7, gap: 0.55 },
      // multi-lane surge
      { at: 52, enemy: 'harpy',    lane: 1, count: 3, gap: 0.9 },
      { at: 52, enemy: 'harpy',    lane: 3, count: 3, gap: 0.9 },
      { at: 54, enemy: 'skeleton', lane: 2, count: 5, gap: 1.0 },
      { at: 56, enemy: 'shade',    lane: 0, count: 8, gap: 0.5 },
      { at: 56, enemy: 'shade',    lane: 4, count: 8, gap: 0.5 },
      // heavy armoured push + swarm
      { at: 70, enemy: 'skeleton', lane: 0, count: 5, gap: 0.9 },
      { at: 70, enemy: 'skeleton', lane: 2, count: 5, gap: 0.9 },
      { at: 70, enemy: 'skeleton', lane: 4, count: 5, gap: 0.9 },
      { at: 72, enemy: 'shade',    lane: 1, count: 10, gap: 0.45 },
      { at: 72, enemy: 'shade',    lane: 3, count: 10, gap: 0.45 },
      // finale: two minotaurs, flyers, and a swarm
      { at: 90, enemy: 'minotaur', lane: 2, count: 1 },
      { at: 90, enemy: 'minotaur', lane: 0, count: 1, delay: 6 },
      { at: 90, enemy: 'harpy',    lane: 1, count: 4, gap: 0.8, delay: 2 },
      { at: 90, enemy: 'harpy',    lane: 3, count: 4, gap: 0.8, delay: 2 },
      { at: 94, enemy: 'shade',    lane: 4, count: 14, gap: 0.4 },
      { at: 96, enemy: 'skeleton', lane: 2, count: 4, gap: 1.0, delay: 4 },
    ],
    reward: { meta: 30 },
  },
];

export const LEVEL_BY_ID = Object.fromEntries(LEVELS.map((l) => [l.id, l]));

// Grid geometry helpers (shared by world + render + input).
export function laneCount(level) { return level.lanes; }
export function laneHeight(level) { return level.world.h / level.lanes; }
export function laneCenterY(level, lane) { return lane * laneHeight(level) + laneHeight(level) / 2; }
export function laneAtY(level, y) { return Math.max(0, Math.min(level.lanes - 1, Math.floor(y / laneHeight(level)))); }
export function cellCenterX(level, col) { return level.grid.x0 + col * level.grid.cellW + level.grid.cellW / 2; }
export function colAtX(level, x) {
  const c = Math.floor((x - level.grid.x0) / level.grid.cellW);
  return c >= 0 && c < level.grid.cols ? c : -1;
}
