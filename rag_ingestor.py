import os
import csv
import time
import math
import logging
from pathlib import Path

import pyarrow as pa
import lancedb
from google import genai

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("rag_ingestor")

CSV_PATH = Path("data/IKEA_SA_Furniture_Web_Scrapings_sss.csv")
DB_PATH = Path(".lancedb")
TABLE_NAME = "ikea_catalog"

# Schema with vector support (Gemini text-embedding-004 outputs 768 dims)
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
    pa.field("vector", pa.list_(pa.float32(), 768))
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

def main():
    if not CSV_PATH.exists():
        logger.error(f"CSV not found at {CSV_PATH}")
        return

    logger.info("Initializing Gemini API client for embeddings...")
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    
    records = []
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            records.append({
                "item_id": safe_str(row.get("item_id", "")),
                "name": safe_str(row.get("name", "")),
                "category": safe_str(row.get("category", "")),
                "price": safe_float(row.get("price", "0")),
                "dim_width": safe_float(row.get("width", "0")) * 10,  # cm to mm
                "dim_height": safe_float(row.get("height", "0")) * 10, # cm to mm
                "dim_depth": safe_float(row.get("depth", "0")) * 10,  # cm to mm
                "link": safe_str(row.get("link", "")),
                "short_description": safe_str(row.get("short_description", ""))
            })

    logger.info(f"Loaded {len(records)} records from CSV.")
    
    batch_size = 100 # Gemini allows up to 100 texts per batch
    db = lancedb.connect(str(DB_PATH))
    
    if TABLE_NAME in db.table_names():
        db.drop_table(TABLE_NAME)
        
    table = db.create_table(TABLE_NAME, schema=SCHEMA)
    
    total = len(records)
    for i in range(0, total, batch_size):
        batch = records[i:i+batch_size]
        
        texts = []
        for r in batch:
            text = f"Product: {r['name']}\nCategory: {r['category']}\nDescription: {r['short_description']}"
            texts.append(text)
            
        try:
            # Batch embedding using Gemini API
            from google.genai import types
            
            # Use smaller chunks if needed, but 100 is usually fine for text-embedding-004
            response = client.models.embed_content(
                model='text-embedding-004',
                contents=texts
            )
            
            # Map vectors back
            for r, emb in zip(batch, response.embeddings):
                r["vector"] = emb.values
                
            table.add(batch)
            logger.info(f"Ingested {i + len(batch)} / {total}")
            
        except Exception as e:
            logger.error(f"Error embedding batch {i}: {e}")
            
    logger.info(f"Successfully ingested {table.count_rows()} records into LanceDB '{TABLE_NAME}'.")

if __name__ == "__main__":
    main()
