"""
Seed a STIG test asset into the `ikea_catalog` LanceDB table.
Run with: python scripts/seed_stig.py

This script is safe to run multiple times; it upserts by `item_id`.
"""

import uuid
import lancedb
import traceback

DB_PATH = ".lancedb"
TABLE_NAME = "ikea_catalog"

STIG_ITEM_ID = "stig_bar_stool_test"
STIG_MODEL_URL = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb"

row = {
    "item_id": STIG_ITEM_ID,
    "name": "STIG Bar Stool (Test)",
    "category": "seating",
    "price": 69.0,
    "dim_width_mm": 500.0,
    "dim_height_mm": 740.0,
    "dim_depth_mm": 500.0,
    "model_url": STIG_MODEL_URL,
    "model_3d_url": STIG_MODEL_URL,
    "thumbnail_url": "",
    "image_url": "",
    "default_scale_x": 1.0,
    "default_scale_y": 1.0,
    "default_scale_z": 1.0,
    "link": "",
    "short_description": "Test STIG stool for Rwaq AI"
}


def main():
    try:
        db = lancedb.connect(DB_PATH)
        if TABLE_NAME in db.table_names():
            table = db.open_table(TABLE_NAME)
            # Remove any existing row with same item_id then add new
            try:
                table.delete(f"item_id = '{STIG_ITEM_ID}'")
            except Exception:
                pass
            table.add([row])
            print(f"Upserted test STIG into existing table '{TABLE_NAME}'.")
        else:
            # create table with single row (LanceDB will infer schema)
            db.create_table(TABLE_NAME, data=[row])
            print(f"Created table '{TABLE_NAME}' and inserted test STIG.")
        print("Done. You can now GET /api/v1/ikea-catalog to verify the record.")
    except Exception as e:
        print("Failed to seed STIG:")
        traceback.print_exc()


if __name__ == '__main__':
    main()
