// The Hub — home base between runs. Shows Drachma, lets you buy permanent
// upgrades (persisted), and begins a run. On death/win the battle returns here.

import { Game } from '../state.js';
import { mount, screen, el } from '../ui.js';
import { icon } from '../icons.js';
import { saveMeta } from '../save.js';
import { UPGRADES } from '../data/upgrades.js';
import { LEVELS } from '../data/levels.js';
import { go } from '../main.js';

export function renderHub() {
  const meta = Game.meta;
  const s = screen('hub');

  const header = el('div.hub-header', {}, [
    el('button.btn.btn-ghost.btn-back', { onclick: () => go('title') }, '←'),
    el('h1', {}, 'Hall of the Gods'),
    el('div.coin-pill.big', { dataset: { testid: 'hub-drachma' }, title: 'Drachma' }, [icon('coin', { size: 20 }), el('span', {}, String(meta.currency))]),
  ]);

  const grid = el('div.upgrade-grid');
  for (const u of UPGRADES) {
    const owned = !!meta.upgrades[u.id];
    const afford = meta.currency >= u.cost;
    const action = owned
      ? el('div.owned', {}, [icon('laurel', { size: 14 }), ' Owned'])
      : el('button.btn.btn-primary.buy', {
        dataset: { testid: 'buy-' + u.id }, disabled: !afford || undefined,
        onclick: () => { if (meta.currency >= u.cost) { meta.currency -= u.cost; meta.upgrades[u.id] = true; saveMeta(meta); renderHub(); } },
      }, [icon('coin', { size: 14 }), ' ' + u.cost]);
    grid.append(el('div.upgrade-card' + (owned ? '.is-owned' : ''), {}, [
      el('span.glyph', {}, [icon(u.icon || 'laurel', { size: 26 })]),
      el('div.up-text', {}, [el('b', {}, u.name), el('span', {}, u.desc)]),
      action,
    ]));
  }

  const footer = el('div.hub-footer', {}, [
    el('button.btn.btn-ghost', { onclick: () => go('howto') }, 'How to Play'),
    el('button.btn.btn-primary.btn-lg', { dataset: { testid: 'btn-begin' }, onclick: begin }, 'Begin the Defense'),
  ]);

  s.append(header, el('p.hub-sub', {}, 'Spend Drachma on permanent blessings, then hold the gate.'), grid, footer);
  return mount(s);
}

function begin() {
  Game.run = { seed: (Date.now() ^ (Math.random() * 1e9)) >>> 0, levelIndex: 0 };
  go('battle', { level: LEVELS[0] });
}
