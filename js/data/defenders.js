// Unit definitions. `deploy` decides placement:
//   'fort' — posted to a lane ON the fort; stacks at the wall, stays put, shoots.
//            Non-melee. Vulnerable: if enemies break the lane they eat through them.
//   'lane' — mobile melee troop sortied into a lane; marches out to fight.
// `kind`: favor | ranged | aura | melee_unit.

export const DEFENDERS = [
  { id: 'shrine', name: 'Shrine', emoji: '⛩️', art: 'defenders/shrine.webp', color: '#e8c25c', icon: 'column',
    deploy: 'fort', kind: 'favor', cost: 55, hp: 140, gen: 5, sellRefund: 0.6,
    blurb: 'Posted to the wall. Generates Favor over time. No attack.',
    upgrade: { cost: 60, gen: 4 } },

  { id: 'toxotes', name: 'Toxotes', emoji: '🏹', art: 'defenders/toxotes.webp', color: '#7bb05a', icon: 'bow',
    deploy: 'fort', kind: 'ranged', cost: 60, hp: 110, range: 470, cooldown: 1.0, dmg: 10, proj: 'arrow',
    canHitFlying: true, sellRefund: 0.6,
    blurb: 'Archer posted to the wall. Shoots enemies down its lane. Hits flyers.',
    upgrade: { cost: 70, dmg: 10, range: 70 } },

  { id: 'oracle', name: 'Oracle', emoji: '🔮', art: 'defenders/oracle.webp', color: '#b07bd0', icon: 'eye',
    deploy: 'fort', kind: 'aura', cost: 110, hp: 100, auraRange: 200, auraMult: 1.4, sellRefund: 0.6,
    blurb: 'Posted to the wall. Hastens the attacks of nearby wall units.',
    upgrade: { cost: 100, auraRange: 60, auraMult: 0.15 } },

  { id: 'hoplite', name: 'Hoplite', emoji: '🛡️', art: 'units/hoplite.webp', color: '#6f86b8', icon: 'shield',
    deploy: 'lane', kind: 'melee_unit', cost: 72, hp: 185, dmg: 18, atkCd: 0.7, speed: 74, contact: 52,
    blurb: 'Sorties down a lane to block and fight. Costs Favor each.' },
];

export const DEFENDER_BY_ID = Object.fromEntries(DEFENDERS.map((d) => [d.id, d]));
