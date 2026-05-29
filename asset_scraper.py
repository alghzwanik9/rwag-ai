"""
asset_scraper.py — Sprint 3: Automated 3D Asset Ingestion Pipeline
===================================================================

Three scraping/ingestion sources (in priority order):

  1. LocalFileScanner  — scans frontend/public/assets/ for .glb files already
                         on disk and seeds them with known dimension metadata.
  2. KhronosGitHubScraper — uses the GitHub Contents API (no auth required)
                         to pull freely-licensed glTF-Sample-Assets models.
  3. GenericHTTPScraper — pluggable adapter for any HTML page that embeds a
                         3D viewer; extracts .glb URLs + dimension text via
                         configurable CSS selectors and RegEx patterns.

All records are upserted into LanceDB → furniture_assets table, which is
then read by GET /api/v1/assets instead of the previous static list.

Usage (standalone):
    python asset_scraper.py [--source local|khronos|http] [--url <page_url>]
                            [--category seating] [--delay 0.5] [--dry-run]

Usage (via FastAPI background task):
    POST /api/v1/assets/ingest   { "source": "khronos", "delay": 0.3 }
"""

import os
import re
import uuid
import json
import time
import logging
import asyncio
import argparse
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import httpx
import pyarrow as pa
import lancedb
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()

# ── Logging ────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("asset_scraper")

# ── Paths ──────────────────────────────────────────────────────────────────────

_ROOT          = Path(__file__).parent
_LANCEDB_PATH  = str(_ROOT / ".lancedb")
_LOCAL_GLB_DIR = _ROOT / "frontend" / "public" / "assets"
_TABLE_NAME    = "furniture_assets"

# ── Schema ─────────────────────────────────────────────────────────────────────

ASSET_SCHEMA = pa.schema([
    pa.field("asset_id",          pa.string()),
    pa.field("name",              pa.string()),
    pa.field("category",          pa.string()),
    pa.field("source",            pa.string()),
    pa.field("model_url",         pa.string()),
    pa.field("thumbnail_url",     pa.string()),
    pa.field("dim_width_mm",      pa.float32()),   # millimetres
    pa.field("dim_height_mm",     pa.float32()),
    pa.field("dim_depth_mm",      pa.float32()),
    pa.field("default_scale_x",   pa.float32()),
    pa.field("default_scale_y",   pa.float32()),
    pa.field("default_scale_z",   pa.float32()),
    pa.field("ingested_at",       pa.string()),   # ISO-8601
])

@dataclass
class AssetRecord:
    """Single furniture asset matching the /api/v1/assets JSON contract."""
    asset_id:       str
    name:           str
    category:       str           # seating | tables | lighting | rugs | decor
    source:         str           # vendor / repo name
    model_url:      str           # .glb URL (local path or absolute)
    thumbnail_url:  str = ""
    dim_width_mm:   float = 1000.0
    dim_height_mm:  float = 1000.0
    dim_depth_mm:   float = 1000.0
    default_scale_x: float = 1.0
    default_scale_y: float = 1.0
    default_scale_z: float = 1.0
    ingested_at:    str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    def to_api_dict(self) -> dict:
        """Serialize to the shape expected by the frontend."""
        return {
            "asset_id":      self.asset_id,
            "name":          self.name,
            "category":      self.category,
            "source":        self.source,
            "model_url":     self.model_url,
            "thumbnail_url": self.thumbnail_url,
            "dimensions": {
                "width":  self.dim_width_mm,
                "height": self.dim_height_mm,
                "depth":  self.dim_depth_mm,
            },
            "default_scale": [
                self.default_scale_x,
                self.default_scale_y,
                self.default_scale_z,
            ],
        }

# ── LanceDB Store ──────────────────────────────────────────────────────────────

