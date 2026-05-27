#!/usr/bin/env python3
"""Generate Aegis art via Pollinations.ai (free Flux text-to-image), PvZ-style
cartoon Greek. Sprites are generated on a white background, flood-filled to
transparent from the corners, and auto-cropped so they read on the battlefield.
Backgrounds + title stay opaque. Resumable (skips existing). Then run
build_manifest.py so the game (manifest-gated) picks them up.

  pip install pillow        # one time
  python3 tools/gen_art.py
"""
import os, io, time, urllib.parse, urllib.request
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "assets")

# Cohesive house style. Characters face RIGHT; the renderer flips enemies to face the fort.
SPRITE_STYLE = ("cute cartoon mobile game character, Greek mythology, bold black outline, "
    "flat vibrant colors, soft cel shading, simple readable shapes, full body, side view, "
    "facing right, centered, plain solid white background, no shadow, no ground, no text")
SCENE_STYLE = ("2D side-scrolling cartoon mobile game background art, Greek mythology, "
    "bold clean shapes, flat vibrant colours, warm Mediterranean light, detailed, no text, no characters")
# God portraits — head-and-shoulders busts facing the viewer (for the muster + hub cards).
GOD_STYLE = ("cute cartoon mobile game character portrait, Greek mythology god, head and shoulders bust, "
    "facing the viewer, bold black outline, flat vibrant colors, soft cel shading, majestic and characterful, "
    "centered, plain solid white background, no text")

MAP_STYLE = ("illustrated antique fantasy world map, top-down cartography, painted parchment and ink, "
    "decorative borders, mountains and rivers and coastlines, rich colour, no text, no labels")
MAPS = {
    "maps/earth":      "a map of ancient Greece — the blue Aegean sea dotted with islands, the Peloponnese, "
        "mountain ranges, the isle of Crete, winding roads between cities, sunlit Mediterranean parchment",
    "maps/underworld": "a dark map of the Greek Underworld — the winding rivers Styx and Acheron, the grey fields "
        "of Asphodel, black caverns and the pit of Tartarus, eerie green glow, gloomy parchment",
    "maps/olympus":    "a map of Mount Olympus rising through golden clouds, winding switchback paths climbing the "
        "snowy slopes to a gleaming summit palace, radiant sky, lofty parchment",
}

GODS = {
    "gods/zeus":     "Zeus king of the gods, a powerful white-bearded man with a laurel crown, crackling golden lightning around him",
    "gods/poseidon": "Poseidon god of the sea, a muscular sea-green-bearded man holding a trident, teal robes, coral crown",
    "gods/ares":     "Ares god of war, a fierce stern face beneath a red-crested bronze Corinthian helmet, battle-scarred",
    "gods/apollo":   "Apollo god of the sun, a radiant handsome youth with a golden laurel crown and a glowing sun halo behind his head",
}

SPRITES = {
    "defenders/shrine":  "a small white marble Greek shrine temple, two columns and a triangular pediment, soft golden glow",
    "defenders/toxotes": "a Greek archer in a green tunic drawing a wooden longbow",
    "defenders/oracle":  "a hooded Greek oracle priestess in flowing violet robes, a glowing magical eye",
    "units/hoplite":     "a Greek hoplite warrior with a round bronze shield, a spear, and a red-crested helmet",
    "enemies/shade":     "a pale blue translucent ghost spirit, glowing hollow eyes, cute and spooky",
    "enemies/skeleton":  "an armoured undead skeleton warrior holding a rusty sword, white bones",
    "enemies/harpy":     "a winged harpy, a bird-woman with brown feathers and sharp claws, in flight",
    "enemies/minotaur":  "a huge muscular minotaur with bull horns and brown fur, swinging a giant axe, fierce",
    # new units (loadout roster)
    "defenders/priestess": "a kindly Greek priestess healer in flowing white robes, holding aloft a golden chalice radiating warm light",
    "defenders/slinger":   "a Greek slinger skirmisher whirling a leather sling with a stone overhead, light brown tunic",
    "units/phalanx":       "a heavily armoured Greek phalanx soldier braced behind a tall bronze tower shield, a long spear, sturdy and immovable",
    "units/peltast":       "a light nimble Greek peltast skirmisher with a small crescent shield and a handful of javelins, mid-run, agile",
    # new enemies (later Acts)
    "enemies/satyr":    "a wild satyr, a horned goat-legged creature with shaggy fur swinging a knotted wooden club, feral and fast",
    "enemies/cyclops":  "a huge one-eyed cyclops giant, brutish and muscular, a single glaring eye, hefting a massive stone club",
    "enemies/griffin":  "a fierce griffin, an eagle head and great feathered wings on a tawny lion body, talons bared, in flight",
    "enemies/wraith":   "a spectral undead wraith knight in a tattered black cloak and dark dented armour, glowing red eyes, a rusted broadsword",
    "enemies/cerberus": "Cerberus the three-headed hellhound, an enormous black hound with three snarling fanged heads and glowing eyes, hellish guardian",
}
SCENES = {
    "backgrounds/act1": ("ancient Athens city walls and the great Dipylon stone gate at golden hour, marble ramparts, "
        "distant white temples and cypress trees, blue sky, empty grassy foreground", 1280, 720),
    "backgrounds/act2": ("the summit of Mount Olympus above the clouds, gleaming golden marble temple of the gods, "
        "tall fluted columns, sunlit clouds and blue sky, a wide empty marble courtyard foreground", 1280, 720),
    "backgrounds/act3": ("the gates of the Greek Underworld, a dark cavern of black basalt and rivers of glowing lava, "
        "eerie green fire braziers, looming bronze gate of Hades, a barren ashen foreground", 1280, 720),
    "ui/title": ("epic poster key art, a lone Greek demigod hero stands before the towering gates of the Underworld, "
        "storm clouds and golden lightning, Mount Olympus far behind, dramatic and cinematic", 1280, 720),
}
# App icon (PWA install): a centred emblem on a solid field, safe for maskable.
ICON_PROMPT = ("app icon, a golden Greek aegis round shield with a crested Corinthian helmet, "
    "radiant lightning bolt, centered emblem, deep blue background, bold clean vector logo, "
    "flat vibrant colors, thick outline, simple, no text")


