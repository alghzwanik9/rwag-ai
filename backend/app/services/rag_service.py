import os
from typing import List, Dict, Any
import lancedb
from google import genai
from backend.app.config import LANCEDB_DIR

TABLE_NAME = "ikea_catalog"
FALLBACK_GLB_URL = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb"

class RagRetriever:
    def __init__(self):
        try:
            self.db = lancedb.connect(str(LANCEDB_DIR))
            if TABLE_NAME in self.db.table_names():
                self.table = self.db.open_table(TABLE_NAME)
            else:
                self.table = None
        except Exception as e:
            print(f"LanceDB connection warning: {e}")
            self.table = None

        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            self.client = genai.Client(api_key=api_key)
        else:
            self.client = None

    def search(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Searches the LanceDB index for the closest IKEA items matching the query."""
        if not self.table or not self.client:
            return []
        try:
            response = self.client.models.embed_content(
                model='text-embedding-004',
                contents=query
            )
            query_vector = response.embeddings[0].values
            results = self.table.search(query_vector).limit(limit).to_list()
            return results
        except Exception as e:
            print(f"RAG search error: {e}")
            return []

_global_retriever = None

def get_retriever() -> RagRetriever:
    global _global_retriever
    if _global_retriever is None:
        _global_retriever = RagRetriever()
    return _global_retriever

def resolve_ikea_model_url(name: str, category: str) -> str:
    text = f"{name or ''} {category or ''}".strip().lower()
    if not text:
        return FALLBACK_GLB_URL

    if "sofa" in text or "كنب" in text or "أريكة" in text:
        return "/assets/sofa.glb"
    elif "chair" in text or "كرسي" in text or "armchair" in text or "seating" in text:
        return "/assets/armchair.glb"
    elif "tv" in text or "تلفاز" in text or "تلفزيون" in text or "media" in text:
        return "/assets/tv_unit.glb"
    elif "table" in text or "طاول" in text or "desk" in text or "مكتب" in text:
        return "/assets/table.glb"
    elif "rug" in text or "سجاد" in text:
        return "/assets/rug.glb"
    elif "plant" in text or "نبات" in text or "decor" in text or "ديكور" in text:
        return "/assets/plant.glb"

    return FALLBACK_GLB_URL

def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default

def get_ikea_catalog_data(limit: int = 200) -> Dict[str, Any]:
    try:
        db = lancedb.connect(str(LANCEDB_DIR))
        if "ikea_catalog" not in db.table_names():
            return {"items": [], "assets": [], "total": 0}
            
        table = db.open_table("ikea_catalog")
        records = table.search().limit(limit).to_arrow().to_pylist()
        
        results = []
        for r in records:
            name = str(r.get("name", "Unknown"))
            category = str(r.get("category", ""))
            model_url = str(r.get("model_url", "") or r.get("model_3d_url", "") or resolve_ikea_model_url(name, category))
            model_3d_url = str(r.get("model_3d_url", "") or r.get("model_url", "") or model_url or FALLBACK_GLB_URL)
            results.append({
                "id": str(r.get("item_id", "")),
                "name": name,
                "category": category,
                "price": safe_float(r.get("price", 0.0)),
                "dimensions": {
                    "width": safe_float(r.get("dim_width_mm", r.get("dim_width", 0.0))),
                    "height": safe_float(r.get("dim_height_mm", r.get("dim_height", 0.0))),
                    "depth": safe_float(r.get("dim_depth_mm", r.get("dim_depth", 0.0)))
                },
                "link": str(r.get("link", "")),
                "short_description": str(r.get("short_description", "")),
                "model_url": model_url,
                "model_3d_url": model_3d_url,
                "thumbnail_url": str(r.get("thumbnail_url", "") or r.get("image_url", "")),
                "default_scale_x": safe_float(r.get("default_scale_x", 1.0), 1.0),
                "default_scale_y": safe_float(r.get("default_scale_y", 1.0), 1.0),
                "default_scale_z": safe_float(r.get("default_scale_z", 1.0), 1.0),
            })
        return {"items": results, "assets": results, "total": len(results)}
    except Exception as e:
        print(f"Error fetching catalog data: {e}")
        return {"items": [], "assets": [], "total": 0}
