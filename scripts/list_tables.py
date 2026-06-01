import lancedb

try:
    db = lancedb.connect('.lancedb')
    print('Tables:', db.list_tables())
except Exception as e:
    print('Error connecting to lancedb:', e)
