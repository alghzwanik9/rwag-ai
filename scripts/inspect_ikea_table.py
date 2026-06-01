import lancedb

DB_PATH = ".lancedb"
TABLE_NAME = "ikea_catalog"

def main():
    db = lancedb.connect(DB_PATH)
    if TABLE_NAME not in db.list_tables():
        print(f"Table '{TABLE_NAME}' does not exist.")
        return
    table = db.open_table(TABLE_NAME)
    try:
        # print schema or sample
        print("Schema fields:")
        try:
            schema = table.schema
            print(schema)
        except Exception:
            # fallback: to_pandas
            import pandas as pd
            df = table.to_pandas()
            print(list(df.columns))
        print('\nSample rows (up to 5):')
        df = table.to_pandas().head(5)
        print(df.to_dict(orient='records'))
    except Exception as e:
        print('Error inspecting table:')
        print(e)

if __name__ == '__main__':
    main()
