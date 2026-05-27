/* Aegis service worker — network-first (fresh code online, full offline fallback). */
const CACHE = 'aegis-v27';
const SHELL = [
  './',
  'index.html',
  'manifest.json',
  'css/main.css',
  'css/screens.css',
  'css/battle.css',
  'js/main.js',
  'js/state.js',
  'js/rng.js',
  'js/ui.js',
  'js/art.js',
  'js/save.js',
  'js/icons.js',
  'js/screens/title.js',
  'js/screens/hub.js',
  'js/screens/howto.js',
  'js/screens/prepare.js',
  'js/screens/codex.js',
  'js/screens/map.js',
  'js/screens/battle.js',
  'js/engine/vec.js',
  'js/engine/pool.js',
  'js/engine/canvas.js',
  'js/engine/loop.js',
  'js/engine/render.js',
  'js/engine/sprites.js',
  'js/engine/audio.js',
  'js/engine/input.js',
  'js/battle/favor.js',
  'js/battle/enemies.js',
  'js/battle/units.js',
  'js/battle/defenders.js',
  'js/battle/projectiles.js',
  'js/battle/spawner.js',
  'js/battle/bosses.js',
  'js/battle/world.js',
  'js/run/meta.js',
  'js/data/enemies.js',
  'js/data/defenders.js',
  'js/data/powers.js',
  'js/data/upgrades.js',
  'js/data/levels.js',
  'js/data/relics.js',
  'js/data/campaign.js',
  'assets/manifest.json',
  'assets/maps/earth.webp',
  'assets/maps/underworld.webp',
  'assets/maps/olympus.webp',
  'assets/backgrounds/act1.webp',
  'assets/backgrounds/act2.webp',
  'assets/backgrounds/act3.webp',
  'assets/ui/title.webp',
  'assets/defenders/shrine.webp',
  'assets/defenders/toxotes.webp',
  'assets/defenders/oracle.webp',
  'assets/defenders/priestess.webp',
  'assets/defenders/slinger.webp',
  'assets/units/hoplite.webp',
  'assets/units/phalanx.webp',
  'assets/units/peltast.webp',
  'assets/gods/zeus.webp',
  'assets/gods/poseidon.webp',
  'assets/gods/ares.webp',
  'assets/gods/apollo.webp',
  'assets/enemies/shade.webp',
  'assets/enemies/skeleton.webp',
  'assets/enemies/harpy.webp',
  'assets/enemies/minotaur.webp',
  'assets/enemies/satyr.webp',
  'assets/enemies/cyclops.webp',
  'assets/enemies/griffin.webp',
  'assets/enemies/wraith.webp',
  'assets/enemies/cerberus.webp',
  'assets/enemies/hydra.webp',
  'assets/enemies/typhon.webp',
  'icons/favicon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Network-first for same-origin GET: always try fresh, cache the result, and fall
// back to cache (then index.html) when offline. Cross-origin requests pass through.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('index.html'))),
  );
});
