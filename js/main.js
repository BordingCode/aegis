// Boot + top-level screen router. No build step: served as ES modules.

import { Game, syncDebug } from './state.js';
import { loadArtManifest } from './art.js';
import { loadMeta } from './save.js';
import { mount, screen, el, hideSplash } from './ui.js';
import { renderTitle } from './screens/title.js';
import { renderHub } from './screens/hub.js';
import { renderHowTo } from './screens/howto.js';
import { renderBattle } from './screens/battle.js';

// Screen registry. Unknown names show a stub.
const ROUTES = {
  title: renderTitle,
  hub: renderHub,
  howto: renderHowTo,
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

// Drive layout height from the REAL visible viewport (works on every mobile
// browser, unlike the svh unit). The mobile address bar/toolbar overlaps the page
// and changes the visible height; visualViewport.height is the truthful value.
function fitViewport() {
  const h = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
  if (h) document.documentElement.style.setProperty('--app-h', Math.round(h) + 'px');
}
fitViewport();
window.addEventListener('resize', fitViewport);
window.addEventListener('orientationchange', fitViewport);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', fitViewport);
  window.visualViewport.addEventListener('scroll', fitViewport);
}

async function boot() {
  fitViewport();
  Game.meta = loadMeta();
  await loadArtManifest();
  go('title');
  hideSplash();
  // reveal the app only after the splash has cleared (avoids a double-logo cross-fade)
  setTimeout(() => document.getElementById('app').classList.add('ready'), 420);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

boot();
