// Relics — permanent mythic items earned from bosses / key missions. Each one's
// apply(world) runs once when a battle World is built (after meta upgrades + loadout
// + boons hooks), so every future battle benefits. They reuse the same world.mods /
// favor / gate hooks as boons, just applied up-front and forever.

export const RELICS = [
  { id: 'medusa_gaze', name: "Medusa's Gaze", icon: 'eye', art: 'relics/medusa_gaze.webp',
    desc: 'Foes enter every lane slowed — petrified by your stare.',
    apply: (w) => { w.mods.spawnSlow = Math.min(w.mods.spawnSlow, 0.7); } },
  { id: 'achilles_spear', name: "Achilles' Spear", icon: 'spear', art: 'relics/achilles_spear.webp',
    desc: '+20% damage to all your attacks.',
    apply: (w) => { w.mods.allyDmgMult *= 1.2; } },
  { id: 'golden_fleece', name: 'The Golden Fleece', icon: 'shield', art: 'relics/golden_fleece.webp',
    desc: '+40 Fort HP at the start of every battle.',
    apply: (w) => { w.gateHp += 40; w.gateHpMax += 40; } },
  { id: 'winged_sandals', name: 'Winged Sandals', icon: 'feather', art: 'relics/winged_sandals.webp',
    desc: '+1.5 Favor per second — the swiftness of Hermes.',
    apply: (w) => { w.favor.bonusRate += 1.5; } },
  { id: 'phalanx_discipline', name: 'Spartan Discipline', icon: 'gate', art: 'relics/phalanx_discipline.webp',
    desc: '+20% HP for all your units and defenders.',
    apply: (w) => { w.mods.hpMult *= 1.2; } },
  { id: 'bolt_of_olympus', name: 'Bolt of Olympus', icon: 'bolt', art: 'relics/bolt_of_olympus.webp',
    desc: '+30% god-power damage.',
    apply: (w) => { w.mods.powerDmgMult *= 1.3; } },
];

export const RELIC_BY_ID = Object.fromEntries(RELICS.map((r) => [r.id, r]));
