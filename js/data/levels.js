// Level definitions for the lane backbone. The battlefield is a 1280x720 virtual
// world: a fort on the left, `lanes` rows, and a grid of `cols` cells for
// stationary defenders. Enemies spawn at the right and march left along a lane.
// `waves` is an array of DISCRETE waves; each wave is a list of spawn specs that
// emit `count` of `enemy` into `lane`, `gap` seconds apart, `delay` after the wave
// starts. A wave is cleared when all its enemies are dead -> boon pick -> next wave.

export const LEVELS = [
  {
    id: 'a1_m1', act: 1, name: 'The Dipylon Gate',
    bg: 'backgrounds/act1.webp',
    world: { w: 1280, h: 720 },
    lanes: 5,
    grid: { x0: 200, cols: 8, cellW: 115 },   // cell j center x = x0 + j*cellW + cellW/2
    fort: { x: 178, hp: 50 },                  // enemies reaching x<=fort.x damage the fort
    spawnX: 1245,
    deployX: 190,                              // where mobile troops appear
    god: { id: 'zeus', range: 210, cooldown: 3.0, dmg: 22 }, // fort auto-defender (last resort)
    favor: { start: 80, rate: 3.4, max: 360 },
    waves: [
      [ // 1 — probe
        { enemy: 'shade', lane: 2, count: 6, gap: 0.7, delay: 1 },
        { enemy: 'shade', lane: 0, count: 5, gap: 0.8, delay: 2 },
        { enemy: 'shade', lane: 4, count: 5, gap: 0.8, delay: 2 },
      ],
      [ // 2 — first armour
        { enemy: 'shade', lane: 3, count: 8, gap: 0.6 },
        { enemy: 'skeleton', lane: 1, count: 4, gap: 1.1 },
        { enemy: 'shade', lane: 2, count: 8, gap: 0.5, delay: 2 },
      ],
      [ // 3 — flyers + ground
        { enemy: 'harpy', lane: 2, count: 5, gap: 0.9 },
        { enemy: 'shade', lane: 0, count: 10, gap: 0.5 },
        { enemy: 'skeleton', lane: 4, count: 5, gap: 1.0 },
        { enemy: 'shade', lane: 1, count: 7, gap: 0.55, delay: 2 },
      ],
      [ // 4 — multi-lane surge
        { enemy: 'harpy', lane: 1, count: 4, gap: 0.8 },
        { enemy: 'harpy', lane: 3, count: 4, gap: 0.8 },
        { enemy: 'skeleton', lane: 2, count: 6, gap: 0.9 },
        { enemy: 'shade', lane: 0, count: 12, gap: 0.4, delay: 1 },
        { enemy: 'shade', lane: 4, count: 10, gap: 0.45, delay: 2 },
      ],
      [ // 5 — heavy armour
        { enemy: 'skeleton', lane: 0, count: 6, gap: 0.8 },
        { enemy: 'skeleton', lane: 2, count: 6, gap: 0.8 },
        { enemy: 'skeleton', lane: 4, count: 6, gap: 0.8 },
        { enemy: 'shade', lane: 1, count: 12, gap: 0.4 },
        { enemy: 'shade', lane: 3, count: 12, gap: 0.4 },
      ],
      [ // 6 — mini-boss
        { enemy: 'minotaur', lane: 2, count: 1 },
        { enemy: 'minotaur', lane: 0, count: 1, delay: 5 },
        { enemy: 'harpy', lane: 1, count: 5, gap: 0.8, delay: 1 },
        { enemy: 'harpy', lane: 4, count: 5, gap: 0.8, delay: 1 },
        { enemy: 'shade', lane: 3, count: 12, gap: 0.4, delay: 2 },
        { enemy: 'skeleton', lane: 2, count: 5, gap: 0.9, delay: 4 },
      ],
      [ // 7 — finale
        { enemy: 'minotaur', lane: 1, count: 1 },
        { enemy: 'minotaur', lane: 2, count: 1, delay: 3 },
        { enemy: 'minotaur', lane: 3, count: 1, delay: 6 },
        { enemy: 'skeleton', lane: 0, count: 6, gap: 0.7 },
        { enemy: 'skeleton', lane: 4, count: 6, gap: 0.7 },
        { enemy: 'shade', lane: 1, count: 14, gap: 0.35, delay: 2 },
        { enemy: 'shade', lane: 3, count: 14, gap: 0.35, delay: 2 },
        { enemy: 'harpy', lane: 2, count: 6, gap: 0.6, delay: 4 },
      ],
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
