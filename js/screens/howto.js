// How to Play — a single readable screen. Reachable from the title and the hub.

import { mount, screen, el } from '../ui.js';
import { icon } from '../icons.js';
import { go } from '../main.js';

const ROWS = [
  ['gate', 'Hold the fort', 'Your fort is on the left; Zeus guards it. Enemies march in from the right along 5 lanes. If too many reach the fort, it falls.'],
  ['coin', 'Favor', 'Post Shrines on the wall to earn Favor over time. Spend Favor to post wall units and send out troops.'],
  ['column', 'Wall units — tap a lane', 'Posted on the fort and stacked: Toxotes (archer) shoots down its lane and hits flyers, Oracle hastens nearby wall units, Shrine earns Favor. Vulnerable if a lane breaks!'],
  ['shield', 'Troops — tap a lane', 'Sortie a Hoplite to march out and hold a lane. Keep troops out front to shield your archers. Costs Favor each.'],
  ['bolt', 'Zeus', 'Zeus smites the foe nearest the fort on his own. Tap his power to call a Lightning Strike anywhere (on cooldown).'],
  ['skull', 'Beware', 'Enemies eat through your units — if a lane breaks they reach the wall and pick off your archers. Harpies fly over; only archers and Zeus can hit them.'],
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
