// The Hub — home base between runs. Shows Drachma, lets you buy permanent
// upgrades (persisted), and begins a run. Buying updates the screen IN PLACE
// (no full re-mount) so it never flashes or resets your scroll position.

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

  const drachmaSpan = el('span', {}, String(meta.currency));
  const header = el('div.hub-header', {}, [
    el('button.btn.btn-ghost.btn-back', { onclick: () => go('title') }, '←'),
    el('h1', {}, 'Hall of the Gods'),
    el('div.coin-pill.big', { dataset: { testid: 'hub-drachma' }, title: 'Drachma' }, [icon('coin', { size: 20 }), drachmaSpan]),
  ]);

  const buyables = []; // { u, card, getBtn }
  const grid = el('div.upgrade-grid');
  for (const u of UPGRADES) {
    const card = el('div.upgrade-card' + (meta.upgrades[u.id] ? '.is-owned' : ''), {}, [
      el('span.glyph', {}, [icon(u.icon || 'laurel', { size: 26 })]),
      el('div.up-text', {}, [el('b', {}, u.name), el('span', {}, u.desc)]),
    ]);
    if (meta.upgrades[u.id]) {
      card.append(el('div.owned', {}, [icon('laurel', { size: 14 }), ' Owned']));
    } else {
      const btn = el('button.btn.btn-primary.buy', { dataset: { testid: 'buy-' + u.id }, onclick: () => buy(u, card, btn) }, [icon('coin', { size: 14 }), ' ' + u.cost]);
      card.append(btn);
      buyables.push({ u, card });
    }
    grid.append(card);
  }

  function refreshAfford() {
    for (const b of buyables) {
      const btn = b.card.querySelector('.buy');
      if (btn) btn.disabled = meta.currency < b.u.cost;
    }
  }
  function buy(u, card, btn) {
    if (meta.upgrades[u.id] || meta.currency < u.cost) return;
    meta.currency -= u.cost;
    meta.upgrades[u.id] = true;
    saveMeta(meta);
    drachmaSpan.textContent = String(meta.currency);
    card.classList.add('is-owned');
    btn.replaceWith(el('div.owned', {}, [icon('laurel', { size: 14 }), ' Owned']));
    refreshAfford();
  }

  const footer = el('div.hub-footer', {}, [
    el('button.btn.btn-ghost', { onclick: () => go('howto') }, 'How to Play'),
    el('button.btn.btn-primary.btn-lg', { dataset: { testid: 'btn-begin' }, onclick: begin }, 'Begin the Defense'),
  ]);

  s.append(header, el('p.hub-sub', {}, 'Spend Drachma on permanent blessings, then hold the gate.'), el('div.hub-scroll', {}, [grid]), footer);
  refreshAfford();
  return mount(s);
}

function begin() {
  Game.run = { seed: (Date.now() ^ (Math.random() * 1e9)) >>> 0, levelIndex: 0 };
  go('battle', { level: LEVELS[0] });
}
