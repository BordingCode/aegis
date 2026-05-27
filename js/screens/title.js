// Title screen — the front door. Logo, tagline, and "New Run".

import { Game } from '../state.js';
import { mount, screen, el } from '../ui.js';
import { bgImage } from '../art.js';
import { icon } from '../icons.js';
import { loadRun } from '../save.js';
import { go } from '../main.js';

export function renderTitle() {
  const s = screen('title');

  const hero = el('div.title-hero');
  bgImage(hero, 'ui/title.webp'); // gated by manifest; CSS gradient otherwise

  const drachma = Game.meta ? Game.meta.currency : 0;
  const saved = loadRun();

  hero.append(
    el('div.title-top', {}, [
      el('div.coin-pill', { title: 'Drachma' }, [icon('coin', { size: 18 }), el('span', {}, String(drachma))]),
    ]),
    el('div.title-center', {}, [
      el('div.title-mark', {}, [icon('laurel', { size: 34, cls: 'laurel-l' }), el('h1.logo', {}, 'AEGIS'), icon('laurel', { size: 34, cls: 'laurel-r' })]),
      el('p.tagline', {}, 'The seals of the Underworld are failing. Hold the gate.'),
      el('div.title-actions', {}, [
        ...(saved ? [el('button.btn.btn-primary.btn-lg', { dataset: { testid: 'btn-continue' }, onclick: () => { Game.run = loadRun(); go('battle'); } }, `Continue · Map ${saved.mapIndex + 1}`)] : []),
        el('button.btn' + (saved ? '.btn-ghost' : '.btn-primary.btn-lg'), { dataset: { testid: 'btn-new-run' }, onclick: () => go('hub') }, saved ? 'Hall of the Gods' : 'New Run'),
        el('button.btn.btn-ghost', { onclick: () => go('howto') }, 'How to Play'),
      ]),
    ]),
    el('div.title-foot', {}, [
      el('span.muted', {}, 'A Greek-myth tower-defense roguelite · build 21'),
    ]),
  );

  s.append(hero);
  return mount(s);
}
