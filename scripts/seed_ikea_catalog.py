import lancedb
from pathlib import Path

DB='.lancedb'
TABLE='ikea_catalog'
STIG_ID='stig_bar_stool_test'
STIG_MODEL_URL='https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb'

row = {
    'item_id': STIG_ID,
    'name': 'STIG Bar Stool (Test)',
    'category': 'Bar furniture',
    'price': 69.0,
    'dim_width': 50.0,   # cm in this table (original had 510 meaning 51cm?) keep cm
    'dim_height': 74.0,
    'dim_depth': 50.0,
    'link': STIG_MODEL_URL,
    'model_url': STIG_MODEL_URL,
    'short_description': 'Test STIG stool (cm)',
    # We store model_url in a freeform 'link' or short_description; add vector if needed
}

try:
    db=lancedb.connect(DB)
    if TABLE in db.list_tables():
        t=db.open_table(TABLE)
        try:
            t.delete(f"item_id = '{STIG_ID}'")
        except Exception:
            pass
        t.add([row])
        print('Upserted STIG into ikea_catalog')
    else:
        db.create_table(TABLE, data=[row])
        print('Created ikea_catalog and inserted STIG')
    print('Done')
except Exception as e:
    print('Error seeding ikea_catalog:', e)