class LanceDBAssetStore:
    """Thin wrapper around LanceDB that upserts AssetRecords by asset_id."""

    def __init__(self, db_path: str = _LANCEDB_PATH):
        self._db = lancedb.connect(db_path)
        self._table = self._get_or_create_table()

    def _get_or_create_table(self):
        try:
            return self._db.open_table(_TABLE_NAME)
        except Exception:
            logger.info("Creating LanceDB table '%s'", _TABLE_NAME)
            # Seed with an empty batch so schema is registered
            empty = pa.table({name: pa.array([], type=field.type)
                              for name, field in zip(ASSET_SCHEMA.names,
                                                     ASSET_SCHEMA)})
            return self._db.create_table(_TABLE_NAME, data=empty, schema=ASSET_SCHEMA)

    def upsert(self, record: AssetRecord) -> None:
        """Insert or update a record keyed on asset_id."""
        row = {
            "asset_id":        record.asset_id,
            "name":            record.name,
            "category":        record.category,
            "source":          record.source,
            "model_url":       record.model_url,
            "thumbnail_url":   record.thumbnail_url,
            "dim_width_mm":    float(record.dim_width_mm),
            "dim_height_mm":   float(record.dim_height_mm),
            "dim_depth_mm":    float(record.dim_depth_mm),
            "default_scale_x": float(record.default_scale_x),
            "default_scale_y": float(record.default_scale_y),
            "default_scale_z": float(record.default_scale_z),
            "ingested_at":     record.ingested_at,
        }
        try:
            self._table.delete(f"asset_id = '{record.asset_id}'")
        except Exception:
            pass  # table empty on first run
        self._table.add([row])
        logger.debug("Upserted asset_id=%s (%s)", record.asset_id, record.name)

    def all_records(self) -> list[dict]:
        """Return all rows formatted for /api/v1/assets."""
        try:
            rows = self._table.to_pandas().to_dict("records")
        except Exception:
            return []
        return [
            AssetRecord(
                asset_id      = r["asset_id"],
                name          = r["name"],
                category      = r["category"],
                source        = r["source"],
                model_url     = r["model_url"],
                thumbnail_url = r.get("thumbnail_url", ""),
                dim_width_mm  = r["dim_width_mm"],
                dim_height_mm = r["dim_height_mm"],
                dim_depth_mm  = r["dim_depth_mm"],
                default_scale_x = r.get("default_scale_x", 1.0),
                default_scale_y = r.get("default_scale_y", 1.0),
                default_scale_z = r.get("default_scale_z", 1.0),
                ingested_at   = r.get("ingested_at", ""),
            ).to_api_dict()
            for r in rows
        ]

    def count(self) -> int:
        try:
            return len(self._table.to_pandas())
        except Exception:
            return 0

# ── Dimension Parser ───────────────────────────────────────────────────────────

_DIM_PATTERNS = [
    # "Width: 820 mm"  /  "W: 820mm"
    r"(?:width|w)[:\s]+([0-9]+(?:\.[0-9]+)?)\s*(?:mm|cm|m)\b",
    # "82 cm × 50 cm × 40 cm"  (W × H × D)
    r"([0-9]+(?:\.[0-9]+)?)\s*(?:mm|cm|m)\s*[×x]\s*([0-9]+(?:\.[0-9]+)?)\s*(?:mm|cm|m)\s*[×x]\s*([0-9]+(?:\.[0-9]+)?)\s*(?:mm|cm|m)",
]

_UNIT_FACTORS = {"mm": 1.0, "cm": 10.0, "m": 1000.0}

def _to_mm(value: float, unit: str) -> float:
    return value * _UNIT_FACTORS.get(unit.lower(), 1.0)

