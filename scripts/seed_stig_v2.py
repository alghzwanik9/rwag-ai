import sys
from pathlib import Path
# Ensure project root is on sys.path so imports work when running from /scripts
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from asset_scraper import AssetRecord, LanceDBAssetStore

STIG_ITEM_ID = "stig_bar_stool_test"
STIG_MODEL_URL = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb"

store = LanceDBAssetStore()
rec = AssetRecord(
    asset_id=STIG_ITEM_ID,
    name="STIG Bar Stool (Test)",
    category="seating",
    source="KhronosTest",
    model_url=STIG_MODEL_URL,
    model_3d_url=STIG_MODEL_URL,
    thumbnail_url="",
    image_url="",
    style="",
    dim_width_mm=500.0,
    dim_height_mm=740.0,
    dim_depth_mm=500.0,
    default_scale_x=1.0,
    default_scale_y=1.0,
    default_scale_z=1.0
)

store.upsert(rec)
print("Seeded STIG via LanceDBAssetStore.upsert()")
