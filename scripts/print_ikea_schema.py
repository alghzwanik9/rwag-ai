import lancedb
DB='.lancedb'
try:
    db=lancedb.connect(DB)
    print('tables=', db.list_tables())
    if 'ikea_catalog' in db.list_tables():
        t=db.open_table('ikea_catalog')
        try:
            print('schema:', t.schema)
        except Exception:
            import pandas as pd
            df=t.to_pandas()
            print('columns:', list(df.columns))
            print('sample:', df.head(3).to_dict(orient='records'))
    else:
        print('ikea_catalog not present')
except Exception as e:
    print('error:', e)