def parse_dimensions(text: str) -> Optional[tuple[float, float, float]]:
    """
    Try to extract (width_mm, height_mm, depth_mm) from a raw dimension string.
    Returns None if no recognisable pattern is found.
    """
    # Pattern 1: single W × H × D triplet on one line
    m = re.search(
        r"([0-9]+(?:\.[0-9]+)?)\s*(mm|cm|m)\s*[×xX]\s*"
        r"([0-9]+(?:\.[0-9]+)?)\s*(mm|cm|m)\s*[×xX]\s*"
        r"([0-9]+(?:\.[0-9]+)?)\s*(mm|cm|m)",
        text, re.IGNORECASE
    )
    if m:
        w = _to_mm(float(m.group(1)), m.group(2))
        h = _to_mm(float(m.group(3)), m.group(4))
        d = _to_mm(float(m.group(5)), m.group(6))
        return (w, h, d)

    # Pattern 2: individual labelled fields (Width / Height / Depth)
    labels = {}
    for axis, pattern in [
        ("w", r"(?:width|w)[:\s]+([0-9]+(?:\.[0-9]+)?)\s*(mm|cm|m)"),
        ("h", r"(?:height|h)[:\s]+([0-9]+(?:\.[0-9]+)?)\s*(mm|cm|m)"),
        ("d", r"(?:depth|depth)[:\s]+([0-9]+(?:\.[0-9]+)?)\s*(mm|cm|m)"),
    ]:
        m2 = re.search(pattern, text, re.IGNORECASE)
        if m2:
            labels[axis] = _to_mm(float(m2.group(1)), m2.group(2))

    if len(labels) == 3:
        return (labels["w"], labels["h"], labels["d"])

    return None

# ── Ingestion Result ───────────────────────────────────────────────────────────

@dataclass
class IngestionResult:
    ingested:  int = 0
    skipped:   int = 0
    errors:    int = 0
    messages:  list[str] = field(default_factory=list)

    def log(self, msg: str, level: str = "info") -> None:
        self.messages.append(msg)
        getattr(logger, level)(msg)

# ─────────────────────────────────────────────────────────────────────────────
# Source 1: Local File System Scanner
# ─────────────────────────────────────────────────────────────────────────────

# Known dimension & category metadata for the 6 local assets already on disk.
_LOCAL_SEED: dict[str, dict] = {
    "sofa": {
        "name": "أريكة KIVIK", "category": "seating", "source": "IKEA",
        "w": 2280.0, "h": 830.0, "d": 950.0,
    },
    "armchair": {
        "name": "كرسي STRANDMON", "category": "seating", "source": "IKEA",
        "w": 820.0, "h": 1010.0, "d": 960.0,
    },
    "table": {
        "name": "طاولة قهوة LACK", "category": "tables", "source": "IKEA",
        "w": 900.0, "h": 450.0, "d": 550.0,
    },
    "tv_unit": {
        "name": "وحدة تلفاز BESTÅ", "category": "tables", "source": "IKEA",
        "w": 1800.0, "h": 600.0, "d": 400.0,
    },
    "rug": {
        "name": "سجادة STOCKHOLM", "category": "rugs", "source": "IKEA",
        "w": 1700.0, "h": 10.0, "d": 2400.0,
    },
    "plant": {
        "name": "نبتة ديكور FEJKA", "category": "decor", "source": "IKEA",
        "w": 300.0, "h": 900.0, "d": 300.0,
    },
}

class LocalFileScanner:
    """
    Scans frontend/public/assets/ for .glb files and injects them with
    dimension metadata from the seed dictionary above.
    """

    def run(
        self,
        store: LanceDBAssetStore,
        result: IngestionResult,
        dry_run: bool = False,
    ) -> None:
        glb_dir = _LOCAL_GLB_DIR
        if not glb_dir.exists():
            result.log(f"Local asset dir not found: {glb_dir}", "warning")
            return

        for glb_path in sorted(glb_dir.glob("*.glb")):
            stem = glb_path.stem  # e.g. "sofa", "table"
            seed = _LOCAL_SEED.get(stem)

            if seed is None:
                result.log(
                    f"SKIP {glb_path.name} — no seed metadata entry; "
                    "add it to _LOCAL_SEED to ingest.", "warning"
                )
                result.skipped += 1
                continue

            record = AssetRecord(
                asset_id      = stem,
                name          = seed["name"],
                category      = seed["category"],
                source        = seed["source"],
                model_url     = f"/assets/{glb_path.name}",
                thumbnail_url = "",
                dim_width_mm  = seed["w"],
                dim_height_mm = seed["h"],
                dim_depth_mm  = seed["d"],
            )

            if dry_run:
                result.log(f"[DRY-RUN] Would ingest: {record.asset_id}")
            else:
                try:
                    store.upsert(record)
                    result.log(f"Ingested local asset: {record.name} ({record.asset_id})")
                    result.ingested += 1
                except Exception as exc:
                    result.log(f"ERROR persisting {stem}: {exc}", "error")
                    result.errors += 1

