// The Hub — home base between runs. Deliberately a plain, opaque, normal-flow
// page (no fixed positioning, no inner scroll container, no transparency/shadows)
// to avoid GPU-compositing artifacts on mobile. Buying updates in place.

import { Game } from '../state.js';
import { mount, screen, el } from '../ui.js';
import { icon } from '../icons.js';
import { saveMeta } from '../save.js';
import { UPGRADES } from '../data/upgrades.js';
import { LEVELS } from '../data/levels.js';
import { Sfx } from '../engine/audio.js';
import { go } from '../main.js';

export function renderHub() {
  const meta = Game.meta;
  const s = screen('hub');

  const drachma = el('span', {}, String(meta.currency));
  const bar = el('header.hub-bar', {}, [
    el('button.btn.btn-ghost.btn-back', { onclick: () => go('title') }, '←'),
    el('h1', {}, 'Hall of the Gods'),
    el('div.drachma', { dataset: { testid: 'hub-drachma' }, title: 'Drachma' }, [icon('coin', { size: 18 }), drachma]),
  ]);

  const buyables = [];
  const list = el('div.up-list');
  for (const u of UPGRADES) {
    const owned = !!meta.upgrades[u.id];
    const card = el('div.up-card' + (owned ? '.is-owned' : ''), {}, [
      el('span.glyph', {}, [icon(u.icon || 'laurel', { size: 24 })]),
      el('div.txt', {}, [el('b', {}, u.name), el('span', {}, u.desc)]),
    ]);
    if (owned) card.append(el('div.owned', {}, [icon('laurel', { size: 13 }), ' Owned']));
    else {
      const btn = el('button.buy', { dataset: { testid: 'buy-' + u.id }, onclick: () => buy(u, card, btn) }, [icon('coin', { size: 13 }), ' ' + u.cost]);
      card.append(btn);
      buyables.push({ u, card });
    }
    list.append(card);
  }

  function refreshAfford() {
    for (const b of buyables) { const btn = b.card.querySelector('.buy'); if (btn) btn.disabled = meta.currency < b.u.cost; }
  }
  function buy(u, card, btn) {
    if (meta.upgrades[u.id] || meta.currency < u.cost) return;
    meta.currency -= u.cost; meta.upgrades[u.id] = true; saveMeta(meta);
    drachma.textContent = String(meta.currency);
    card.classList.add('is-owned');
    btn.replaceWith(el('div.owned', {}, [icon('laurel', { size: 13 }), ' Owned']));
    refreshAfford();
  }

  const actions = el('div.hub-actions', {}, [
    el('button.btn.btn-ghost', { onclick: () => go('howto') }, 'How to Play'),
    el('button.btn.btn-primary.btn-lg', { dataset: { testid: 'btn-begin' }, onclick: begin }, 'Begin the Defense'),
  ]);

  s.append(bar, el('p.hub-sub', {}, 'Spend Drachma on permanent blessings, then hold the gate.'), list, actions);
  refreshAfford();
  return mount(s);
}

function begin() {
  Sfx.resume(); // unlock WebAudio on this gesture so battle SFX play immediately
  Game.run = { seed: (Date.now() ^ (Math.random() * 1e9)) >>> 0, levelIndex: 0 };
  go('battle', { level: LEVELS[0] });
}
