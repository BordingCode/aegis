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
  ['heart', 'The run', 'Before each run you muster a loadout — pick your gods and units (the Shrine always stands); unlock more in the Hall of the Gods. Hold map after map across three Acts — Athens, Olympus, the Gates of Hades — facing new foes as you go. Your blessings carry onward. Leave any time: your run is saved, and Continue resumes at your current map. Fall, though, and the run restarts from the first gate; only your Drachma remains.'],
  ['skull', 'Counter the foe', 'Armoured foes (skeletons, wraiths, the great brutes) shrug off arrows — block and cut them down with melee troops. Flyers (harpies, griffins) soar over your line; only archers and the gods can reach them. The Slinger’s splash is best against swarms. Read what’s coming and bring the right answer — that’s why your loadout matters.'],
];

export function renderHowTo() {
  const s = screen('howto');
  const rows = ROWS.map(([ic, title, body]) => el('div.howto-row', {}, [
    el('span.glyph', {}, [icon(ic, { size: 24 })]),
    el('div', {}, [el('b', {}, title), el('span', {}, body)]),
  ]));
  s.append(
    el('div.howto-head', {}, [el('button.btn.btn-ghost.btn-back', { onclick: () => go('hub') }, '←'), el('h1', {}, 'How to Play')]),
    el('div.howto-list', {}, rows),
    el('button.btn.btn-primary.btn-lg', { onclick: () => go('hub') }, 'Got it'),
  );
  return mount(s);
}
