// The realm map — a geographic, branching level-select. Mission nodes sit on the
// realm's map image; paths connect a mission to the ones it requires. Cleared nodes
// are marked, unlocked ones are tappable, the rest are locked. Tap → preview →
// muster (loadout) → battle → back here. Progress lives in meta.campaign.cleared.

import { Game } from '../state.js';
import { mount, screen, el } from '../ui.js';
import { icon } from '../icons.js';
import { bgImage } from '../art.js';
import { saveMeta } from '../save.js';
import { REALM_BY_ID, REALM_ORDER, isUnlocked, realmComplete, realmUnlocked } from '../data/campaign.js';
import { go } from '../main.js';

const TYPE_ICON = { defense: 'gate', assault: 'spear', boss: 'skull' };
const TYPE_NAME = { defense: 'Defend', assault: 'Assault', boss: 'Boss' };

export function renderMap() {
  const meta = Game.meta;
  const realmId = (meta.campaign && meta.campaign.realm) || 'earth';
  const realm = REALM_BY_ID[realmId];
  const cleared = new Set((meta.campaign && meta.campaign.cleared && meta.campaign.cleared[realmId]) || []);
  const s = screen('map');

  const board = el('div.map-board');
  bgImage(board, realm.bg);

  // connector paths (a single SVG, coords in 0..100 viewBox)
  let lines = '';
  for (const m of realm.missions) for (const reqId of m.requires) {
    const from = realm.missions.find((x) => x.id === reqId); if (!from) continue;
    const live = cleared.has(reqId);
    lines += `<line x1="${from.pos.x}" y1="${from.pos.y}" x2="${m.pos.x}" y2="${m.pos.y}" class="${live ? 'live' : ''}"/>`;
  }
  board.append(el('div.map-lines', { html: `<svg viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg>` }));

  for (const m of realm.missions) {
    const done = cleared.has(m.id);
    const open = !done && isUnlocked(m, cleared);
    const state = done ? 'done' : open ? 'open' : 'locked';
    const node = el('button.map-node.' + state, {
      dataset: { testid: 'node-' + m.id }, style: { left: m.pos.x + '%', top: m.pos.y + '%' },
      onclick: () => { if (open || done) preview(m, open); },
    }, [
      el('span.node-dot' + (m.type === 'boss' ? '.boss' : ''), {}, [icon(done ? 'laurel' : (TYPE_ICON[m.type] || 'gate'), { size: 18 })]),
      el('span.node-label', {}, m.name),
    ]);
    board.append(node);
  }

  function preview(m, open) {
    const r = m.reward || {};
    const ov = el('div.overlay', {}, [el('div.panel', {}, [
      el('h2', {}, m.name),
      el('p.preview-type', {}, [icon(TYPE_ICON[m.type] || 'gate', { size: 15 }), ' ' + (TYPE_NAME[m.type] || 'Battle')]),
      el('p', {}, m.blurb),
      el('p.muted', {}, `Reward: ${r.meta || 0} Drachma${r.relic ? ' + a relic' : ''}`),
      el('div.row', {}, open ? [
        el('button.btn.btn-primary', { dataset: { testid: 'btn-setout' }, onclick: () => setOut(m) }, 'Muster & set out'),
        el('button.btn.btn-ghost', { onclick: () => ov.remove() }, 'Back'),
      ] : [
        el('div.menu-max', {}, 'Cleared ✓'),
        el('button.btn.btn-ghost', { onclick: () => ov.remove() }, 'Back'),
      ]),
    ])]);
    s.append(ov);
  }

  function setOut(m) {
    const last = Game.run || {};
    Game.mission = { realm: realmId, id: m.id, level: m.level, reward: m.reward || {}, realmEnd: !!m.realmEnd, type: m.type };
    Game.run = { seed: (Date.now() ^ (Math.random() * 1e9)) >>> 0, mapIndex: 0, boons: [], gods: last.gods || [], units: last.units || [] };
    go('prepare');
  }

  const complete = realmComplete(realmId, cleared);
  const idx = REALM_ORDER.indexOf(realmId);
  const prev = idx > 0 ? REALM_ORDER[idx - 1] : null;
  const next = idx < REALM_ORDER.length - 1 ? REALM_ORDER[idx + 1] : null;
  const travel = (rid) => { meta.campaign.realm = rid; saveMeta(meta); go('map'); };

  const foot = el('div.map-foot.realm-nav', {}, []);
  if (prev) foot.append(el('button.btn.btn-ghost', { dataset: { testid: 'btn-realm-prev' }, onclick: () => travel(prev) }, '← ' + REALM_BY_ID[prev].name));
  foot.append(el('span.muster-count', {}, complete ? 'Realm conquered ✓' : 'Choose your next deed'));
  if (next && realmUnlocked(next, meta)) foot.append(el('button.btn.btn-primary', { dataset: { testid: 'btn-realm-next' }, onclick: () => travel(next) }, 'Travel to ' + REALM_BY_ID[next].name + ' →'));
  else if (next) foot.append(el('span.muster-count', {}, 'Conquer this realm to travel onward'));

  s.append(
    el('header.hub-bar.map-bar', {}, [
      el('button.btn.btn-ghost.btn-back', { onclick: () => go('hub') }, '←'),
      el('h1', {}, realm.name),
      el('div.drachma', { title: 'Drachma' }, [icon('coin', { size: 18 }), ' ' + meta.currency]),
    ]),
    board,
    foot,
  );
  return mount(s);
}