# ─────────────────────────────────────────────────────────────────────────────
# Source 2: Khronos glTF-Sample-Assets (GitHub API)
# ─────────────────────────────────────────────────────────────────────────────

_GITHUB_API = "https://api.github.com/repos/KhronosGroup/glTF-Sample-Assets/contents/Models"
_KHRONOS_RAW = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models"

# Curated category + dimension overrides for specific Khronos model names
# (the repo has no furniture-grade dimension metadata, so we map by intent)
_KHRONOS_META: dict[str, dict] = {
    "SheenChair":           {"category": "seating", "w": 820,  "h": 1010, "d": 960,  "source": "Khronos"},
    "ChairDamaskPurple":    {"category": "seating", "w": 750,  "h": 900,  "d": 800,  "source": "Khronos"},
    "ABeautifulGame":       {"category": "decor",   "w": 600,  "h": 600,  "d": 600,  "source": "Khronos"},
    "AntiqueCamera":        {"category": "decor",   "w": 200,  "h": 300,  "d": 150,  "source": "Khronos"},
    "GlassVaseFlowers":     {"category": "decor",   "w": 150,  "h": 300,  "d": 150,  "source": "Khronos"},
    "MaterialsVariantsShoe":{"category": "decor",   "w": 310,  "h": 120,  "d": 100,  "source": "Khronos"},
}

class KhronosGitHubScraper:
    """
    Fetches the Khronos glTF-Sample-Assets model index from the GitHub
    Contents API and ingests models that have a known metadata mapping.

    Rate limit: GitHub allows 60 unauthenticated requests/hour; we stay well
    inside that with a configurable delay between items.
    """

    def __init__(self, delay: float = 0.4, max_models: int = 20):
        self.delay     = delay
        self.max_models = max_models

    def run(
        self,
        store: LanceDBAssetStore,
        result: IngestionResult,
        dry_run: bool = False,
    ) -> None:
        result.log("Fetching Khronos glTF-Sample-Assets index from GitHub API…")

        try:
            with httpx.Client(timeout=15, follow_redirects=True) as client:
                resp = client.get(_GITHUB_API, headers={"Accept": "application/vnd.github.v3+json"})
                resp.raise_for_status()
                entries = resp.json()
        except Exception as exc:
            result.log(f"ERROR fetching GitHub index: {exc}", "error")
            result.errors += 1
            return

        models_processed = 0
        for entry in entries:
            if models_processed >= self.max_models:
                break
            if entry.get("type") != "dir":
                continue

            model_name = entry["name"]
            meta = _KHRONOS_META.get(model_name)
            if meta is None:
                result.log(f"SKIP {model_name} — not in Khronos metadata map", "debug")
                result.skipped += 1
                continue

            # Build deterministic GLB URL:  Models/<Name>/glTF-Binary/<Name>.glb
            glb_url = f"{_KHRONOS_RAW}/{model_name}/glTF-Binary/{model_name}.glb"

            # Verify the GLB actually exists before inserting
            try:
                with httpx.Client(timeout=10, follow_redirects=True) as client:
                    head = client.head(glb_url)
                    if head.status_code not in (200, 302, 304):
                        result.log(
                            f"SKIP {model_name} — GLB HEAD returned {head.status_code}", "warning"
                        )
                        result.skipped += 1
                        time.sleep(self.delay)
                        continue
            except Exception as exc:
                result.log(f"SKIP {model_name} — GLB HEAD failed: {exc}", "warning")
                result.skipped += 1
                time.sleep(self.delay)
                continue

            record = AssetRecord(
                asset_id      = f"khronos_{model_name.lower()}",
                name          = model_name.replace("_", " "),
                category      = meta["category"],
                source        = meta["source"],
                model_url     = glb_url,
                thumbnail_url = "",
                dim_width_mm  = float(meta["w"]),
                dim_height_mm = float(meta["h"]),
                dim_depth_mm  = float(meta["d"]),
            )

            if dry_run:
                result.log(f"[DRY-RUN] Would ingest: {record.asset_id} ({glb_url})")
            else:
                try:
                    store.upsert(record)
                    result.log(f"Ingested Khronos: {model_name}")
                    result.ingested += 1
                except Exception as exc:
                    result.log(f"ERROR persisting {model_name}: {exc}", "error")
                    result.errors += 1

            models_processed += 1
            time.sleep(self.delay)

