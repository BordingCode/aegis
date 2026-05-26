// Defender definitions. `kind` drives behaviour (see battle/defenders.js).
// `upgrade` is a single tier of deltas applied in-battle for `upgrade.cost` Favor.

export const DEFENDERS = [
  { id: 'shrine', name: 'Shrine', emoji: '⛩️', art: 'defenders/shrine.webp', color: '#e8c25c', icon: 'column',
    kind: 'favor', cost: 50, gen: 6, sellRefund: 0.6,
    blurb: 'Generates Favor over time.',
    upgrade: { cost: 60, gen: 5 } },

  { id: 'hoplite', name: 'Hoplite', emoji: '🛡️', art: 'defenders/hoplite.webp', color: '#6f86b8', icon: 'shield',
    kind: 'melee', cost: 100, range: 80, cooldown: 0.75, dmg: 16, sellRefund: 0.6,
    blurb: 'Spear jabs nearby foes. Cannot hit flyers.',
    upgrade: { cost: 90, dmg: 14, range: 12 } },

  { id: 'toxotes', name: 'Toxotes', emoji: '🏹', art: 'defenders/toxotes.webp', color: '#7bb05a', icon: 'bow',
    kind: 'projectile', cost: 80, range: 210, cooldown: 1.05, dmg: 11, proj: 'arrow',
    canHitFlying: true, sellRefund: 0.6,
    blurb: 'Long-range archer. Hits flyers.',
    upgrade: { cost: 80, dmg: 9, range: 30 } },

  { id: 'oracle', name: 'Oracle', emoji: '🔮', art: 'defenders/oracle.webp', color: '#b07bd0', icon: 'eye',
    kind: 'aura', cost: 130, auraRange: 150, auraMult: 1.4, sellRefund: 0.6,
    blurb: 'Quickens the attacks of nearby defenders.',
    upgrade: { cost: 110, auraRange: 40, auraMult: 0.15 } },
];

export const DEFENDER_BY_ID = Object.fromEntries(DEFENDERS.map((d) => [d.id, d]));
