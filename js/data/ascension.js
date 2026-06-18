// Ascension — an OPT-IN difficulty ladder (Slay-the-Spire / Heat style). Each rung
// is a RULE CHANGE that re-poses the same content as a new puzzle, NOT a flat stat
// multiplier and NEVER an auto-easier "catch-up". The player chooses the level on the
// muster screen; a rung is "active" if the chosen level is >= its tier. Rungs are
// cumulative: ascension 3 applies tiers 1, 2 and 3.
//
// Each rung exposes plain flags read by existing code (createWorld scaling, the boon
// roller). No engine rewrite — pure data + small reads, exactly like the boons.

export const ASCENSION = [
  { tier: 1, name: 'Tested Walls',
    desc: 'The Fort begins every battle at 75% of its HP.',
    fortHpMult: 0.75 },
  { tier: 2, name: 'Stubborn Foes',
    desc: 'Enemies shrug off slows — every slow is half as strong.',
    slowResist: 0.5 },
  { tier: 3, name: 'Lean Offerings',
    desc: 'The gods are sparing: one fewer blessing is offered between waves.',
    boonOfferDelta: -1 },
  { tier: 4, name: 'Swift Tide',
    desc: 'The enemy host marches 12% faster.',
    enemySpeedMult: 1.12 },
  { tier: 5, name: 'Hardened Host',
    desc: 'Enemies arrive with +1 armour — chip damage no longer trivialises them.',
    enemyArmorAdd: 1 },
];

export const ASCENSION_MAX = ASCENSION.length;

// Fold the chosen ascension level into one resolved rule set (cumulative).
export function ascensionRules(level = 0) {
  const lv = Math.max(0, Math.min(ASCENSION_MAX, level | 0));
  const r = { level: lv, fortHpMult: 1, slowResist: 1, boonOfferDelta: 0, enemySpeedMult: 1, enemyArmorAdd: 0 };
  for (const rung of ASCENSION) {
    if (rung.tier > lv) break;
    if (rung.fortHpMult != null) r.fortHpMult *= rung.fortHpMult;
    if (rung.slowResist != null) r.slowResist *= rung.slowResist;
    if (rung.boonOfferDelta) r.boonOfferDelta += rung.boonOfferDelta;
    if (rung.enemySpeedMult != null) r.enemySpeedMult *= rung.enemySpeedMult;
    if (rung.enemyArmorAdd) r.enemyArmorAdd += rung.enemyArmorAdd;
  }
  return r;
}
