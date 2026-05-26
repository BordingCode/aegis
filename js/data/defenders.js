// Unit definitions. `deploy` decides interaction + behaviour:
//   'cell' — stationary defender placed on a grid cell (has HP, can be eaten).
//   'lane' — mobile Age-of-War troop summoned at the fort; marches down a lane.
// `kind` drives combat: favor | ranged | aura | melee_unit.
// Every unit has a `blurb` + stat fields shown in the tap-to-read info card.

export const DEFENDERS = [
  { id: 'shrine', name: 'Shrine', emoji: '⛩️', art: 'defenders/shrine.webp', color: '#e8c25c', icon: 'column',
    deploy: 'cell', kind: 'favor', cost: 50, hp: 120, gen: 8, sellRefund: 0.6,
    blurb: 'Generates Favor over time. No attack — protect it.',
    upgrade: { cost: 60, gen: 6 } },

  { id: 'toxotes', name: 'Toxotes', emoji: '🏹', art: 'defenders/toxotes.webp', color: '#7bb05a', icon: 'bow',
    deploy: 'cell', kind: 'ranged', cost: 75, hp: 90, range: 620, cooldown: 1.0, dmg: 12, proj: 'arrow',
    canHitFlying: true, sellRefund: 0.6,
    blurb: 'Archer. Shoots the nearest enemy ahead in its lane. Hits flyers.',
    upgrade: { cost: 80, dmg: 10, range: 80 } },

  { id: 'oracle', name: 'Oracle', emoji: '🔮', art: 'defenders/oracle.webp', color: '#b07bd0', icon: 'eye',
    deploy: 'cell', kind: 'aura', cost: 110, hp: 90, auraRange: 175, auraMult: 1.4, sellRefund: 0.6,
    blurb: 'Hastens the attacks of nearby defenders and troops.',
    upgrade: { cost: 100, auraRange: 50, auraMult: 0.15 } },

  { id: 'hoplite', name: 'Hoplite', emoji: '🛡️', art: 'units/hoplite.webp', color: '#6f86b8', icon: 'shield',
    deploy: 'lane', kind: 'melee_unit', cost: 60, hp: 170, dmg: 18, atkCd: 0.7, speed: 72, contact: 52,
    blurb: 'Marches down a lane and fights what it meets. Costs Favor each.' },
];

export const DEFENDER_BY_ID = Object.fromEntries(DEFENDERS.map((d) => [d.id, d]));
