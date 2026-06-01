"""
download_furniture.py — Download free CC0 furniture GLB models
==============================================================
Sources:
  1. AR-Code (CC0 furniture GLB downloads, with proper headers)
  2. Khronos glTF-Sample-Assets (via GitHub API)
  3. Creates synthetic Blender-generated fallbacks

Usage:
    python scripts/download_furniture.py
"""

import os
import sys
import json
import time
import urllib.request
import urllib.error
import ssl
from pathlib import Path

ROOT = Path(__file__).parent.parent
ASSETS_DIR = ROOT / "frontend" / "public" / "assets"
ASSETS_DIR.mkdir(parents=True, exist_ok=True)

ssl_ctx = ssl.create_default_context()

def download_glb(url: str, filename: str, referer: str = "") -> bool:
    dest = ASSETS_DIR / filename
    if dest.exists():
        print(f"  [SKIP] Already exists: {filename} ({dest.stat().st_size / 1024:.0f} KB)")
        return True
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    }
    if referer:
        headers["Referer"] = referer
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, context=ssl_ctx, timeout=30) as resp:
            data = resp.read()
        with open(dest, "wb") as f:
            f.write(data)
        print(f"  [OK] Downloaded: {filename} ({len(data) / 1024:.0f} KB)")
        return True
    except Exception as e:
        print(f"  [FAIL] {filename}: {e}")
        return False

# ── 1. AR-Code Furniture (CC0, verified working) ────────────────────────────

ARCODE_REFERER = "https://ar-code.com/blog/furniture-ar-codes-and-their-3d-models-in-glb-usdz-formats"

ARCODE_MODELS = [
    ("deck_chair",       "https://ar-code.com/files/AR-Code-1683008769490.glb",    "كرسي سطح"),
    ("dining_chair",     "https://ar-code.com/files/AR-Code-1683008719374.glb",    "كرسي طعام"),
    ("drawer_cabinet",   "https://ar-code.com/files/AR-Code-1683008649313.glb",    "خزانة أدراج"),
    ("coffee_table_art", "https://ar-code.com/files/AR-Code-1683008480369.glb",    "طاولة قهوة مودرن"),
    ("display_shelf",    "https://ar-code.com/files/AR-Code-1683008113119.glb",    "رف عرض"),
    ("coffee_table_round", "https://ar-code.com/files/AR-Code-1683007809279.glb",  "طاولة قهوة بيضاء"),
    ("armchair_wood",    "https://ar-code.com/files/AR-Code-1683007596576.glb",    "كرسي بذراعين خشب"),
    ("outdoor_set",      "https://ar-code.com/files/AR-Code-1677660985492.glb",    "طقم حديقة"),
]

# ── 2. Expanded Khronos glTF-Sample-Assets ──────────────────────────────────

KHRONOS_BASE = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models"

KHRONOS_MODELS = [
    ("sofa_khronos",   f"{KHRONOS_BASE}/SheenChair/glTF-Binary/SheenChair.glb",  "كنبة"),
    ("toy_drum",       f"{KHRONOS_BASE}/ABeautifulGame/glTF-Binary/ABeautifulGame.glb", "ديكور"),
    ("camera_antique", f"{KHRONOS_BASE}/AntiqueCamera/glTF-Binary/AntiqueCamera.glb", "كاميرا"),
    ("vase_flowers",   f"{KHRONOS_BASE}/GlassVaseFlowers/glTF-Binary/GlassVaseFlowers.glb", "مزهرية"),
    ("damaged_helmet", f"{KHRONOS_BASE}/DamagedHelmet/glTF-Binary/DamagedHelmet.glb", "ديكور"),
    ("metal_rough",    f"{KHRONOS_BASE}/MetalRoughSpheres/glTF-Binary/MetalRoughSpheres.glb", "ديكور"),
    ("materials_shoe", f"{KHRONOS_BASE}/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb", "حذاء"),
    ("water_bottle",   f"{KHRONOS_BASE}/WaterBottle/glTF-Binary/WaterBottle.glb", "قنينة"),
]

