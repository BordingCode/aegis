# Aegis — Hold the Gate

A Greek-myth **tower-defense roguelite** PWA. *Kingdom Rush* (place defenders along a path) × *Hades* (god-boons + die-and-return meta-progression) × *Plants vs Zombies* (regenerating "favor" to summon defenders). Side-view, cartoon art, landscape phone-first.

The seals of the Underworld are failing. As a demigod doomed to keep returning, you hold the gate — first a mortal city (Athens), then Mount Olympus, then the Underworld itself.

## Run it

No build step. Serve the folder statically:

```bash
npm run serve        # python3 -m http.server 8099
# open http://localhost:8099/
```

## Art (AI-generated)

Art is generated free via [Pollinations.ai](https://pollinations.ai) (Flux) and gated by `assets/manifest.json` — the game runs fine on emoji/SVG fallbacks until art exists.

```bash
npm run art          # python3 tools/gen_art.py    (needs Pillow: pip install pillow)
npm run manifest     # python3 tools/build_manifest.py  -> rebuilds assets/manifest.json
```

## Tests

```bash
npm test             # node --test test/   (headless sim determinism + balance)
```

## Deploy

Static GitHub Pages under the **BordingCode** account → `bordingcode.github.io/aegis`.

See `docs/DESIGN.md` for the full design and `docs/ART.md` for the art slots & style.
