// Hand-authored SVG icons (Greek-myth flavoured). Returned as a <span.icon>
// wrapping an inline <svg>; assigning the markup via innerHTML on an HTML element
// produces correctly-namespaced SVG, so no createElementNS dance is needed.
// Stroke uses currentColor → colour with CSS. These are UI/fallback icons; AI art
// replaces entity sprites on the battlefield.

import { el } from './ui.js';

const P = {
  shield:  '<path d="M12 2.5 19 5.2V11c0 4.4-2.9 7.9-7 9.3C7.9 18.9 5 15.4 5 11V5.2z"/>',
  bow:     '<path d="M6 3c5 3 5 15 0 18"/><path d="M4 12h15m-4-3 4 3-4 3"/>',
  eye:     '<path d="M2 12s4-6.5 10-6.5S22 12 22 12s-4 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/>',
  column:  '<path d="M5 4h14M4 20h16M8 4v16M16 4v16M7 8h10M7 16h10"/>',
  bolt:    '<path d="M13 2 4 14h6l-1 8 9-12h-6z" fill="currentColor" stroke="none"/>',
  skull:   '<path d="M12 3a7 7 0 0 0-5 11.9V18a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-3.1A7 7 0 0 0 12 3z"/><circle cx="9.5" cy="12.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="14.5" cy="12.5" r="1.4" fill="currentColor" stroke="none"/>',
  gate:    '<path d="M4 21V8l8-5 8 5v13M9 21v-7a3 3 0 0 1 6 0v7"/>',
  coin:    '<circle cx="12" cy="12" r="9"/><path d="M9 9.5A3 3 0 0 1 15 9M9 14.5A3 3 0 0 0 15 15M12 6.5v11"/>',
  laurel:  '<path d="M12 21c-4 0-7-3-7-8 0-3 1.5-5 4-6M12 21c4 0 7-3 7-8 0-3-1.5-5-4-6"/>',
  pause:   '<path d="M8 5v14M16 5v14"/>',
  play:    '<path d="M7 4 20 12 7 20z" fill="currentColor" stroke="none"/>',
  fast:    '<path d="M4 5 12 12 4 19zM12 5 20 12 12 19z" fill="currentColor" stroke="none"/>',
  gear:    '<circle cx="12" cy="12" r="3.4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  heart:   '<path d="M12 20s-7-4.5-9.2-9A4.7 4.7 0 0 1 12 6.5 4.7 4.7 0 0 1 21.2 11C19 15.5 12 20 12 20z"/>',
  feather: '<path d="M20 4C9 4 4 11 4 18l3-3c3 0 12-2 13-11zM7 17l6-6"/>',
  horns:   '<path d="M4 6c0 6 4 9 8 9s8-3 8-9c-3 1-5 3-8 3s-5-2-8-3z"/>',
  sound:   '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 8.5a4 4 0 0 1 0 7M18.5 6a7 7 0 0 1 0 12"/>',
  mute:    '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l4 6M21 9l-4 6"/>',
  trident: '<path d="M12 3v18M6 4v4a6 6 0 0 0 12 0V4M6 4l-1 3M18 4l1 3"/>',
  spear:   '<path d="M5 19 19 5M19 5h-5M19 5v5M7 13l4 4"/>',
  sun:     '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
};

export function icon(name, { size = 22, cls = '' } = {}) {
  const inner = P[name] || P.laurel;
  return el('span.icon' + (cls ? '.' + cls.split(' ').join('.') : ''), {
    html: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`,
  });
}

// Emoji fallbacks used on the battlefield before AI art exists.
export const EMOJI = {
  shrine: '⛩️', hoplite: '🛡️', toxotes: '🏹', oracle: '🔮', ballista: '🎯',
  shade: '👻', skeleton: '💀', harpy: '🦅', minotaur: '🐂',
  zeus_bolt: '⚡', gate: '🏛️', drachma: '🪙',
};