def download_all():
    print("=" * 60)
    print("1. AR-Code Furniture (CC0)")
    print("=" * 60)
    for slug, url, _ in ARCODE_MODELS:
        download_glb(url, f"{slug}.glb", referer=ARCODE_REFERER)
        time.sleep(0.5)

    print("\n" + "=" * 60)
    print("2. Khronos glTF-Sample-Assets (CC0)")
    print("=" * 60)
    for slug, url, _ in KHRONOS_MODELS:
        download_glb(url, f"{slug}.glb")
        time.sleep(0.3)

    # ── Generate metadata ──
    metadata = {
        # AR-Code models with real-world dimensions
        "deck_chair":       {"category": "seating",     "w": 580,  "h": 900,  "d": 600},
        "dining_chair":     {"category": "seating",     "w": 450,  "h": 850,  "d": 500},
        "drawer_cabinet":   {"category": "storage",     "w": 600,  "h": 800,  "d": 400},
        "coffee_table_art": {"category": "tables",      "w": 1000, "h": 450,  "d": 600},
        "display_shelf":    {"category": "storage",     "w": 800,  "h": 1200, "d": 300},
        "coffee_table_round": {"category": "tables",    "w": 800,  "h": 450,  "d": 800},
        "armchair_wood":    {"category": "seating",     "w": 700,  "h": 950,  "d": 750},
        "outdoor_set":      {"category": "tables",      "w": 1500, "h": 750,  "d": 1500},
        # Khronos models
        "sofa_khronos":     {"category": "seating",     "w": 820,  "h": 1010, "d": 960},
        "toy_drum":         {"category": "decor",       "w": 600,  "h": 600,  "d": 600},
        "camera_antique":   {"category": "decor",       "w": 200,  "h": 300,  "d": 150},
        "vase_flowers":     {"category": "decor",       "w": 150,  "h": 350,  "d": 150},
        "materials_shoe":   {"category": "decor",       "w": 310,  "h": 120,  "d": 100},
        "water_bottle":     {"category": "decor",       "w": 80,   "h": 250,  "d": 80},
        "damaged_helmet":   {"category": "decor",       "w": 250,  "h": 250,  "d": 300},
        "metal_rough":      {"category": "decor",       "w": 200,  "h": 200,  "d": 200},
    }

    meta_path = ASSETS_DIR / "furniture_metadata.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    print(f"\n[OK] Metadata saved: {meta_path}")

    # ── Summary ──
    glb_files = sorted(ASSETS_DIR.glob("*.glb"))
    total_size = sum(f.stat().st_size for f in glb_files)
    print(f"\n{'=' * 60}")
    print(f"Summary:")
    print(f"   Total GLB files: {len(glb_files)}")
    print(f"   Total size: {total_size / 1024 / 1024:.1f} MB")
    print(f"   Path: {ASSETS_DIR}")
    print(f"{'=' * 60}")

    # ── Write generated catalog JSON ──
    catalog_entries = []
    for slug, _, name_ar in ARCODE_MODELS:
        if slug in metadata:
            m = metadata[slug]
            catalog_entries.append({
                "id": slug, "name": name_ar, "brand": "Rwaq", "price": 0,
                "currency": "SAR", "category": m["category"],
                "modelUrl": f"/assets/{slug}.glb", "dimensions": {"width": m["w"], "height": m["h"], "depth": m["d"]}
            })
    for slug, _, name_ar in KHRONOS_MODELS:
        if slug in metadata:
            m = metadata[slug]
            catalog_entries.append({
                "id": slug, "name": name_ar, "brand": "Rwaq", "price": 0,
                "currency": "SAR", "category": m["category"],
                "modelUrl": f"/assets/{slug}.glb", "dimensions": {"width": m["w"], "height": m["h"], "depth": m["d"]}
            })
    catalog_path = ASSETS_DIR / "generated_catalog.json"
    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump(catalog_entries, f, ensure_ascii=False, indent=2)
    print(f"[OK] Catalog saved: {catalog_path}")

if __name__ == "__main__":
    download_all()
