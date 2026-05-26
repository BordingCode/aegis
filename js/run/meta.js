// Translates purchased permanent upgrades into the flat modifier list the battle
// World applies when it is built (see createWorld's applyMod).

import { UPGRADES } from '../data/upgrades.js';

export function metaMods(meta) {
  const list = [];
  if (!meta || !meta.upgrades) return list;
  for (const u of UPGRADES) if (meta.upgrades[u.id]) list.push(u.effect);
  return list;
}
