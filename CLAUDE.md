# Aegis — project guide for Claude

A vanilla **ES-module** PWA: a Greek-myth **tower-defense roguelite** rendered to `<canvas>`.
No build step. Repo: `BordingCode/aegis` (branch **main**), GitHub Pages
(`bordingcode.github.io/aegis`).

## Before working
Read the shared game-dev knowledge base: **`~/cc/gamedev-kb/INDEX.md`**. Especially
`patterns/canvas-engine-games.md`, `patterns/game-loop-and-timing.md`,
`patterns/mobile-ios-safari.md`, and `checklists/new-canvas-game.md` + `ship-checklist.md`.

## Architecture
- `js/main.js` — boot + screen **router** (`go(name, opts)`, `ROUTES`, `route()`).
- `js/state.js` — central **`Game`** object; `syncDebug()` mirrors a flat snapshot to
  `window.__gameState`; `window.__errors` collects runtime errors (test hooks).
- `js/engine/` — `loop.js` (fixed-timestep 1/60s + `MAX_STEPS` clamp), `canvas.js`
  (DPR-aware letterbox `CanvasView`, world↔screen), `input.js` (one pointer listener →
  world coords), `render.js` (pure draw), `pool.js` (object pool), `vec.js`, `audio.js`
  (procedural Web Audio), `sprites.js` (hand-drawn fallback).
- `js/battle/world.js` — the live **sim** (`step(dt)`); owns entity arrays; **no DOM/canvas**.
- `js/data/` — plain-object defs (enemies, defenders, levels, relics, …).
- `js/rng.js` — seeded **mulberry32** `RNG`; run-scoped, exposed via `Game.rng.seed`.
- `js/save.js` — localStorage: `aegis_meta_v1` (persistent) + `aegis_run_v1` (resumable run);
  fall back to defaults on parse error.

## Conventions / rules
- Entities are **plain objects** from factory functions; **pool** projectiles/FX (no
  per-frame allocation). Use seeded `Game.rng` for all gameplay randomness (not `Math.random`).
- Loop lifecycle: `loop.start()`/`loop.stop()` (stop cancels rAF); pause on tab-hidden.
- Audio: procedural synth (oscillators + filtered noise), master gain, mute persisted,
  **unlocked on first tap**. Keep it pleasant.
- Render reads world state; never mix sim and draw.

## Every change MUST
- **Bump the SW `CACHE` string** in `sw.js` (e.g. `aegis-v29`→`v30`) and add any new file to
  the `SHELL` array (network-first; no `?v=` scheme here — match the existing style).
- Be phone-first (landscape; safe areas; pointer-capture + `pointercancel`; audio on gesture).
- Be **tested**: serve locally + Playwright, assert on `window.__gameState`, gate on
  `window.__errors` being empty (don't read canvas pixels). See KB verification checklist.
- Be **committed and pushed** to `main`.

## Art
AI art via Pollinations (`.webp` in `assets/`, listed in `assets/manifest.json`, SW-cached);
hand-drawn canvas fallback so it looks complete without assets.
