import os
from typing import List, Dict, Any
import lancedb
from google import genai
from backend.app.config import LANCEDB_DIR

TABLE_NAME = "ikea_catalog"
FALLBACK_GLB_URL = "/assets/armchair_wood.glb"

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

    if "sofa" in text or "couch" in text or "كنب" in text or "أريكة" in text:
        return "/assets/sofa_khronos.glb"
    elif ("dining" in text and ("chair" in text or "كرسي" in text)) or "stool" in text or "bar" in text:
        return "/assets/dining_chair.glb"
    elif "deck" in text or "lounge" in text or "sun" in text:
        return "/assets/deck_chair.glb"
    elif "chair" in text or "كرسي" in text or "armchair" in text or "seating" in text or "مقعد" in text:
        return "/assets/armchair_wood.glb"
    elif "shelf" in text or "bookcase" in text or "bookshelf" in text or "رف" in text or "مكتبة" in text:
        return "/assets/display_shelf.glb"
    elif (
        "tv" in text
        or "تلفاز" in text
        or "تلفزيون" in text
        or "media" in text
        or "cabinet" in text
        or "drawer" in text
        or "wardrobe" in text
        or "storage" in text
        or "chest" in text
        or "sideboard" in text
        or "خزانة" in text
    ):
        return "/assets/drawer_cabinet.glb"
    elif "outdoor" in text or "garden" in text or "patio" in text or "حديقة" in text:
        return "/assets/outdoor_set.glb"
    elif "coffee" in text or "table" in text or "طاول" in text or "desk" in text or "مكتب" in text:
        return "/assets/coffee_table_round.glb"
    elif (
        "vase" in text
        or "flower" in text
        or "plant" in text
        or "نبات" in text
        or "decor" in text
        or "ديكور" in text
        or "مزهرية" in text
        or "rug" in text
        or "سجاد" in text
    ):
        return "/assets/vase_flowers.glb"

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

def find_budget_alternatives(current_item_id: str, budget_left: float) -> List[Dict[str, Any]]:
    """Finds cheaper or budget-fitting furniture alternatives from LanceDB."""
    try:
        db = lancedb.connect(str(LANCEDB_DIR))
        if "ikea_catalog" not in db.table_names():
            return []

        table = db.open_table("ikea_catalog")
        all_records = table.search().limit(300).to_arrow().to_pylist()

        # Find target item if it exists
        target_item = None
        for r in all_records:
            if str(r.get("item_id", "")) == str(current_item_id) or str(r.get("name", "")).lower() == str(current_item_id).lower():
                target_item = r
                break

        target_category = ""
        target_price = float("inf")
        if target_item:
            target_category = str(target_item.get("category", "")).lower()
            target_price = safe_float(target_item.get("price", 0.0))
        else:
            # Infer category from current_item_id string
            id_lower = str(current_item_id).lower()
            if "sofa" in id_lower or "كنب" in id_lower:
                target_category = "sofas"
            elif "chair" in id_lower or "كرسي" in id_lower:
                target_category = "chairs"
            elif "table" in id_lower or "طاولة" in id_lower:
                target_category = "tables"
            elif "tv" in id_lower or "تلفاز" in id_lower:
                target_category = "tv"
            elif "rug" in id_lower or "سجاد" in id_lower:
                target_category = "rugs"

        alternatives = []
        for r in all_records:
            item_price = safe_float(r.get("price", 0.0))
            item_cat = str(r.get("category", "")).lower()
            item_name = str(r.get("name", "Unknown"))
            item_id = str(r.get("item_id", ""))

            # Don't recommend the same item
            if item_id == current_item_id:
                continue

            # Check if it fits the budget or is cheaper than the target item
            is_cheaper = item_price < target_price or (budget_left > 0 and item_price <= budget_left)
            cat_match = (not target_category) or (target_category in item_cat) or (item_cat in target_category)

            if is_cheaper and cat_match and item_price > 0:
                savings = max(0.0, target_price - item_price) if target_price < float("inf") else 0.0
                if savings > 0:
                    justification = f"بديل ممتاز من {item_name} يوفر حوالي {savings:.0f} ر.س مع الحفاظ على التناسق والوظيفة."
                else:
                    justification = f"خيار أنيق من {item_name} بسعر {item_price:.0f} ر.س يتناسب بدقة مع ميزانيتك المتبقية."

                alternatives.append({
                    "brand": "IKEA",
                    "name": item_name,
                    "price": item_price,
                    "currency": "SAR",
                    "store_url": str(r.get("link", "")),
                    "sku": item_id,
                    "justification": justification
                })

        # Sort by price ascending and return top 4
        alternatives.sort(key=lambda x: x["price"])
        return alternatives[:4]
    except Exception as e:
        print(f"Error in find_budget_alternatives: {e}")
        return []

def get_all_standards_catalog() -> List[Dict[str, Any]]:
    """Returns all structured architectural standards from LanceDB or local json files."""
    try:
        standards_dir = LANCEDB_DIR.parent / "data" / "architectural_standards"
        if standards_dir.exists():
            import json
            results = []
            for file_path in standards_dir.glob("*.json"):
                with open(file_path, "r", encoding="utf-8") as f:
                    results.append(json.load(f))
            return results
    except Exception as e:
        print(f"Error loading standards catalog: {e}")

    try:
        db = lancedb.connect(str(LANCEDB_DIR))
        if "architectural_standards" in db.table_names():
            import json
            tbl = db.open_table("architectural_standards")
            rows = tbl.search().limit(20).to_arrow().to_pylist()
            return [json.loads(r["rules_json"]) for r in rows if "rules_json" in r]
    except Exception as e:
        print(f"Error querying architectural_standards table: {e}")

    return []

def get_relevant_standards_context(prompt: str) -> str:
    """Finds matching architectural standards and returns a formatted context string for agents."""
    p_lower = prompt.lower()
    standards = get_all_standards_catalog()
    matched = []

    for std in standards:
        rtype = str(std.get("room_type", "")).lower()
        cat = str(std.get("category", "")).lower()
        name_ar = str(std.get("name_ar", ""))

        if (rtype and (rtype in p_lower or any(w in p_lower for w in ["معيشة", "جلوس", "صالة", "living"] if rtype == "living_room"))) or \
           (rtype == "bedroom" and any(w in p_lower for w in ["نوم", "master", "bedroom", "سرير"])) or \
           (rtype == "kitchen" and any(w in p_lower for w in ["مطبخ", "kitchen", "طهي"])) or \
           (rtype == "home_office" and any(w in p_lower for w in ["مكتب", "office", "دراسة", "عمل"])) or \
           (rtype == "dining_room" and any(w in p_lower for w in ["طعام", "سفرة", "dining"])) or \
           ("lighting" in cat or "material" in cat):
            matched.append(std)

    if not matched:
        matched = standards[:3]

    import json
    context_lines = ["\n### RELEVANT ARCHITECTURAL STANDARDS & ERGONOMIC RULES:"]
    for m in matched:
        context_lines.append(f"- Standard for {m.get('name_ar', m.get('room_type', 'Room'))}: {json.dumps(m, ensure_ascii=False)}")

    return "\n".join(context_lines)


