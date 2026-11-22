from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
import hashlib
import logging
import re
from typing import List, Dict, Any

import lancedb
import numpy as np

from backend.app.config import LANCEDB_DIR

logger = logging.getLogger(__name__)

TABLE_NAME = "ikea_catalog"
EMBEDDING_DIM = 384
SEARCH_TIMEOUT_S = 10.0
FALLBACK_GLB_URL = "/assets/armchair_wood.glb"

_AR_TO_EN_SYNONYMS: Dict[str, List[str]] = {
    "أريكة": ["sofa", "sofas"],
    "اريكة": ["sofa", "sofas"],
    "كنبة": ["sofa", "sofas"],
    "كنب": ["sofa", "sofas"],
    "صوفا": ["sofa", "sofas"],
    "رمادي": ["grey", "gray"],
    "رمادية": ["grey", "gray"],
    "رصاصي": ["grey", "gray"],
    "أبيض": ["white"],
    "ابيض": ["white"],
    "بيضاء": ["white"],
    "أسود": ["black"],
    "اسود": ["black"],
    "سوداء": ["black"],
    "أزرق": ["blue"],
    "ازرق": ["blue"],
    "زرقاء": ["blue"],
    "أخضر": ["green"],
    "اخضر": ["green"],
    "خضراء": ["green"],
    "أحمر": ["red"],
    "احمر": ["red"],
    "حمراء": ["red"],
    "بيج": ["beige"],
    "بني": ["brown"],
    "بنية": ["brown"],
    "خشب": ["wood", "oak", "birch", "pine"],
    "خشبي": ["wood", "oak", "birch"],
    "خشبية": ["wood", "oak", "birch"],
    "كرسي": ["chair", "armchair"],
    "كراسي": ["chair", "chairs"],
    "مقعد": ["chair", "seat"],
    "بذراعين": ["armchair"],
    "طعام": ["dining"],
    "سفرة": ["dining"],
    "طاولة": ["table"],
    "طاولات": ["table", "tables"],
    "قهوة": ["coffee"],
    "جانبية": ["side"],
    "سرير": ["bed", "beds"],
    "نوم": ["bed", "bedroom"],
    "مكتب": ["desk", "office"],
    "عمل": ["desk", "office"],
    "مكتبة": ["bookcase", "bookshelf", "shelf"],
    "رف": ["shelf", "shelving"],
    "رفوف": ["shelf", "shelving"],
    "كتب": ["bookcase"],
    "خزانة": ["cabinet", "wardrobe", "storage"],
    "دولاب": ["wardrobe", "cabinet"],
    "أدراج": ["drawer", "chest"],
    "ادراج": ["drawer", "chest"],
    "تلفاز": ["tv", "bench"],
    "تلفزيون": ["tv", "bench"],
    "سجادة": ["rug"],
    "سجاد": ["rug"],
    "نبات": ["plant"],
    "مزهرية": ["vase"],
    "زهر": ["flower", "vase"],
    "حديقة": ["outdoor", "garden"],
    "خارجي": ["outdoor"],
    "خارجية": ["outdoor"],
    "مصباح": ["lamp"],
    "إضاءة": ["lamp"],
    "اضاءة": ["lamp"],
    "جلد": ["leather"],
    "قماش": ["fabric"],
    "زاوية": ["corner"],
    "دائري": ["round"],
    "دائرية": ["round"],
    "مستديرة": ["round"],
    "بار": ["bar", "stool"],
    "مرتفع": ["high", "bar"],
}

_FURNITURE_NOUNS = {
    "sofa", "sofas", "couch", "chair", "chairs", "armchair", "armchairs", "stool",
    "table", "tables", "coffee", "dining", "desk", "desks", "bed", "beds",
    "bookcase", "bookcases", "bookshelf", "shelf", "shelving", "cabinet", "cabinets",
    "wardrobe", "wardrobes", "drawer", "drawers", "chest", "tv", "bench", "rug",
    "outdoor", "lamp", "vase", "plant",
}


def extract_slug_from_link(link: str) -> str:
    """Extract human-readable product keywords (including color/material) from an IKEA product URL."""
    if not link:
        return ""
    match = re.search(r"/p/([^/]+)/?", link)
    if not match:
        return ""
    slug = re.sub(r"-[0-9a-z]*\d+[0-9a-z]*$", "", match.group(1).lower())
    return slug.replace("-", " ")


def embed_text_384(text: str, dim: int = EMBEDDING_DIM) -> List[float]:
    """Deterministic, offline-safe bilingual (AR/EN) 384-dim unit vector embedder."""
    tokens = re.findall(r"[a-z0-9\u0600-\u06FF]+", (text or "").lower())
    en_tokens: List[str] = []
    for tok in tokens:
        if tok.isascii():
            en_tokens.append(tok)
            if tok == "gray":
                en_tokens.append("grey")
            elif tok == "grey":
                en_tokens.append("gray")
        else:
            mapped = _AR_TO_EN_SYNONYMS.get(tok)
            if not mapped and tok.startswith("ال") and len(tok) > 3:
                mapped = _AR_TO_EN_SYNONYMS.get(tok[2:])
            if mapped:
                en_tokens.extend(mapped)
            else:
                en_tokens.append(tok)

    vec = np.zeros(dim, dtype=np.float32)

    def _add(feat: str, weight: float) -> None:
        digest = hashlib.blake2b(feat.encode("utf-8"), digest_size=8).digest()
        val = int.from_bytes(digest, "little")
        idx = val % dim
        sign = 1.0 if ((val >> 32) & 1) == 0 else -1.0
        vec[idx] += sign * weight

    seen = set()
    for tok in en_tokens:
        if len(tok) < 2:
            continue
        base_w = 3.5 if tok in _FURNITURE_NOUNS else 2.0
        weight = base_w if tok not in seen else base_w * 0.35
        seen.add(tok)
        _add(f"w:{tok}", weight)
        if tok.isascii() and len(tok) >= 4:
            for i in range(len(tok) - 2):
                _add(f"c3:{tok[i:i + 3]}", 0.15)

    norm = float(np.linalg.norm(vec))
    if norm > 0.0:
        vec /= norm
    return vec.tolist()


