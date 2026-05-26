// Permanent meta-upgrades bought with Drachma in the hub. Each is purchased once;
// its `effect` is collected by run/meta.js and applied when a battle World is built.

export const UPGRADES = [
  { id: 'favor_start', name: 'Blessed Coffers', desc: '+40 starting Favor', cost: 60, icon: 'coin',
    effect: { target: 'favor', stat: 'start', op: 'add', value: 40 } },
  { id: 'favor_rate', name: 'Bountiful Rites', desc: '+2 Favor per second', cost: 80, icon: 'coin',
    effect: { target: 'favor', stat: 'rate', op: 'add', value: 2 } },
  { id: 'fort_hp', name: 'Reinforced Gate', desc: '+10 Fort HP', cost: 70, icon: 'gate',
    effect: { target: 'fort', stat: 'hp', op: 'add', value: 10 } },
  { id: 'hoplite_dmg', name: 'Spartan Drill', desc: '+30% Hoplite damage', cost: 90, icon: 'shield',
    effect: { target: 'hoplite', stat: 'dmg', op: 'mul', value: 1.3 } },
  { id: 'zeus_dmg', name: "Zeus's Wrath", desc: '+40% Lightning damage', cost: 100, icon: 'bolt',
    effect: { target: 'zeus', stat: 'dmg', op: 'mul', value: 1.4 } },
  { id: 'zeus_cd', name: 'Swift Thunder', desc: '-3s Lightning cooldown', cost: 110, icon: 'bolt',
    effect: { target: 'zeus', stat: 'cooldown', op: 'add', value: -3 } },
];

export const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));