# ─────────────────────────────────────────────────────────────────────────────
# Source 3: Generic HTML Page Scraper (pluggable adapter)
# ─────────────────────────────────────────────────────────────────────────────

class GenericHTTPScraper:
    """
    Fetches a target HTML product page, extracts:
      • .glb URL  — from <model-viewer src="..."> or <a href="*.glb">
      • Thumbnail — from <img> with a product image class
      • Dimensions — from product spec tables via RegEx

    Configurable via `selectors` dict for different vendor layouts.
    """

    DEFAULT_SELECTORS = {
        "model_viewer":  "model-viewer",      # attribute: src
        "glb_link":      "a[href$='.glb']",   # fallback: href link
        "thumb_img":     "img.product-image, img[class*='product'], img[class*='hero']",
        "spec_block":    ".product-specs, .specs-table, [class*='dimension'], [class*='spec']",
        "name":          "h1, .product-name, [class*='product-title']",
    }

    def __init__(
        self,
        url: str,
        category: str = "seating",
        source_name: str = "Web",
        selectors: Optional[dict] = None,
        delay: float = 0.5,
    ):
        self.url         = url
        self.category    = category
        self.source_name = source_name
        self.selectors   = {**self.DEFAULT_SELECTORS, **(selectors or {})}
        self.delay       = delay

    def run(
        self,
        store: LanceDBAssetStore,
        result: IngestionResult,
        dry_run: bool = False,
    ) -> None:
        result.log(f"Scraping page: {self.url}")
        time.sleep(self.delay)

        try:
            with httpx.Client(
                timeout=20,
                follow_redirects=True,
                headers={"User-Agent": "Mozilla/5.0 (compatible; RwaqBot/1.0; asset-indexer)"},
            ) as client:
                resp = client.get(self.url)
                resp.raise_for_status()
                html = resp.text
        except Exception as exc:
            result.log(f"ERROR fetching {self.url}: {exc}", "error")
            result.errors += 1
            return

        soup = BeautifulSoup(html, "html.parser")

        # ── Extract product name ──────────────────────────────────────────────
        name_tag = soup.select_one(self.selectors["name"])
        product_name = name_tag.get_text(strip=True) if name_tag else "Unknown Product"

        # ── Extract .glb URL ─────────────────────────────────────────────────
        glb_url: Optional[str] = None

        mv = soup.select_one(self.selectors["model_viewer"])
        if mv:
            glb_url = mv.get("src") or mv.get("data-src")

        if not glb_url:
            link = soup.select_one(self.selectors["glb_link"])
            if link:
                glb_url = link.get("href")

        if not glb_url:
            # Last resort: scan all <source> and <a> for .glb pattern
            for tag in soup.find_all(["source", "a", "script"]):
                raw = str(tag)
                m = re.search(r'https?://[^\s"\']+\.glb', raw)
                if m:
                    glb_url = m.group(0)
                    break

        if not glb_url:
            result.log(
                f"SKIP {product_name} — no .glb URL found on page: {self.url}", "warning"
            )
            result.skipped += 1
            return

        # ── Extract thumbnail ─────────────────────────────────────────────────
        thumb_url = ""
        thumb_tag = soup.select_one(self.selectors["thumb_img"])
        if thumb_tag:
            thumb_url = thumb_tag.get("src") or thumb_tag.get("data-src") or ""

        # ── Extract dimensions ─────────────────────────────────────────────────
        dim_text = ""
        spec_block = soup.select_one(self.selectors["spec_block"])
        if spec_block:
            dim_text = spec_block.get_text(separator=" ")
        else:
            # Fallback: search full page body for dimension patterns
            dim_text = soup.get_text(separator=" ")

        dims = parse_dimensions(dim_text)
        if dims is None:
            result.log(
                f"SKIP {product_name} — could not parse dimensions from page", "warning"
            )
            result.skipped += 1
            return

        w_mm, h_mm, d_mm = dims
        asset_id = "web_" + re.sub(r"[^a-z0-9]", "_", product_name.lower())[:40]

        record = AssetRecord(
            asset_id      = asset_id,
            name          = product_name,
            category      = self.category,
            source        = self.source_name,
            model_url     = glb_url,
            thumbnail_url = thumb_url,
            dim_width_mm  = w_mm,
            dim_height_mm = h_mm,
            dim_depth_mm  = d_mm,
        )

        if dry_run:
            result.log(
                f"[DRY-RUN] Would ingest: {record.asset_id} | "
                f"dims={w_mm:.0f}×{h_mm:.0f}×{d_mm:.0f}mm | glb={glb_url[:60]}"
            )
        else:
            try:
                store.upsert(record)
                result.log(f"Ingested web asset: {product_name} ({asset_id})")
                result.ingested += 1
            except Exception as exc:
                result.log(f"ERROR persisting {asset_id}: {exc}", "error")
                result.errors += 1

