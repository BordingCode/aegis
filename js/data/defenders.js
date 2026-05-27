// Unit definitions. `deploy`:
//   'fort' — posted to a lane on the fort. Recruiting the same type into a lane
//            again LEVELS the existing one (up to maxLevel) instead of stacking a
//            duplicate — stronger, tankier, and far fewer entities (less lag).
//            `perLevel` = stats added on each level-up.
//   'lane' — mobile melee troop sortied into a lane; marches out to fight.

export const DEFENDERS = [
  { id: 'shrine', name: 'Shrine', emoji: '⛩️', art: 'defenders/shrine.webp', color: '#e8c25c', icon: 'column',
    deploy: 'fort', kind: 'favor', cost: 55, hp: 140, gen: 5, sellRefund: 0.6,
    maxLevel: 10, perLevel: { hp: 70, gen: 4 },
    blurb: 'Posted to the wall. Generates Favor. Recruit again to level it up.' },

  { id: 'toxotes', name: 'Toxotes', emoji: '🏹', art: 'defenders/toxotes.webp', color: '#7bb05a', icon: 'bow',
    deploy: 'fort', kind: 'ranged', cost: 60, hp: 110, range: 470, cooldown: 1.0, dmg: 10, proj: 'arrow',
    canHitFlying: true, sellRefund: 0.6,
    maxLevel: 10, perLevel: { hp: 85, dmg: 8, range: 18 },
    blurb: 'Archer on the wall. Shoots down its lane, hits flyers. Recruit again to level up.' },

  { id: 'oracle', name: 'Oracle', emoji: '🔮', art: 'defenders/oracle.webp', color: '#b07bd0', icon: 'eye',
    deploy: 'fort', kind: 'aura', cost: 110, hp: 100, auraRange: 200, auraMult: 1.4, sellRefund: 0.6,
    maxLevel: 10, perLevel: { hp: 70, auraRange: 22, auraMult: 0.1 },
    blurb: 'Posted to the wall. Hastens nearby wall units. Recruit again to level up.' },

  { id: 'hoplite', name: 'Hoplite', emoji: '🛡️', art: 'units/hoplite.webp', color: '#6f86b8', icon: 'shield',
    deploy: 'lane', kind: 'melee_unit', cost: 72, hp: 185, dmg: 18, atkCd: 0.7, speed: 74, contact: 52,
    blurb: 'Sorties down a lane to block and fight. Costs Favor each.' },

  // --- unlockable roster (chosen in the Prepare screen) ---
  { id: 'priestess', name: 'Priestess', emoji: '✨', art: 'defenders/priestess.webp', color: '#e8d27a', icon: 'heart',
    deploy: 'fort', kind: 'heal', cost: 95, hp: 110, heal: 14, healRange: 210, sellRefund: 0.6,
    maxLevel: 10, perLevel: { hp: 60, heal: 6, healRange: 12 },
    blurb: 'Posted to the wall. Mends nearby wall units and troops over time. Recruit again to level up.' },

  { id: 'slinger', name: 'Slinger', emoji: '🪨', art: 'defenders/slinger.webp', color: '#c79a5b', icon: 'bow',
    deploy: 'fort', kind: 'ranged', cost: 85, hp: 100, range: 360, cooldown: 1.5, dmg: 14, splash: 46, proj: 'stone',
    canHitFlying: true, sellRefund: 0.6,
    maxLevel: 10, perLevel: { hp: 70, dmg: 9, splash: 4 },
    blurb: 'Wall thrower. Lobs stones that hit a small splash — good against clustered foes. Recruit again to level up.' },

  { id: 'phalanx', name: 'Phalanx', emoji: '🛡️', art: 'units/phalanx.webp', color: '#9aa0ad', icon: 'gate',
    deploy: 'lane', kind: 'melee_unit', cost: 95, hp: 420, dmg: 10, atkCd: 0.9, speed: 46, contact: 54,
    blurb: 'A slow, immovable wall of shields. Soaks enormous punishment to hold a lane. Costs Favor each.' },

  { id: 'peltast', name: 'Peltast', emoji: '🥏', art: 'units/peltast.webp', color: '#b8895f', icon: 'feather',
    deploy: 'lane', kind: 'melee_unit', cost: 50, hp: 110, dmg: 16, atkCd: 0.5, speed: 120, contact: 50,
    blurb: 'A fast, fragile skirmisher. Rushes out cheap to plug a breaking lane. Costs Favor each.' },
];

export const DEFENDER_BY_ID = Object.fromEntries(DEFENDERS.map((d) => [d.id, d]));
