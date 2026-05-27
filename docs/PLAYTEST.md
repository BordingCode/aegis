# Aegis — Playtest & balance results

_Build 29 (SW `aegis-v29`). Updated 2026-05-27._

How to reproduce:

- `npm test` — unit/regression suite (battle balance, save round-trip, powers, full campaign clearable).
- `node tools/sim.mjs` — linear-run balance report (map 1 spread + full stacked run).
- `node -e "import('./tools/sim.mjs').then(m => m.simCampaign())"` — standalone per-mission campaign balance.

## Regression suite — `npm test`

7 / 7 passing:

1. Act 1 map 1: no defence loses
2. Act 1 map 1: competent play wins but takes fort damage (the early skill gate)
3. Full run: competent play clears all maps, boons compounding across them
4. powers are built from the loadout gods
5. a run round-trips through saveRun → loadRun, and clears
6. Campaign: every mission is clearable standalone by competent play
7. determinism: same seed → same result

## Campaign balance — standalone per-mission sim

Each mission simulated fresh (boons reset per mission, only the meta kit a player
would plausibly hold in that realm: Earth = Zeus; Underworld = +Poseidon +2 relics;
Olympus = +4 relics). The sim's "competent" player is a conservative archer-heavy
bot that does **not** use the melee-vs-armour RPS, relics, or god picks — so these
results are a lower bound; real players will find missions fair-to-tough.

All 18 missions clear, with a deliberate curve (fort remaining / max at the end):

| Realm | Mission | Type | Result | Fort left |
|---|---|---|---|---|
| Earth | The Dipylon Gate | defense | WON | 60/75 |
| Earth | The Plain of Marathon | defense | WON | 75/75 |
| Earth | The Nemean Den | assault | WON | 50/50 |
| Earth | The Oracle at Delphi | defense | WON | 12/75 |
| Earth | The Gates of Thebes | assault | WON | 22/50 |
| Earth | The Labyrinth of Crete | boss | WON | 48/50 |
| Earth | The Cave of Polyphemus | boss | WON | 35/50 |
| Underworld | The Crossing of the Styx | defense | WON | 89/115 |
| Underworld | The Gate of Cerberus | boss | WON | 93/115 |
| Underworld | The Fields of Asphodel | assault | WON | 82/90 |
| Underworld | The Pit of Tartarus | defense | WON | 96/115 |
| Underworld | The Banks of Lethe | assault | WON | 72/90 |
| Underworld | The Hydra of the Depths | boss | WON | 83/90 |
| Olympus | The Cloudward Ascent | assault | WON | 54/90 |
| Olympus | The Gigantomachy | defense | WON | 86/115 |
| Olympus | The Chained Titan | boss | WON | 76/90 |
| Olympus | The Hall of the Gods | defense | WON | 64/115 |
| Olympus | Typhon, Father of Monsters | boss | WON | 90/90 |

Notable challenge spikes (low fort remaining = nail-biters): **Delphi (12/75)**,
**Thebes (22/50)**, **Pantheon (64/115)**.

## Full-run playthrough — in-browser (Playwright)

A complete campaign was driven through the real UI on a **fresh new-player profile**
(only Zeus + starter units), traversing map → muster → battle → map for every node:

- **18 / 18 missions cleared** — Earth 7, Underworld 6, Olympus 5.
- **Branching unlocks** opened correctly as prerequisites cleared.
- **Realm gating + travel** worked: Earth → Underworld → Olympus, each gated by its
  realm boss.
- **Realm bosses beaten:** Polyphemus, the Hydra, Typhon (`progress.wins = 3`).
- **All 6 relics** earned from boss/key missions and persisted.
- **1302 Drachma** accrued across the run.
- Final state: Olympus "Realm conquered ✓", no further realm (correct finale).
- **`window.__errors` empty** — zero console errors across the entire journey.

### Known cosmetic note (not a bug)

`meta.progress.bestLevel` still reads `1` in the campaign because campaign missions
share the legacy linear map-index; the value is vestigial and unused by the campaign.
