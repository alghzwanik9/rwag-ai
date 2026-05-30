import lancedb
from pathlib import Path
from sentence_transformers import SentenceTransformer

DB_PATH = Path(".lancedb")
TABLE_NAME = "ikea_catalog"

class RagRetriever:
    def __init__(self):
        # We assume the table is already populated by rag_ingestor.py
        self.db = lancedb.connect(str(DB_PATH))
        self.table = self.db.open_table(TABLE_NAME)
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    def search(self, query: str, limit: int = 3):
        """
        Searches the LanceDB index for the closest IKEA items matching the query.
        """
        try:
            # Embed the query
            query_vector = self.model.encode(query).tolist()
            
            # Perform vector search
            results = self.table.search(query_vector).limit(limit).to_list()
            return results
        except Exception as e:
            print(f"RAG search error: {e}")
            return []

if __name__ == "__main__":
    # Test
    retriever = RagRetriever()
    res = retriever.search("red sofa", limit=2)
    for r in res:
        print(f"[{r['category']}] {r['name']} - {r['price']} SAR")
        print(f"Dimensions: {r['dim_width']}x{r['dim_height']}x{r['dim_depth']} mm")
        print(f"Link: {r['link']}\n")
