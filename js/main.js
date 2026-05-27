// Boot + top-level screen router. No build step: served as ES modules.

import { Game, syncDebug } from './state.js';
import { loadArtManifest } from './art.js';
import { loadMeta } from './save.js';
import { mount, screen, el, hideSplash } from './ui.js';
import { renderTitle } from './screens/title.js';
import { renderHub } from './screens/hub.js';
import { renderHowTo } from './screens/howto.js';
import { renderPrepare } from './screens/prepare.js';
import { renderCodex } from './screens/codex.js';
import { renderBattle } from './screens/battle.js';

// Screen registry. Unknown names show a stub.
const ROUTES = {
  title: renderTitle,
  hub: renderHub,
  howto: renderHowTo,
  prepare: renderPrepare,
  codex: renderCodex,
  battle: renderBattle,
};

/** Lazily register a screen renderer (so later modules can plug in). */
export function route(name, fn) { ROUTES[name] = fn; }

/** Navigate to a screen. opts is passed through to the renderer. */
export function go(name, opts = {}) {
  Game.screen = name;
  const fn = ROUTES[name];
  if (fn) fn(opts);
  else stub(name);
  syncDebug();
  return name;
}

function stub(name) {
  const s = screen('stub');
  s.append(
    el('div.stub-card', {}, [
      el('h2', {}, 'Coming soon'),
      el('p', {}, `The "${name}" screen is not built yet.`),
      el('button.btn', { onclick: () => go('title') }, '← Back to title'),
    ]),
  );
  mount(s);
}

async function boot() {
  Game.meta = loadMeta();
  await loadArtManifest();
  go('title');
  hideSplash();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

boot();