def _get_table_names(db: Any) -> List[str]:
    """Return LanceDB table names using list_tables() when available to avoid deprecation warnings."""
    if hasattr(db, "list_tables"):
        res = db.list_tables()
        if hasattr(res, "tables"):
            return list(res.tables)
        return list(res)
    return list(db.table_names())


class RagRetriever:
    def __init__(self, timeout_s: float = SEARCH_TIMEOUT_S):
        self.vector_dim = EMBEDDING_DIM
        self.timeout_s = timeout_s
        try:
            self.db = lancedb.connect(str(LANCEDB_DIR))
            if TABLE_NAME in _get_table_names(self.db):
                self.table = self.db.open_table(TABLE_NAME)
                try:
                    vec_field = self.table.schema.field("vector")
                    if hasattr(vec_field.type, "list_size") and vec_field.type.list_size:
                        self.vector_dim = int(vec_field.type.list_size)
                except Exception as schema_err:
                    logger.warning("Could not inspect vector dimension on '%s': %s", TABLE_NAME, schema_err)
            else:
                logger.warning("LanceDB table '%s' not found in %s", TABLE_NAME, LANCEDB_DIR)
                self.table = None
        except Exception as e:
            logger.error("LanceDB connection failed for %s: %s", LANCEDB_DIR, e, exc_info=True)
            self.table = None

    def embed_query(self, query: str) -> List[float]:
        """Embed a search query into the exact vector dimension expected by the LanceDB table."""
        return embed_text_384(query, dim=self.vector_dim)

    def search(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Searches the LanceDB index for the closest IKEA items matching the query."""
        if not self.table:
            logger.warning("RAG search skipped: LanceDB table '%s' is unavailable.", TABLE_NAME)
            return []
        if not query or not str(query).strip():
            logger.warning("RAG search skipped: empty query.")
            return []
        try:
            query_vector = self.embed_query(query)
            if len(query_vector) != self.vector_dim:
                logger.error(
                    "RAG vector dimension mismatch: query_vector=%d != table_dim=%d",
                    len(query_vector),
                    self.vector_dim,
                )
                return []

            def _run_query() -> List[Dict[str, Any]]:
                return self.table.search(query_vector).limit(limit).to_list()

            with ThreadPoolExecutor(max_workers=1) as pool:
                future = pool.submit(_run_query)
                results = future.result(timeout=self.timeout_s)

            for item in results:
                if not item.get("model_url"):
                    item["model_url"] = resolve_ikea_model_url(
                        str(item.get("name", "")),
                        str(item.get("category", "")),
                    )
            return results
        except FuturesTimeoutError:
            logger.error("RAG search timed out after %.1fs for query=%r", self.timeout_s, query)
            return []
        except Exception as e:
            logger.error("RAG search failed for query=%r: %s", query, e, exc_info=True)
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

    if "bed" in text or "mattress" in text or "سرير" in text or "نوم" in text:
        return "/assets/bed_double.glb"
    elif "sofa" in text or "couch" in text or "كنب" in text or "أريكة" in text:
        return "/assets/sofa_khronos.glb"
    elif "rug" in text or "carpet" in text or "mat" in text or "سجاد" in text:
        return "/assets/rug_woven.glb"
    elif "tv" in text or "تلفاز" in text or "تلفزيون" in text or "media" in text or "bench" in text:
        return "/assets/tv_unit_low.glb"
    elif "desk" in text or "مكتب" in text or "workstation" in text:
        return "/assets/office_desk.glb"
    elif "lamp" in text or "light" in text or "مصباح" in text or "إضاءة" in text or "اضاءة" in text:
        return "/assets/floor_lamp.glb"
    elif ("dining" in text and ("chair" in text or "كرسي" in text)) or "stool" in text or "bar" in text:
        return "/assets/dining_chair.glb"
    elif "deck" in text or "lounge" in text or "sun" in text:
        return "/assets/deck_chair.glb"
    elif "chair" in text or "كرسي" in text or "armchair" in text or "seating" in text or "مقعد" in text:
        return "/assets/armchair_wood.glb"
    elif "shelf" in text or "bookcase" in text or "bookshelf" in text or "رف" in text or "مكتبة" in text:
        return "/assets/display_shelf.glb"
    elif (
        "cabinet" in text
        or "drawer" in text
        or "wardrobe" in text
        or "storage" in text
        or "chest" in text
        or "sideboard" in text
        or "خزانة" in text
        or "دولاب" in text
    ):
        return "/assets/drawer_cabinet.glb"
    elif "outdoor" in text or "garden" in text or "patio" in text or "حديقة" in text:
        return "/assets/outdoor_set.glb"
    elif "coffee" in text or "table" in text or "طاول" in text:
        return "/assets/coffee_table_round.glb"
    elif "plant" in text or "نبات" in text or "شجر" in text or "fejka" in text:
        return "/assets/indoor_plant.glb"
    elif (
        "vase" in text
        or "flower" in text
        or "decor" in text
        or "ديكور" in text
        or "مزهرية" in text
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
        if "ikea_catalog" not in _get_table_names(db):
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
        if "ikea_catalog" not in _get_table_names(db):
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
        if "architectural_standards" in _get_table_names(db):
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


