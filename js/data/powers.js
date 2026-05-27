// God-powers: tap-to-cast abilities on a cooldown, channelled through the gods you
// bring. A run carries up to two gods (its loadout); each adds a button to the
// power rail with its own cooldown. `cast` decides how it is aimed:
//   'point' — tap a spot: area damage (+ stun or slow) at that point.
//   'lane'  — tap a lane: scorch every foe in that whole lane.
//   'self'  — no target: a timed army-wide buff (fires the instant you tap).

export const POWERS = [
  {
    id: 'zeus_bolt', god: 'zeus', name: 'Lightning Strike', icon: 'bolt',
    cast: 'point', cooldown: 12, radius: 95, dmg: 70, stun: 0.6,
    blurb: 'Call down a bolt: heavy damage and a brief stun to all foes in the blast.',
  },
  {
    id: 'poseidon_surge', god: 'poseidon', name: 'Tidal Surge', icon: 'trident',
    cast: 'point', cooldown: 14, radius: 150, dmg: 34, slow: 0.4, slowDur: 3.5,
    blurb: 'A crashing wave over a wide area: solid damage and leaves foes badly slowed.',
  },
  {
    id: 'ares_warcry', god: 'ares', name: 'War Cry', icon: 'spear',
    cast: 'self', cooldown: 18, dur: 6, dmgMult: 1.5, frMult: 1.3,
    blurb: 'Rally the army: +50% damage and +30% attack speed to all your units for a time.',
  },
  {
    id: 'apollo_sunlance', god: 'apollo', name: 'Sunlance', icon: 'sun',
    cast: 'lane', cooldown: 13, dmg: 55,
    blurb: 'A searing beam scorches an entire lane, burning every foe caught in it.',
  },
];

export const POWER_BY_ID = Object.fromEntries(POWERS.map((p) => [p.id, p]));
export const POWER_BY_GOD = Object.fromEntries(POWERS.map((p) => [p.god, p]));

// Display info for gods (used by the Prepare/muster screen + hub unlocks).
export const GODS = POWERS.map((p) => ({ id: p.god, power: p.id, name: p.god[0].toUpperCase() + p.god.slice(1), icon: p.icon, art: 'gods/' + p.god + '.webp', ability: p.name, blurb: p.blurb }));
export const GOD_BY_ID = Object.fromEntries(GODS.map((g) => [g.id, g]));
