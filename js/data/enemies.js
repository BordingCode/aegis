// Enemy definitions. speed = world units/second along the path. armor subtracts
// from each hit (min 1 damage). flying enemies can only be hit by ranged/Zeus.

export const ENEMIES = [
  { id: 'shade',    name: 'Shade',    emoji: '👻', art: 'enemies/shade.webp', color: '#9fb4cc',
    hp: 38,  speed: 62, armor: 0, flying: false, bounty: 8,  gateDmg: 1 },
  { id: 'skeleton', name: 'Skeleton', emoji: '💀', art: 'enemies/skeleton.webp', color: '#e8e2cf',
    hp: 72,  speed: 46, armor: 4, flying: false, bounty: 12, gateDmg: 2 },
  { id: 'harpy',    name: 'Harpy',    emoji: '🦅', art: 'enemies/harpy.webp', color: '#cf9b63',
    hp: 30,  speed: 84, armor: 0, flying: true,  bounty: 10, gateDmg: 1 },
  { id: 'minotaur', name: 'Minotaur', emoji: '🐂', art: 'enemies/minotaur.webp', color: '#c0563f',
    hp: 340, speed: 34, armor: 6, flying: false, bounty: 60, gateDmg: 5, boss: true },
];

export const ENEMY_BY_ID = Object.fromEntries(ENEMIES.map((e) => [e.id, e]));
