// Olympian blessings — picked one-of-three between waves. Each `apply(world)`
// mutates the live run modifiers (world.mods) or the world directly. Stackable
// boons can be offered again and compound; non-stackable ones appear at most once.

export const BOONS = [
  { id: 'ares_edge', god: 'Ares', name: 'Edge of War', icon: 'horns', stackable: true,
    desc: '+25% damage to all your attacks.',
    apply: (w) => { w.mods.allyDmgMult *= 1.25; } },
  { id: 'ares_frenzy', god: 'Ares', name: 'War Frenzy', icon: 'horns', stackable: true,
    desc: '+15% attack speed for archers & troops.',
    apply: (w) => { w.mods.fireRateMult *= 1.15; } },

  { id: 'zeus_thunder', god: 'Zeus', name: 'Thunderhead', icon: 'bolt', stackable: true,
    desc: '+40% Lightning Strike damage and a longer stun.',
    apply: (w) => { w.mods.powerDmgMult *= 1.4; w.mods.powerStunAdd += 0.3; } },
  { id: 'zeus_chain', god: 'Zeus', name: 'Chain Lightning', icon: 'bolt', stackable: true,
    desc: 'Your Lightning Strike arcs to 2 more nearby foes.',
    apply: (w) => { w.mods.powerChain += 2; } },
  { id: 'zeus_storm', god: 'Zeus', name: 'Stormcaller', icon: 'bolt', stackable: true,
    desc: 'Zeus smites foes at the fort 30% more often.',
    apply: (w) => { w.mods.godCdMult *= 0.7; } },

  { id: 'athena_aegis', god: 'Athena', name: 'Aegis', icon: 'shield', stackable: true,
    desc: '+25 Fort HP, right now.',
    apply: (w) => { w.gateHp += 25; w.gateHpMax += 25; } },
  { id: 'athena_phalanx', god: 'Athena', name: 'Phalanx', icon: 'shield', stackable: true,
    desc: '+25% HP for your units (current and future).',
    apply: (w) => {
      w.mods.hpMult *= 1.25;
      for (const d of w.defenders) { d.maxHp = Math.round(d.maxHp * 1.25); d.hp = Math.round(d.hp * 1.25); }
      for (const u of w.units) { u.maxHp = Math.round(u.maxHp * 1.25); u.hp = Math.round(u.hp * 1.25); }
    } },

  { id: 'hermes_spoils', god: 'Hermes', name: 'Spoils of War', icon: 'coin', stackable: true,
    desc: '+35% Favor from every kill.',
    apply: (w) => { w.mods.bountyMult *= 1.35; } },
  { id: 'hermes_trade', god: 'Hermes', name: 'Swift Trade', icon: 'coin', stackable: true,
    desc: 'Wall units and troops cost 15% less.',
    apply: (w) => { w.mods.costMult *= 0.85; } },

  { id: 'poseidon_riptide', god: 'Poseidon', name: 'Riptide', icon: 'feather', stackable: false,
    desc: 'Enemies you damage are briefly slowed.',
    apply: (w) => { w.mods.slowOnHit = Math.min(w.mods.slowOnHit, 0.6); } },
  { id: 'demeter_frost', god: 'Demeter', name: 'First Frost', icon: 'laurel', stackable: false,
    desc: 'Enemies enter their lane slowed for a few seconds.',
    apply: (w) => { w.mods.spawnSlow = Math.min(w.mods.spawnSlow, 0.55); } },
];

export const BOON_BY_ID = Object.fromEntries(BOONS.map((b) => [b.id, b]));

// Roll `n` distinct offered boons, excluding non-stackable ones already owned.
export function rollBoons(rng, owned, n = 3) {
  const eligible = BOONS.filter((b) => b.stackable || !owned.includes(b.id));
  return rng.shuffle(eligible).slice(0, n);
}
