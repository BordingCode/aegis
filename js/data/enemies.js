// Enemy definitions. They march LEFT toward the fort along their lane. `dmg`/`atkCd`
// are used when an enemy stops to attack (destroy) one of your units in its path.
// armor subtracts from each hit they take (min 1). flying enemies bypass ground
// units and rush the fort — only ranged (Toxotes) and Zeus can hit them.

export const ENEMIES = [
  { id: 'shade',    name: 'Shade',    emoji: '👻', art: 'enemies/shade.webp', color: '#9fb4cc',
    hp: 40,  speed: 55, armor: 0, flying: false, dmg: 8,  atkCd: 0.8, bounty: 8,  gateDmg: 1,
    blurb: 'Restless dead. Weak, but they come in droves.' },
  { id: 'skeleton', name: 'Skeleton', emoji: '💀', art: 'enemies/skeleton.webp', color: '#e8e2cf',
    hp: 95,  speed: 40, armor: 4, flying: false, dmg: 14, atkCd: 1.0, bounty: 12, gateDmg: 2,
    blurb: 'Armoured and slow. Shrugs off light hits and chews through walls.' },
  { id: 'harpy',    name: 'Harpy',    emoji: '🦅', art: 'enemies/harpy.webp', color: '#cf9b63',
    hp: 34,  speed: 82, armor: 0, flying: true,  dmg: 0,  atkCd: 1,   bounty: 10, gateDmg: 1,
    blurb: 'Flies over your line straight at the fort. Only archers and Zeus can hit it.' },
  { id: 'minotaur', name: 'Minotaur', emoji: '🐂', art: 'enemies/minotaur.webp', color: '#c0563f',
    hp: 420, speed: 28, armor: 6, flying: false, dmg: 32, atkCd: 1.2, bounty: 60, gateDmg: 5, boss: true,
    blurb: 'A towering brute. Smashes through anything in its lane.' },
];

export const ENEMY_BY_ID = Object.fromEntries(ENEMIES.map((e) => [e.id, e]));
