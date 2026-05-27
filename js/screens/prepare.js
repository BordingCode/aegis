// Prepare ("muster") — chosen each run after pressing Begin. Pick which gods (up to
// 2) and which units (up to 4) to bring; the Shrine is always in your base. Sets the
// run's loadout, saves it (so you can Continue), and marches into the first map.

import { Game } from '../state.js';
import { mount, screen, el } from '../ui.js';
import { icon } from '../icons.js';
import { Sfx } from '../engine/audio.js';
import { saveRun } from '../save.js';
import { GOD_BY_ID, POWER_BY_GOD } from '../data/powers.js';
import { DEFENDER_BY_ID } from '../data/defenders.js';
import { LEVELS } from '../data/levels.js';
import { go } from '../main.js';

const MAX_GODS = 2;
const MAX_UNITS = 4;

export function renderPrepare() {
  const meta = Game.meta;
  if (!Game.run) Game.run = { seed: (Date.now() ^ (Math.random() * 1e9)) >>> 0, mapIndex: 0, boons: [] };
  const s = screen('prepare');

  const unlockedGods = (meta.unlockedGods && meta.unlockedGods.length ? meta.unlockedGods : ['zeus']).filter((id) => GOD_BY_ID[id]);
  const unlockedUnits = (meta.unlockedDefenders || []).filter((id) => id !== 'shrine' && DEFENDER_BY_ID[id]);

  // pre-select up to the cap so a fresh player can just March
  const pickedGods = unlockedGods.slice(0, MAX_GODS);
  const pickedUnits = unlockedUnits.slice(0, MAX_UNITS);

  const goBtn = el('button.btn.btn-primary.btn-lg', { dataset: { testid: 'btn-march' }, onclick: march }, 'March to battle  ▶');
  const godCount = el('span.muster-count');
  const unitCount = el('span.muster-count');

  function refresh() {
    godCount.textContent = `${pickedGods.length}/${MAX_GODS}`;
    unitCount.textContent = `${pickedUnits.length}/${MAX_UNITS}`;
    goBtn.disabled = pickedGods.length < 1 || pickedUnits.length < 1;
  }

  function toggle(list, id, max, card) {
    const i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1);
    else { if (list.length >= max) return; list.push(id); }
    card.classList.toggle('is-selected', list.includes(id));
    refresh();
  }

  // --- gods ---
  const godCards = unlockedGods.map((id) => {
    const g = GOD_BY_ID[id]; const pw = POWER_BY_GOD[id];
    const card = el('div.sel-card', { dataset: { testid: 'god-' + id } }, [
      el('span.glyph', {}, [icon(g.icon, { size: 26 })]),
      el('div.txt', {}, [el('b', {}, `${g.name} — ${g.ability}`), el('span', {}, pw ? pw.blurb : '')]),
      el('span.tick', {}, '✓'),
    ]);
    card.classList.toggle('is-selected', pickedGods.includes(id));
    card.onclick = () => toggle(pickedGods, id, MAX_GODS, card);
    return card;
  });

  // --- units (Shrine is locked-in) ---
  const shrineDef = DEFENDER_BY_ID.shrine;
  const shrineCard = el('div.sel-card.is-locked', {}, [
    el('span.glyph', { style: { color: shrineDef.color } }, [icon(shrineDef.icon, { size: 26 })]),
    el('div.txt', {}, [el('b', {}, 'Shrine — always in your base'), el('span', {}, shrineDef.blurb)]),
    el('span.tick', {}, '★'),
  ]);
  const unitCards = unlockedUnits.map((id) => {
    const def = DEFENDER_BY_ID[id];
    const card = el('div.sel-card', { dataset: { testid: 'unit-' + id } }, [
      el('span.glyph', { style: { color: def.color } }, [icon(def.icon || 'laurel', { size: 26 })]),
      el('div.txt', {}, [el('b', {}, `${def.name} · ${def.deploy === 'lane' ? 'troop' : 'wall'}`), el('span', {}, def.blurb)]),
      el('span.tick', {}, '✓'),
    ]);
    card.classList.toggle('is-selected', pickedUnits.includes(id));
    card.onclick = () => toggle(pickedUnits, id, MAX_UNITS, card);
    return card;
  });

  function march() {
    if (pickedGods.length < 1 || pickedUnits.length < 1) return;
    Sfx.resume(); // unlock WebAudio on this gesture so battle SFX play immediately
    Game.run.gods = pickedGods.slice();
    Game.run.units = pickedUnits.slice();
    Game.run.mapIndex = Game.run.mapIndex || 0;
    Game.run.boons = Game.run.boons || [];
    saveRun(Game.run);
    go('battle', { level: LEVELS[Game.run.mapIndex] });
  }

  s.append(
    el('header.hub-bar', {}, [
      el('button.btn.btn-ghost.btn-back', { onclick: () => go('hub') }, '←'),
      el('h1', {}, 'Muster your forces'),
    ]),
    el('p.hub-sub', {}, 'Choose the gods who answer your call and the warriors at your gate. The Shrine always stands.'),
    el('div.muster-group', {}, [el('h2.muster-h', {}, ['Gods ', godCount]), el('div.muster-grid', {}, godCards)]),
    el('div.muster-group', {}, [el('h2.muster-h', {}, ['Units ', unitCount]), el('div.muster-grid', {}, [shrineCard, ...unitCards])]),
    el('div.hub-actions', {}, [goBtn]),
  );
  refresh();
  return mount(s);
}