def fetch(prompt, w, h, seed):
    url = ("https://image.pollinations.ai/prompt/" + urllib.parse.quote(prompt)
           + f"?width={w}&height={h}&seed={seed}&model=flux&nologo=true&enhance=false")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(req, timeout=180).read()


def cutout(img):
    """Flood-fill the (near-white) background from each corner, then knock it out
    to alpha and crop to the character. Interior whites are preserved because the
    fill only spreads through connected background pixels."""
    img = img.convert("RGB")
    w, h = img.size
    SENT = (255, 0, 255)
    for c in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        try:
            ImageDraw.floodfill(img, c, SENT, thresh=46)
        except Exception:
            pass
    px = img.load()
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    op = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if (r, g, b) != SENT:
                op[x, y] = (r, g, b, 255)
    bbox = out.getbbox()
    return out.crop(bbox) if bbox else out


def make_sprite(path, prompt, seed, style=SPRITE_STYLE):
    full = os.path.join(A, path + ".webp")
    if os.path.exists(full) and os.path.getsize(full) > 2000:
        print("  skip:", path); return 1
    os.makedirs(os.path.dirname(full), exist_ok=True)
    for attempt in range(4):
        try:
            data = fetch(prompt + ", " + style, 768, 768, seed)
            img = Image.open(io.BytesIO(data)).convert("RGB").resize((360, 360), Image.LANCZOS)
            sprite = cutout(img)
            sprite.save(full, "WEBP", quality=85, method=6)
            print(f"  ok: {path}.webp  {sprite.size}  {os.path.getsize(full)//1024}KB"); return 1
        except Exception as e:
            print(f"  retry {attempt+1} {path}: {e}"); time.sleep(3 + attempt * 3)
    print("  FAIL:", path); return 0


def make_scene(path, prompt, w, h, seed):
    full = os.path.join(A, path + ".webp")
    if os.path.exists(full) and os.path.getsize(full) > 2000:
        print("  skip:", path); return 1
    os.makedirs(os.path.dirname(full), exist_ok=True)
    for attempt in range(4):
        try:
            data = fetch(prompt + ", " + SCENE_STYLE, w, h, seed)
            img = Image.open(io.BytesIO(data)).convert("RGB").resize((w, h), Image.LANCZOS)
            img.save(full, "WEBP", quality=82, method=6)
            print(f"  ok: {path}.webp  {img.size}  {os.path.getsize(full)//1024}KB"); return 1
        except Exception as e:
            print(f"  retry {attempt+1} {path}: {e}"); time.sleep(3 + attempt * 3)
    print("  FAIL:", path); return 0


def make_icons(seed):
    """One square emblem → PNG icons at the two PWA sizes. Maskable-safe: the
    emblem already sits centred on a solid field, so no extra padding needed."""
    p192 = os.path.join(ROOT, "icons", "icon-192.png")
    p512 = os.path.join(ROOT, "icons", "icon-512.png")
    if os.path.exists(p512) and os.path.getsize(p512) > 2000:
        print("  skip: icons"); return 1
    os.makedirs(os.path.dirname(p512), exist_ok=True)
    for attempt in range(4):
        try:
            data = fetch(ICON_PROMPT, 1024, 1024, seed)
            img = Image.open(io.BytesIO(data)).convert("RGB")
            img.resize((512, 512), Image.LANCZOS).save(p512, "PNG")
            img.resize((192, 192), Image.LANCZOS).save(p192, "PNG")
            print(f"  ok: icons icon-512.png / icon-192.png  {os.path.getsize(p512)//1024}KB"); return 1
        except Exception as e:
            print(f"  retry {attempt+1} icons: {e}"); time.sleep(3 + attempt * 3)
    print("  FAIL: icons"); return 0


def run():
    seed, n = 700, 0
    print("SPRITES")
    for k, core in SPRITES.items():
        seed += 1; n += make_sprite(k, core, seed); time.sleep(0.5)
    print("GODS")
    for k, core in GODS.items():
        seed += 1; n += make_sprite(k, core, seed, GOD_STYLE); time.sleep(0.5)
    print("SCENES")
    for k, (core, w, h) in SCENES.items():
        seed += 1; n += make_scene(k, core, w, h, seed); time.sleep(0.5)
    print("MAPS")
    for k, core in MAPS.items():
        seed += 1; n += make_scene(k, core + ", " + MAP_STYLE, 1280, 720, seed); time.sleep(0.5)
    print("ICONS")
    seed += 1; n += make_icons(seed)
    print(f"DONE — {n} assets generated")


if __name__ == "__main__":
    run()
