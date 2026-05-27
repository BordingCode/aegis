// The Hub — home base between runs. Deliberately a plain, opaque, normal-flow page
// (no fixed positioning, no inner scroll container, no transparency/shadows) to
// avoid GPU-compositing artifacts on mobile. Unlock gods & units and buy permanent
// base upgrades with Drachma (in place, no re-mount). Continue a saved run, or start
// a fresh one (which goes to the Prepare/muster screen).

import { Game } from '../state.js';
import { mount, screen, el } from '../ui.js';
import { icon } from '../icons.js';
import { artOrFallback } from '../art.js';
import { saveMeta, loadRun, clearRun } from '../save.js';
import { UPGRADES } from '../data/upgrades.js';
import { GOD_BY_ID } from '../data/powers.js';
import { DEFENDER_BY_ID } from '../data/defenders.js';
import { go } from '../main.js';

const GOD_UNLOCKS = [
  { id: 'poseidon', cost: 120 }, { id: 'ares', cost: 140 }, { id: 'apollo', cost: 130 },
];
const UNIT_UNLOCKS = [
  { id: 'priestess', cost: 90 }, { id: 'slinger', cost: 90 }, { id: 'phalanx', cost: 120 }, { id: 'peltast', cost: 70 },
];

export function renderHub() {
  const meta = Game.meta;
  const s = screen('hub');

  const drachma = el('span', {}, String(meta.currency));
  const bar = el('header.hub-bar', {}, [
    el('button.btn.btn-ghost.btn-back', { onclick: () => go('title') }, '←'),
    el('h1', {}, 'Hall of the Gods'),
    el('div.drachma', { dataset: { testid: 'hub-drachma' }, title: 'Drachma' }, [icon('coin', { size: 18 }), drachma]),
  ]);

  const buyables = []; // { cost, card } — for afford-dimming

  // A generic shop row: glyph (or portrait) + text + (buy | Owned). `owned`/`unlock` read/write meta.
  function shopCard(testid, glyph, color, title, desc, cost, owned, unlock, art) {
    const glyphNode = el('span.glyph', { style: { color: color || '#f0d27a' } }, [icon(glyph || 'laurel', { size: 24 })]);
    const card = el('div.up-card' + (owned() ? '.is-owned' : ''), {}, [
      art ? artOrFallback(art, glyphNode, 'god-portrait') : glyphNode,
      el('div.txt', {}, [el('b', {}, title), el('span', {}, desc)]),
    ]);
    if (owned()) { card.append(el('div.owned', {}, [icon('laurel', { size: 13 }), ' Owned'])); return card; }
    const btn = el('button.buy', { dataset: { testid }, onclick: () => buy() }, [icon('coin', { size: 13 }), ' ' + cost]);
    function buy() {
      if (owned() || meta.currency < cost) return;
      meta.currency -= cost; unlock(); saveMeta(meta);
      drachma.textContent = String(meta.currency);
      card.classList.add('is-owned');
      btn.replaceWith(el('div.owned', {}, [icon('laurel', { size: 13 }), ' Owned']));
      refreshAfford();
    }
    card.append(btn);
    buyables.push({ cost, card });
    return card;
  }

  function refreshAfford() {
    for (const b of buyables) { const btn = b.card.querySelector('.buy'); if (btn) btn.disabled = meta.currency < b.cost; }
  }

  // --- gods ---
  const godList = el('div.up-list');
  for (const u of GOD_UNLOCKS) {
    const g = GOD_BY_ID[u.id]; if (!g) continue;
    godList.append(shopCard('unlock-god-' + u.id, g.icon, '#f0d27a', `${g.name} — ${g.ability}`, g.blurb, u.cost,
      () => meta.unlockedGods.includes(u.id), () => meta.unlockedGods.push(u.id), g.art));
  }

  // --- units ---
  const unitList = el('div.up-list');
  for (const u of UNIT_UNLOCKS) {
    const def = DEFENDER_BY_ID[u.id]; if (!def) continue;
    unitList.append(shopCard('unlock-unit-' + u.id, def.icon, def.color, `${def.name} · ${def.deploy === 'lane' ? 'troop' : 'wall'}`, def.blurb, u.cost,
      () => meta.unlockedDefenders.includes(u.id), () => meta.unlockedDefenders.push(u.id)));
  }

  // --- base upgrades ---
  const upList = el('div.up-list');
  for (const u of UPGRADES) {
    upList.append(shopCard('buy-' + u.id, u.icon, '#f0d27a', u.name, u.desc, u.cost,
      () => !!meta.upgrades[u.id], () => { meta.upgrades[u.id] = true; }));
  }

  // --- run actions ---
  const saved = loadRun();
  const actions = el('div.hub-actions', {}, [
    el('button.btn.btn-ghost', { dataset: { testid: 'btn-codex' }, onclick: () => go('codex') }, 'Bestiary'),
    el('button.btn.btn-ghost', { onclick: () => go('howto') }, 'How to Play'),
    ...(saved ? [el('button.btn.btn-ghost', { dataset: { testid: 'btn-continue' }, onclick: continueRun }, `Continue · Map ${saved.mapIndex + 1}`)] : []),
    el('button.btn.btn-primary.btn-lg', { dataset: { testid: 'btn-begin' }, onclick: newRun }, saved ? 'New Run' : 'Begin the Defense'),
  ]);

  s.append(
    bar,
    el('p.hub-sub', {}, 'Spend Drachma on gods, warriors and base blessings, then muster your forces.'),
    el('h2.muster-h', {}, 'Gods'), godList,
    el('h2.muster-h', {}, 'Warriors'), unitList,
    el('h2.muster-h', {}, 'The base'), upList,
    actions,
  );
  refreshAfford();
  return mount(s);
}

function continueRun() {
  const saved = loadRun();
  if (!saved) return go('prepare');
  Game.run = saved;
  go('battle');
}

function newRun() {
  clearRun();
  Game.run = { seed: (Date.now() ^ (Math.random() * 1e9)) >>> 0, mapIndex: 0, boons: [], gods: [], units: [] };
  go('prepare');
}
