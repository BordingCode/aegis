// The Codex — a bestiary of the foes you have faced. Spoiler-safe: a foe is a
// locked silhouette until you first meet it in battle (tracked in
// meta.codex.enemiesSeen), then its art, stats and lore are revealed.

import { Game } from '../state.js';
import { mount, screen, el } from '../ui.js';
import { icon } from '../icons.js';
import { artOrFallback } from '../art.js';
import { ENEMIES } from '../data/enemies.js';
import { RELICS } from '../data/relics.js';
import { go } from '../main.js';

const ACT_OF = { shade: 1, skeleton: 1, harpy: 1, minotaur: 1, satyr: 2, cyclops: 2, griffin: 2, wraith: 3, cerberus: 3, hydra: 3, typhon: 3 };
const ACT_NAMES = { 1: 'The Mortal Realm', 2: 'The Slopes of Olympus', 3: 'The Underworld & Beyond' };

function statChip(ic, val) { return el('span.codex-stat', {}, [icon(ic, { size: 13 }), ' ' + val]); }

function card(def, seen) {
  if (!seen) {
    return el('div.codex-card.is-locked', {}, [
      el('div.art', {}, [el('span.codex-emoji', {}, '?')]),
      el('div.codex-body', {}, [el('b', {}, '???'), el('span.codex-blurb', {}, 'Not yet encountered.')]),
    ]);
  }
  const tags = [];
  if (def.boss) tags.push(el('span.codex-tag.boss', {}, 'Boss'));
  if (def.flying) tags.push(el('span.codex-tag.fly', {}, 'Flying'));
  if (def.resist && def.resist.ranged) tags.push(el('span.codex-tag.armor', {}, 'Resists arrows'));
  return el('div.codex-card', {}, [
    artOrFallback(def.art, el('span.codex-emoji', {}, def.emoji), 'codex-art'),
    el('div.codex-body', {}, [
      el('div.codex-name', {}, [el('b', {}, def.name), ...tags]),
      el('div.codex-stats', {}, [
        statChip('heart', def.hp),
        statChip('feather', Math.round(def.speed)),
        statChip('shield', def.armor || 0),
        statChip('skull', def.dmg || 0),
      ]),
      el('span.codex-blurb', {}, def.blurb),
    ]),
  ]);
}

export function renderCodex() {
  const meta = Game.meta;
  const seenSet = new Set((meta && meta.codex && meta.codex.enemiesSeen) || []);
  const s = screen('codex');

  const groups = [];
  for (const act of [1, 2, 3]) {
    const foes = ENEMIES.filter((e) => ACT_OF[e.id] === act);
    if (!foes.length) continue;
    groups.push(el('h2.muster-h', {}, ACT_NAMES[act]));
    groups.push(el('div.codex-grid', {}, foes.map((e) => card(e, seenSet.has(e.id)))));
  }

  // relics collection (spoiler-safe: locked until earned)
  const ownedRelics = new Set(meta.relics || []);
  groups.push(el('h2.muster-h', {}, ['Relics ', el('span.muster-count', {}, `${ownedRelics.size}/${RELICS.length}`)]));
  groups.push(el('div.codex-grid', {}, RELICS.map((r) => {
    const have = ownedRelics.has(r.id);
    return el('div.codex-card' + (have ? '' : '.is-locked'), {}, [
      el('div.art', {}, [el('span.codex-emoji', {}, have ? '◈' : '?')]),
      el('div.codex-body', {}, [el('b', {}, have ? r.name : '???'), el('span.codex-blurb', {}, have ? r.desc : 'Not yet claimed.')]),
    ]);
  })));

  s.append(
    el('header.hub-bar', {}, [
      el('button.btn.btn-ghost.btn-back', { onclick: () => go('hub') }, '←'),
      el('h1', {}, 'Bestiary'),
      el('div.drachma', { title: 'Foes catalogued' }, [icon('skull', { size: 16 }), ` ${seenSet.size}/${ENEMIES.length}`]),
    ]),
    el('p.hub-sub', {}, 'The dead you have turned back. Meet a foe in battle to record it here.'),
    ...groups,
  );
  return mount(s);
}
