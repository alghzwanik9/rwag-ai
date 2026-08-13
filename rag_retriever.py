from backend.app.services.rag_service import RagRetriever, get_retriever, TABLE_NAME

if __name__ == "__main__":
    # Test
    retriever = RagRetriever()
    res = retriever.search("red sofa", limit=2)
    for r in res:
        print(f"[{r.get('category', '')}] {r.get('name', '')} - {r.get('price', 0)} SAR")
        print(f"Link: {r.get('link', '')}\n")

