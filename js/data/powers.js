// God-powers: tap-to-cast abilities on a cooldown, channelled through the god on
// the fort. Prototype: Zeus's Lightning Strike (point-targeted AoE + brief stun).

export const POWERS = [
  {
    id: 'zeus_bolt', god: 'zeus', name: 'Lightning Strike', icon: 'bolt',
    cast: 'point', cooldown: 12, radius: 95, dmg: 70, stun: 0.6,
    blurb: 'Call down a bolt: heavy damage and a brief stun to all enemies in the blast.',
  },
];

export const POWER_BY_ID = Object.fromEntries(POWERS.map((p) => [p.id, p]));
