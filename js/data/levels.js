// Level/map definitions. `path` is a polyline (world coords, 1280x720 virtual).
// `plots` are fixed build sites beside the path. `waves[].at` is seconds into the
// map; a spawn emits `count` enemies `gap` seconds apart after `delay`.

export const LEVELS = [
  {
    id: 'a1_m1', act: 1, name: 'The Dipylon Gate',
    bg: 'backgrounds/act1.webp',
    world: { w: 1280, h: 720 },
    path: [
      { x: -40, y: 250 }, { x: 230, y: 250 }, { x: 230, y: 480 }, { x: 540, y: 480 },
      { x: 540, y: 200 }, { x: 850, y: 200 }, { x: 850, y: 470 }, { x: 1150, y: 470 },
      { x: 1320, y: 470 },
    ],
    gatePos: { x: 1150, y: 470 },
    plots: [
      { id: 'p0', x: 120, y: 380 }, { id: 'p1', x: 360, y: 360 }, { id: 'p2', x: 420, y: 610 },
      { id: 'p3', x: 690, y: 330 }, { id: 'p4', x: 700, y: 95 }, { id: 'p5', x: 1000, y: 320 },
      { id: 'p6', x: 1010, y: 615 }, { id: 'p7', x: 1140, y: 290 },
    ],
    gate: { hp: 20 },
    favor: { start: 90, rate: 5, max: 280 },
    waves: [
      { at: 3,  spawns: [{ enemy: 'shade', count: 6, gap: 0.9 }] },
      { at: 18, spawns: [{ enemy: 'shade', count: 8, gap: 0.7 }, { enemy: 'skeleton', count: 3, gap: 1.5, delay: 3 }] },
      { at: 38, spawns: [{ enemy: 'harpy', count: 5, gap: 0.8 }, { enemy: 'shade', count: 8, gap: 0.6, delay: 2 }] },
      { at: 60, spawns: [{ enemy: 'skeleton', count: 6, gap: 1.0 }, { enemy: 'shade', count: 10, gap: 0.5, delay: 4 }] },
      { at: 84, spawns: [{ enemy: 'minotaur', count: 1 }, { enemy: 'harpy', count: 4, gap: 1.0, delay: 3 }, { enemy: 'shade', count: 12, gap: 0.45, delay: 7 }] },
    ],
    reward: { meta: 30 },
  },
];

export const LEVEL_BY_ID = Object.fromEntries(LEVELS.map((l) => [l.id, l]));
