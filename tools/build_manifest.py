#!/usr/bin/env python3
"""Scan assets/ for valid .webp files and write assets/manifest.json — the flat
list of asset paths the game (js/art.js) is allowed to load. Only files that open
cleanly in PIL are listed, so a half-written image can never be referenced. Paths
are relative to assets/. Run from repo root: python3 tools/build_manifest.py"""
import os, json
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "assets")

paths = []
for dirpath, _, files in os.walk(A):
    for f in files:
        if not f.endswith(".webp"):
            continue
        full = os.path.join(dirpath, f)
        try:
            if os.path.getsize(full) < 2000:
                continue
            with Image.open(full) as im:
                im.verify()  # rejects truncated / half-written files
        except Exception as e:
            print("skip invalid:", f, e); continue
        paths.append(os.path.relpath(full, A).replace(os.sep, "/"))

paths.sort()
with open(os.path.join(A, "manifest.json"), "w") as fh:
    json.dump(paths, fh, indent=0)
    fh.write("\n")
print(f"manifest.json — {len(paths)} assets:")
for p in paths:
    print("  ", p)