# ── Orchestration pipeline ─────────────────────────────────────────────────────

class IngestionPipeline:
    """
    Top-level orchestrator. Selects the right scraper and runs it, writing
    results into LanceDB. Returns an IngestionResult summary.
    """

    def __init__(self, db_path: str = _LANCEDB_PATH):
        self.store = LanceDBAssetStore(db_path)

    def run(
        self,
        source: str = "local",
        *,
        url: Optional[str] = None,
        category: str = "seating",
        source_name: str = "Web",
        delay: float = 0.4,
        max_models: int = 20,
        dry_run: bool = False,
    ) -> IngestionResult:
        result = IngestionResult()

        if source == "local":
            LocalFileScanner().run(self.store, result, dry_run=dry_run)

        elif source == "khronos":
            KhronosGitHubScraper(delay=delay, max_models=max_models).run(
                self.store, result, dry_run=dry_run
            )

        elif source == "http":
            if not url:
                raise ValueError("source='http' requires a url parameter")
            GenericHTTPScraper(
                url=url, category=category, source_name=source_name, delay=delay
            ).run(self.store, result, dry_run=dry_run)

        elif source == "all":
            # Run local + khronos in sequence
            result.log("=== Running ALL sources ===")
            LocalFileScanner().run(self.store, result, dry_run=dry_run)
            KhronosGitHubScraper(delay=delay, max_models=max_models).run(
                self.store, result, dry_run=dry_run
            )

        else:
            raise ValueError(f"Unknown source '{source}'. Use: local | khronos | http | all")

        result.log(
            f"Pipeline complete — ingested={result.ingested} "
            f"skipped={result.skipped} errors={result.errors}"
        )
        return result

    def get_all(self) -> list[dict]:
        """Return all LanceDB records formatted for /api/v1/assets."""
        return self.store.all_records()

    def count(self) -> int:
        return self.store.count()

# ── CLI entry point ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Rwaq Asset Ingestion Pipeline")
    parser.add_argument("--source",    default="local",
                        choices=["local", "khronos", "http", "all"],
                        help="Ingestion source")
    parser.add_argument("--url",       default=None,
                        help="Target URL for source=http")
    parser.add_argument("--category",  default="seating",
                        help="Furniture category for http source")
    parser.add_argument("--delay",     type=float, default=0.4,
                        help="Seconds between HTTP requests (polite scraping)")
    parser.add_argument("--max",       type=int, default=20,
                        help="Max models to fetch from Khronos")
    parser.add_argument("--dry-run",   action="store_true",
                        help="Print what would be ingested without writing to DB")
    args = parser.parse_args()

    pipeline = IngestionPipeline()
    res = pipeline.run(
        source=args.source,
        url=args.url,
        category=args.category,
        delay=args.delay,
        max_models=args.max,
        dry_run=args.dry_run,
    )

    print(f"\n{'='*60}")
    print(f"  Ingested : {res.ingested}")
    print(f"  Skipped  : {res.skipped}")
    print(f"  Errors   : {res.errors}")
    print(f"  DB total : {pipeline.count()}")
    print(f"{'='*60}\n")
