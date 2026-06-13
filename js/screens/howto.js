// How to Play — a single readable screen. Reachable from the title and the hub.

import { mount, screen, el } from '../ui.js';
import { icon } from '../icons.js';
import { go } from '../main.js';

const ROWS = [
  ['gate', 'Hold the fort', 'Your fort is on the left; Zeus guards it. Enemies march in from the right along 5 lanes. If too many reach the fort, it falls.'],
  ['coin', 'Favor', 'Post Shrines on the wall to earn Favor over time. Spend Favor to post wall units and send out troops.'],
  ['column', 'Wall units — tap a lane', 'Posted on the fort: Toxotes (archer) shoots down its lane and hits flyers, Oracle hastens nearby units, Shrine earns Favor. Tap a posted unit to level it up (to 10) or sell it. Vulnerable if a lane breaks!'],
  ['shield', 'Troops — tap a lane', 'Sortie a Hoplite to march out and hold a lane. Keep troops out front to shield your archers. Costs Favor each.'],
  ['bolt', 'Your gods', 'Bring up to two gods to a run; each gives a tap-power on its own cooldown — Zeus’s lightning bolt, Poseidon’s slowing wave, Ares’ army-wide war cry, Apollo’s lane-scorching beam. The fort also auto-smites foes that get close.'],
  ['laurel', 'Blessings between waves', 'Clear a wave and an Olympian offers 1 of 3 blessings. They stack and last the whole run — commit to a build and snowball. Then send the next wave when you are ready.'],
  ['spear', 'Defend & attack', 'Missions come in three kinds. DEFEND — hold your gate against the waves. ASSAULT — push your army right and smash the enemy stronghold before your fort falls. BOSS — bring down a great beast (the Minotaur, the Hydra, Typhon himself) with its own phases and savage attacks.'],
  ['heart', 'The journey', 'Travel a map of ancient Greece, then descend to the Underworld, then climb Olympus. Pick missions from the map; clear one and the paths onward light up. Fail and simply try again — cleared deeds stay won. Slay a realm’s final boss to open the next. Grow permanently with Drachma (gods, units, base) and mythic RELICS won from bosses — they empower every battle to come.'],
  ['skull', 'Counter the foe', 'Armoured foes (skeletons, wraiths, the great brutes) shrug off arrows — block and cut them down with melee troops. Flyers (harpies, griffins) soar over your line; only archers and the gods can reach them. The Slinger’s splash is best against swarms. Read what’s coming and bring the right answer — that’s why your loadout matters.'],
];

// opts.onDone: called when the player dismisses the guide (used by the first-run
// gate to drop straight into the battle). Defaults to returning to the hub.
export function renderHowTo(opts = {}) {
  const s = screen('howto');
  const done = typeof opts.onDone === 'function' ? opts.onDone : () => go('hub');
  const firstRun = !!opts.onDone;
  const rows = ROWS.map(([ic, title, body]) => el('div.howto-row', {}, [
    el('span.glyph', {}, [icon(ic, { size: 24 })]),
    el('div', {}, [el('b', {}, title), el('span', {}, body)]),
  ]));
  const head = firstRun
    ? [el('h1', {}, 'How to Play')]
    : [el('button.btn.btn-ghost.btn-back', { onclick: done }, '←'), el('h1', {}, 'How to Play')];
  s.append(
    el('div.howto-head', {}, head),
    el('div.howto-list', {}, rows),
    el('button.btn.btn-primary.btn-lg', { onclick: done }, firstRun ? 'To battle  ▶' : 'Got it'),
  );
  return mount(s);
}
