// Enemy definitions. They march LEFT toward the fort along their lane. `dmg`/`atkCd`
// are used when an enemy stops to attack (destroy) one of your units in its path.
// armor subtracts from each hit they take (min 1). flying enemies bypass ground
// units and rush the fort — only ranged (Toxotes) and Zeus can hit them.

export const ENEMIES = [
  { id: 'shade',    name: 'Shade',    emoji: '👻', art: 'enemies/shade.webp', color: '#9fb4cc',
    hp: 46,  speed: 80, armor: 0, flying: false, dmg: 12, atkCd: 0.8, bounty: 4,  gateDmg: 1,
    blurb: 'Restless dead. Weak, but they come in droves.' },
  { id: 'skeleton', name: 'Skeleton', emoji: '💀', art: 'enemies/skeleton.webp', color: '#e8e2cf',
    hp: 105, speed: 56, armor: 3, flying: false, dmg: 20, atkCd: 1.0, bounty: 6,  gateDmg: 2,
    resist: { ranged: 0.6 },
    blurb: 'Armoured and slow. Arrows glance off — meet it with melee troops.' },
  { id: 'harpy',    name: 'Harpy',    emoji: '🦅', art: 'enemies/harpy.webp', color: '#cf9b63',
    hp: 42,  speed: 108, armor: 0, flying: true, dmg: 0,  atkCd: 1,   bounty: 4,  gateDmg: 1,
    blurb: 'Flies over your line straight at the fort. Only archers and Zeus can hit it.' },
  { id: 'minotaur', name: 'Minotaur', emoji: '🐂', art: 'enemies/minotaur.webp', color: '#c0563f',
    hp: 360, speed: 40, armor: 4, flying: false, dmg: 46, atkCd: 1.2, bounty: 30, gateDmg: 5, boss: true,
    resist: { ranged: 0.65 },
    blurb: 'A towering brute that smashes through anything. Thick hide blunts arrows — block it with steel.' },

  // --- Act 2 (Olympus) ---
  { id: 'satyr', name: 'Satyr', emoji: '🐐', art: 'enemies/satyr.webp', color: '#a9743f',
    hp: 60, speed: 130, armor: 0, flying: false, dmg: 14, atkCd: 0.7, bounty: 5, gateDmg: 1,
    blurb: 'Goat-legged and quick. Darts past slow defenders to reach the wall.' },
  { id: 'cyclops', name: 'Cyclops', emoji: '👹', art: 'enemies/cyclops.webp', color: '#caa66a',
    hp: 520, speed: 38, armor: 5, flying: false, dmg: 60, atkCd: 1.3, bounty: 36, gateDmg: 6, boss: true,
    resist: { ranged: 0.6 },
    blurb: 'A one-eyed giant, tougher than a Minotaur and hitting like a landslide. Arrows barely scratch it.' },
  { id: 'griffin', name: 'Griffin', emoji: '🦅', art: 'enemies/griffin.webp', color: '#d6b15e',
    hp: 120, speed: 90, armor: 2, flying: true, dmg: 0, atkCd: 1, bounty: 8, gateDmg: 2,
    blurb: 'A winged beast that flies over your line. Far tougher than a Harpy — needs real archer fire.' },

  // --- Act 3 (Underworld) ---
  { id: 'wraith', name: 'Wraith', emoji: '🌫️', art: 'enemies/wraith.webp', color: '#5b6b8c',
    hp: 150, speed: 78, armor: 6, flying: false, dmg: 28, atkCd: 0.9, bounty: 9, gateDmg: 2,
    resist: { ranged: 0.55 },
    blurb: 'A fast, heavily-armoured spectre. Arrows pass through the mist — cut it down with melee.' },
  { id: 'cerberus', name: 'Cerberus', emoji: '🐕', art: 'enemies/cerberus.webp', color: '#3c3a44',
    hp: 900, speed: 46, armor: 6, flying: false, dmg: 70, atkCd: 1.0, bounty: 60, gateDmg: 7, boss: true,
    resist: { ranged: 0.65 },
    blurb: 'The three-headed hound of Hades — a wall of teeth and fury. Its hide turns arrows; hold it with melee and gods.' },
];

export const ENEMY_BY_ID = Object.fromEntries(ENEMIES.map((e) => [e.id, e]));
