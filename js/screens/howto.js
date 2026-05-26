// How to Play — a single readable screen. Reachable from the title and the hub.

import { mount, screen, el } from '../ui.js';
import { icon } from '../icons.js';
import { go } from '../main.js';

const ROWS = [
  ['gate', 'Hold the fort', 'Your fort is on the left; Zeus guards it. Enemies march in from the right along 5 lanes. If too many reach the fort, it falls.'],
  ['coin', 'Favor', 'Build Shrines to earn Favor over time. Spend Favor to place towers and send troops.'],
  ['column', 'Towers — tap a cell', 'Shrine earns Favor, Toxotes (archer) shoots down its lane and hits flyers, Oracle hastens nearby allies.'],
  ['shield', 'Troops — tap a lane', 'Send a Hoplite marching down a lane to block and fight. Costs Favor each.'],
  ['bolt', 'Zeus', 'Zeus smites the foe nearest the fort on his own. Tap his power to call a Lightning Strike anywhere (on cooldown).'],
  ['skull', 'Beware', 'Enemies destroy your units in their path — block lanes! Harpies fly over your line; only archers and Zeus can hit them.'],
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
