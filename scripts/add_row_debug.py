import lancedb

DB='.lancedb'
TABLE='ikea_catalog'
row = {'item_id':'stig_test_001','name':'STIG Bar Stool','category':'Bar furniture','price':69.0,'dim_width':50.0,'dim_height':74.0,'dim_depth':50.0,'link':'','short_description':'test stig'}

try:
    db=lancedb.connect(DB)
    print('tables=', db.list_tables())
    t=db.open_table(TABLE)
    print('opened table, trying to add row')
    t.add([row])
    print('added row')
except Exception as e:
    import traceback
    print('exception adding row:')
    traceback.print_exc()
