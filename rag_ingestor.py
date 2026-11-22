import csv
import math
import logging
from pathlib import Path

import pyarrow as pa
import lancedb

from backend.app.services.rag_service import (
    EMBEDDING_DIM,
    TABLE_NAME,
    embed_text_384,
    extract_slug_from_link,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("rag_ingestor")

CSV_PATH = Path("data/IKEA_SA_Furniture_Web_Scrapings_sss.csv")
DB_PATH = Path(".lancedb")

# Schema with vector support (deterministic bilingual 384-dim unit vectors)
SCHEMA = pa.schema([
    pa.field("item_id", pa.string()),
    pa.field("name", pa.string()),
    pa.field("category", pa.string()),
    pa.field("price", pa.float32()),
    pa.field("dim_width", pa.float32()),
    pa.field("dim_height", pa.float32()),
    pa.field("dim_depth", pa.float32()),
    pa.field("link", pa.string()),
    pa.field("short_description", pa.string()),
    pa.field("vector", pa.list_(pa.float32(), EMBEDDING_DIM))
])


def safe_float(val, default=0.0):
    try:
        if not val or str(val).strip() == "":
            return default
        f = float(val)
        return f if not math.isnan(f) else default
    except (ValueError, TypeError):
        return default


def safe_str(val):
    if not val or (isinstance(val, float) and math.isnan(val)):
        return ""
    return str(val).strip()


def _get_table_names(db) -> list[str]:
    """Return LanceDB table names using list_tables() when available to avoid deprecation warnings."""
    if hasattr(db, "list_tables"):
        res = db.list_tables()
        if hasattr(res, "tables"):
            return list(res.tables)
        return list(res)
    return list(db.table_names())


def main():
    if not CSV_PATH.exists():
        logger.error(f"CSV not found at {CSV_PATH}")
        return

    records = []
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = safe_str(row.get("name", ""))
            category = safe_str(row.get("category", ""))
            link = safe_str(row.get("link", ""))
            short_description = safe_str(row.get("short_description", ""))
            slug = extract_slug_from_link(link)
            embed_input = f"{name} {category} {short_description} {slug}"
            records.append({
                "item_id": safe_str(row.get("item_id", "")),
                "name": name,
                "category": category,
                "price": safe_float(row.get("price", "0")),
                "dim_width": safe_float(row.get("width", "0")) * 10,  # cm to mm
                "dim_height": safe_float(row.get("height", "0")) * 10,  # cm to mm
                "dim_depth": safe_float(row.get("depth", "0")) * 10,  # cm to mm
                "link": link,
                "short_description": short_description,
                "vector": embed_text_384(embed_input, dim=EMBEDDING_DIM),
            })

    logger.info(f"Loaded and embedded {len(records)} records from CSV (dim={EMBEDDING_DIM}).")

    db = lancedb.connect(str(DB_PATH))
    if TABLE_NAME in _get_table_names(db):
        db.drop_table(TABLE_NAME)

    table = db.create_table(TABLE_NAME, schema=SCHEMA)
    table.add(records)
    logger.info(f"Successfully ingested {table.count_rows()} records into LanceDB '{TABLE_NAME}' (dim={EMBEDDING_DIM}).")


if __name__ == "__main__":
    main()
