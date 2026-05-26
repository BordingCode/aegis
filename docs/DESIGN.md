# Aegis — Design (source of truth)

## Pitch
Greek-myth **tower-defense roguelite**. Kingdom Rush (single winding path, place defenders on fixed plots) × Hades (god-boons + die-and-return meta) × Plants vs Zombies (regenerating **Favor** to summon defenders). Side-view, cartoon art, landscape phone-first PWA.

## Story
The seals of the Underworld are failing. A demigod, doomed to keep returning, holds the gate across three acts:
1. **Act 1 — Mortal city:** defend the **Dipylon Gate of Athens**.
2. **Act 2 — Mount Olympus.**
3. **Act 3 — the Underworld gates.**

## Core loop (a map, ~5–10 min)
- **5 lanes**; enemies march LEFT toward your **fort** (fort HP; 0 = lose). **Zeus** stands on the fort, auto-smiting the nearest foe.
- **Favor** is the build resource: a slow passive trickle **plus** a **Shrine** posted on the wall.
- **Age-of-War model:** **Wall units** (Toxotes archer, Oracle buff, Shrine) are posted to a lane ON the fort — *tap a card, tap a lane* — and **stack** along the wall, firing down their lane; they're **vulnerable** if the lane breaks. **Troops** (Hoplite, melee) **sortie** out — *tap a card, tap a lane* — to block & fight forward and shield the wall. Tap a posted unit → **upgrade or sell**.
- **God-powers** on cooldown, tap-to-cast (prototype: **Zeus** Lightning Strike — AoE + stun).
- Clear all waves → win the map. Drachma is earned every run (scaled by foes slain), so meta-progress builds even on a loss.

## Roguelite structure
- A **run** = a linear gauntlet of ~5 maps per act (~15 total). Each map ends with a **pick-1-of-3 god-boon** (Hades style) from a random Olympian.
- **Difficulty: tough.** **On death → full reset to map 1.** The run is discarded; only meta persists.
- **Meta (persists):** **Drachma** currency, unlocked defenders, unlocked god-powers, permanent upgrades. Spent in the **hub** between runs.

## Prototype scope (freeze)
- Act 1 only, ~5 maps.
- Placeables: **Shrine** (favor gen), **Hoplite** (melee blocker), **Toxotes** (ranged; hits flyers), **Oracle** (support buff).
- Enemies: **Shade** (swarm), **Skeleton** (armored), **Harpy** (flying), **Minotaur** (mini-boss).
- One god: **Zeus** (lightning power + boons: chain lightning, crit, etc.).
- ~4–5 Drachma meta-upgrades.
- No audio yet (visuals first).

## Tech
- Vanilla HTML/CSS/JS, **ES modules, no build step**, served statically.
- **Hybrid rendering:** `<canvas>` battlefield + DOM HUD/menus.
- **Fixed-timestep** sim loop (STEP = 1/60) for determinism; render interpolates; pause + 1×/2× speed.
- Seeded RNG (`js/rng.js`) everywhere randomness is used → reproducible runs.
- AI art via **Pollinations/Flux**, manifest-gated (`assets/manifest.json` + `js/art.js`); emoji/SVG fallbacks.
- Deploy: GitHub Pages under **BordingCode** → `bordingcode.github.io/aegis`.

## Art direction
PvZ-style **cartoon, side view**: bold clean outlines, flat vibrant colors, soft cel shading, friendly, readable. Characters in side-profile (face right; flipped in code by direction). Per-act palette: Act 1 sunny ivory/terracotta/olive, Act 2 gold/sky-blue/white, Act 3 purple/ember/teal. Style suffix lives in `tools/gen_art.py` and `docs/ART.md`.
