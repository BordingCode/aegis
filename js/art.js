// Art loader: use a real image from assets/ when present, else a fallback node
// (SVG icon / emoji). Gated by assets/manifest.json (a list of files that exist) so
// empty slots make NO network requests — drop a file in AND add its path to the
// manifest to light it up. Missing manifest = all fallbacks, zero 404s.

import { el } from './ui.js';

let manifest = new Set();

export async function loadArtManifest() {
  try {
    const res = await fetch('assets/manifest.json', { cache: 'no-cache' });
    if (res.ok) { const list = await res.json(); if (Array.isArray(list)) manifest = new Set(list); }
  } catch (_) { /* no manifest → fallbacks only */ }
}

export const hasArt = (src) => manifest.has(src);

/** Wrapper showing `fallbackNode`, swapped for <img src> if the asset exists. */
export function artOrFallback(src, fallbackNode, cls = '') {
  const wrap = el('div.art' + (cls ? '.' + cls : ''));
  wrap.appendChild(fallbackNode);
  if (src && manifest.has(src)) {
    const img = new Image();
    img.alt = '';
    img.onload = () => { img.className = 'art-img'; wrap.replaceChildren(img); };
    img.onerror = () => {};
    img.src = src;
  }
  return wrap;
}

/** Apply a background image only if it's in the manifest and loads. */
export function bgImage(elm, src) {
  if (!elm || !src || !manifest.has(src)) return;
  const img = new Image();
  img.onload = () => { elm.style.backgroundImage = `url("${src}")`; elm.classList.add('has-bg'); };
  img.src = src;
}

/** Load an <img> sprite for canvas drawing if the asset exists, else null.
 *  Returns an HTMLImageElement (may still be loading) or null. */
const _spriteCache = new Map();
export function sprite(src) {
  if (!src || !manifest.has(src)) return null;
  if (_spriteCache.has(src)) return _spriteCache.get(src);
  const img = new Image();
  img.decoding = 'async';
  img.src = src;
  _spriteCache.set(src, img);
  return img;
}
