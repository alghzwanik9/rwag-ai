import os
import json
import logging
from pathlib import Path
from dotenv import load_dotenv

import pyarrow as pa
import lancedb
from google import genai

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("standards_ingestor")

STANDARDS_DIR = Path("data/architectural_standards")
DB_PATH = Path(".lancedb")
TABLE_NAME = "architectural_standards"

SCHEMA = pa.schema([
    pa.field("id", pa.string()),
    pa.field("category", pa.string()),
    pa.field("title_ar", pa.string()),
    pa.field("summary", pa.string()),
    pa.field("rules_json", pa.string()),
    pa.field("vector", pa.list_(pa.float32(), 768))
])

def main():
    if not STANDARDS_DIR.exists():
        logger.error(f"Directory not found: {STANDARDS_DIR}")
        return

    logger.info("Initializing Gemini API client for embeddings...")
    api_key = os.environ.get("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key) if api_key else None

    records = []
    texts_to_embed = []

    for file_path in STANDARDS_DIR.glob("*.json"):
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        category = data.get("room_type") or data.get("category") or file_path.stem
        title_ar = data.get("name_ar", category)
        desc = data.get("description", "")
        rules_str = json.dumps(data, ensure_ascii=False)

        summary_text = (
            f"Architectural Standard: {category} ({title_ar})\n"
            f"Description: {desc}\n"
            f"Spatial Rules & Anthropometrics: {rules_str[:400]}"
        )

        record_id = f"std_{file_path.stem}"
        records.append({
            "id": record_id,
            "category": category,
            "title_ar": title_ar,
            "summary": summary_text,
            "rules_json": rules_str
        })
        texts_to_embed.append(summary_text)

    logger.info(f"Loaded {len(records)} architectural standard documents.")

    # Embed documents
    if client:
        try:
            response = client.models.embed_content(
                model='text-embedding-004',
                contents=texts_to_embed
            )
            for r, emb in zip(records, response.embeddings):
                r["vector"] = emb.values
        except Exception as e:
            logger.warning(f"Gemini embedding call failed ({e}), using fallback zero-vectors.")
            for r in records:
                r["vector"] = [0.0] * 768
    else:
        for r in records:
            r["vector"] = [0.0] * 768

    db = lancedb.connect(str(DB_PATH))
    if TABLE_NAME in db.table_names():
        db.drop_table(TABLE_NAME)

    table = db.create_table(TABLE_NAME, schema=SCHEMA)
    table.add(records)
    logger.info(f"Successfully created LanceDB table '{TABLE_NAME}' with {table.count_rows()} standard entries.")

if __name__ == "__main__":
    main()
