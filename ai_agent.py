import os
import sys
import json
import math
import time
import logging

# Fix for Windows console encoding
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

import httpx
from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from dotenv import load_dotenv

from pydantic import BaseModel, Field
from typing import List, Literal

load_dotenv()

logger = logging.getLogger(__name__)

# Set environment variables
api_key = (os.environ.get("GEMINI_API_KEY") or "").strip()
os.environ["GOOGLE_API_KEY"] = api_key
os.environ["GEMINI_API_KEY"] = api_key

GEMINI_TIMEOUT_MS = 30000
GEMINI_MAX_ATTEMPTS = 2


# ── Pydantic Output Models ────────────────────────────────────────────────────

class Dimensions(BaseModel):
    length: float = Field(description="Length (size along X axis) in meters")
    width: float = Field(description="Width/Depth (size along Z axis) in meters")
    height: float = Field(description="Height (size along Y axis) in meters")

class Transform(BaseModel):
    t_x: float = Field(description="Translation along X axis (in meters)")
    t_y: float = Field(description="Translation along Y axis (vertical). MUST be strictly 0.0")
    t_z: float = Field(description="Translation along Z axis (in meters)")
    yaw_y: float = Field(description="Rotation angle around Y axis (in degrees, e.g. 0, 90, 180, -90)")
    scale: float = Field(description="Scale multiplier, MUST be 1.0")

class Economy(BaseModel):
    price: float = Field(description="Retail price of the furniture in Saudi Riyal (SAR)")
    currency: str = Field(description="ISO currency code, e.g. SAR")
    store_url: str = Field(description="Product retail URL")
    brand: str = Field(description="Brand name (e.g. IKEA, Abyat, West Elm)")
    sku: str = Field(description="SKU or item ID reference")

CANONICAL_ASSET_IDS = [
    "sofa",
    "armchair",
    "coffee_table",
    "coffee_table_art",
    "bookshelf",
    "tv_unit",
    "drawer_cabinet",
    "dining_chair",
    "deck_chair",
    "outdoor_set",
    "vase_flowers",
    "plant",
    "bed",
    "desk",
    "rug",
    "floor_lamp",
]


class Object3D(BaseModel):
    id: str = Field(description="Unique string identifier for this instance (e.g. sofa_main)")
    type: str = Field(description="Type of object. Must be one of: 'furniture', 'window', 'wall'")
    asset_id: str = Field(
        description=(
            "Asset ID. For 'furniture', must be one of: "
            + ", ".join(CANONICAL_ASSET_IDS)
        )
    )
    hex_color: str = Field(description="Hex color code (e.g., #FFFFFF)")
    dimensions: Dimensions
    transform: Transform
    economy: Economy

class RoomDimensions(BaseModel):
    width: float = Field(description="Width of the room in meters (X axis size)")
    depth: float = Field(description="Depth of the room in meters (Z axis size)")

class FullDesignOutput(BaseModel):
    concept_philosophy: str = Field(description="A detailed design philosophy concept, rationale, colors, and textures explanation.")
    architectural_references: List[str] = Field(description="List of architectural reference URLs or project names (e.g., Dezeen, ArchDaily).")
    spatial_layout_rules: str = Field(description="Strict technical layout rules, clearances, and circulation details.")
    wall_color: str = Field(description="Dominant wall paint hex color code (e.g., #E8E5DF)")
    floor_color: str = Field(description="Dominant floor finish hex color code (e.g., #C8B29B)")
    ambient_mode: Literal["morning", "rainy", "midnight"] = Field(
        description="Ambient lighting and weather mood matching the design: 'morning', 'rainy', or 'midnight'"
    )
    room_dimensions: RoomDimensions
    objects: List[Object3D]

from asset_scraper import IngestionPipeline

def get_dynamic_asset_registry():
    try:
        pipeline = IngestionPipeline()
        assets = pipeline.get_all()
        registry = [a["asset_id"] for a in assets if a.get("asset_id")]
        return registry if registry else list(CANONICAL_ASSET_IDS)
    except Exception as e:
        print(f"Failed to load dynamic registry: {e}")
        return list(CANONICAL_ASSET_IDS)

# Initialize the modern google-genai client
_client = genai.Client(api_key=api_key) if api_key else None


def _is_non_retryable_gemini_error(exc: Exception) -> bool:
    """Returns True for quota/429, auth, or 4xx client errors that must never be retried."""
    if isinstance(exc, genai_errors.ClientError):
        return True
    msg = str(exc).lower()
    non_retryable_tokens = (
        "429",
        "resource_exhausted",
        "quota",
        "rate limit",
        "api_key_invalid",
        "api key",
        "gemini_api_key",
        "unauthenticated",
        "permission_denied",
        "invalid_argument",
    )
    return any(tok in msg for tok in non_retryable_tokens)


def _is_transient_gemini_error(exc: Exception) -> bool:
    """Returns True ONLY for transient 5xx or transport/timeout failures."""
    if _is_non_retryable_gemini_error(exc):
        return False
    if isinstance(exc, (genai_errors.ServerError, TimeoutError, ConnectionError, httpx.TimeoutException, httpx.TransportError)):
        return True
    status_code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
    if isinstance(status_code, int) and 500 <= status_code < 600:
        return True
    msg = str(exc)
    return any(code in msg for code in ("500", "502", "503", "504", "DEADLINE_EXCEEDED"))


def _call_gemini_with_retry(
    model: str,
    contents,
    config: types.GenerateContentConfig | None = None,
    *,
    timeout_ms: int = GEMINI_TIMEOUT_MS,
    max_attempts: int = GEMINI_MAX_ATTEMPTS,
):
    """Calls Gemini generate_content with a bounded timeout and limited retry for transient 5xx/network errors."""
    if _client is None:
        raise RuntimeError("GEMINI_API_KEY not configured")

    if config is None:
        effective_config = types.GenerateContentConfig(
            http_options=types.HttpOptions(timeout=timeout_ms)
        )
    elif config.http_options is None:
        effective_config = config.model_copy(
            update={"http_options": types.HttpOptions(timeout=timeout_ms)}
        )
    else:
        effective_config = config

    for attempt in range(1, max_attempts + 1):
        try:
            return _client.models.generate_content(
                model=model,
                contents=contents,
                config=effective_config,
            )
        except Exception as exc:
            if attempt < max_attempts and _is_transient_gemini_error(exc):
                delay_s = 1.0 * (2 ** (attempt - 1))
                logger.warning(
                    "Transient Gemini error on attempt %d/%d (%s); retrying in %.1fs...",
                    attempt,
                    max_attempts,
                    exc,
                    delay_s,
                )
                time.sleep(delay_s)
                continue
            raise

# Global RagRetriever instance
_retriever_instance = None

def get_retriever():
    global _retriever_instance
    if _retriever_instance is None:
        try:
            from rag_retriever import RagRetriever
            _retriever_instance = RagRetriever()
        except Exception as e:
            print(f"[RAG] Failed to initialize RagRetriever: {e}")
            _retriever_instance = False # Use False to indicate failure and avoid retrying
    return _retriever_instance

def analyze_image_layout(image_b64: str) -> str:
    """Uses Gemini to describe the room in the image for the design pipeline."""
    import base64
    try:
        if "," in image_b64:
            mime_type = image_b64.split(";")[0].split(":")[1]
            data = image_b64.split(",")[1]
        else:
            mime_type = "image/jpeg"
            data = image_b64

        image_bytes = base64.b64decode(data)
        parts = [
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            "Analyze this room image for interior design. Describe the style, room type, color palette, furniture items, and their relative positions. Output a detailed paragraph in English."
        ]

        response = _call_gemini_with_retry(
            model="gemini-2.5-flash",
            contents=parts,
        )
        return response.text.strip()
    except Exception as e:
        if _is_non_retryable_gemini_error(e):
            raise
        logger.warning("Vision analysis failed: %s", e)
        return ""

def generate_layout(prompt: str, image_b64: str | None = None) -> dict:
    """Fast, direct Gemini 2.5 Flash architectural generation with Neufert standards and structured output."""

    # 1. Vision preprocessing
    image_context = ""
    if image_b64:
        logger.info("Analyzing image context using vision model...")
        analyzed_desc = analyze_image_layout(image_b64)
        if analyzed_desc:
            image_context = f"\nAdditional Room Image Context:\n{analyzed_desc}\n"

    asset_registry = get_dynamic_asset_registry()

    # Retrieve relevant architectural standards context
    from backend.app.services.rag_service import get_relevant_standards_context
    standards_context = get_relevant_standards_context(prompt)

    system_instruction = (
        "You are an elite Senior Architectural Spatial Planner & Interior Design AI adhering strictly to Neufert and Saudi Building Code standards.\n"
        "Your task is to analyze the user request and generate a complete, mathematically precise 3D room layout.\n\n"
        "STRICT SPATIAL AND SCHEMA CONSTRAINTS:\n"
        "1. REALISTIC ROOM SIZE: Default to room dimensions (width and depth between 4m and 6m, e.g., 5x5m). The floor is centered at (t_x: 0, t_y: 0, t_z: 0).\n"
        "2. DIORAMA MODE: Always generate exactly two walls at the back perimeters to frame the scene (e.g., North/back wall at z=-depth/2, West/left wall at x=-width/2). "
        "NEVER enclose the room fully. Leave the front (South and East sides) open for the camera.\n"
        "3. STRICT COORDINATE BOUNDARIES: ALL generated objects MUST have their [t_x, t_z] coordinates strictly inside the room's dimensions. For a 5x5 room, no object coordinates can be < -2.5 or > 2.5.\n"
        "4. FLOOR ANCHOR: All furniture objects MUST have transform.t_y = 0.0. Never let furniture float or sink.\n"
        "5. WALL SNAPPING: Objects like TV units, cabinets, bookshelves, or beds MUST have their back edge aligned flush with a perimeter wall without intersecting it.\n"
        "6. WINDOW: Generate at least ONE architectural window object (type='window', asset_id='window') flush against either the back North wall (z = -depth/2, yaw_y = 0) or the left West wall (x = -width/2, yaw_y = 90) with realistic dimensions (e.g., length 1.6-2.4m, width 0.15m, height 1.8-2.2m) and transform position.\n"
        "7. SPACING & CLEARANCES: Furniture MUST face logical directions (yaw_y: 0, 90, 180, or -90 degrees). Maintain at least 0.9m primary walkways and 0.4m between coffee table and sofa.\n"
        f"8. ASSET REGISTRY: For 'furniture' objects, choose asset_id strictly from this list: {json.dumps(asset_registry)}. Avoid overlaps.\n"
        "9. 60-30-10 COLOR HARMONY & FINISHES: Always populate top-level 'wall_color' (e.g., '#E8E5DF') and 'floor_color' (e.g., '#C8B29B') as valid hex color codes matching the requested palette, plus 'ambient_mode' strictly as one of 'morning', 'rainy', or 'midnight' matching the requested atmosphere/lighting.\n"
        "10. SMART ECONOMY: Generate realistic price in SAR (currency 'SAR'), store details, and SKU from real brands (IKEA, Abyat, West Elm).\n\n"
        f"ARCHITECTURAL & ERGONOMIC CONTEXT:\n{standards_context}\n"
    )

    user_full_prompt = f"User Request: {prompt}\n{image_context}\nGenerate the complete 3D interior design layout conforming to all constraints."

    logger.info("Generating direct 3D architectural layout for: %s", prompt[:80])

    response = _call_gemini_with_retry(
        model="gemini-2.5-flash",
        contents=[user_full_prompt],
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=FullDesignOutput,
            temperature=0.3,
        ),
    )

    raw_payload = json.loads(response.text.strip())
    validated = FullDesignOutput.model_validate(raw_payload)
    payload = validated.model_dump()
    payload["stage"] = 1
    payload["wall_color"] = validated.wall_color.strip() or "#E8E5DF"
    payload["floor_color"] = validated.floor_color.strip() or "#C8B29B"
    payload["ambient_mode"] = validated.ambient_mode or "morning"

    logger.info("Direct 3D layout generated successfully.")
    return payload


def _catalog_dim_to_mm(value: object, default_mm: int) -> int:
    parsed = _safe_float(value, 0.0)
    if parsed <= 0.0:
        return default_mm
    if parsed < 10.0:
        return round(parsed * 1000.0)
    return round(parsed)


def handle_chat_request(user_message: str) -> dict:
    """Uses Gemini to interpret chat and LanceDB RAG to find matching items."""
    system_instruction = (
        "You are an AI Interior Design Assistant. A user will talk to you. "
        "If they are asking to add or find a specific furniture item (e.g. 'add a cheap sofa', 'find a blue chair', 'أضف كنبة'), "
        "extract the keywords for a database search into 'search_query' (in English or Arabic), and set 'intent' to 'add'. "
        "If they are just chatting, set 'intent' to 'chat' and 'search_query' to null. "
        "Output JSON only: {\"intent\": \"add\"|\"chat\", \"search_query\": \"...\"|null}"
    )

    try:
        response = _call_gemini_with_retry(
            model="gemini-2.5-flash",
            contents=[user_message],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
            ),
        )
        data = json.loads(response.text.strip())
        if not isinstance(data, dict):
            raise ValueError("Expected JSON object from chat parser")
    except Exception as e:
        if _is_non_retryable_gemini_error(e):
            raise
        logger.warning("Chat intent parsing failed: %s", e)
        data = {"intent": "chat", "search_query": None}

    response_payload = {
        "text": "مرحباً! كيف يمكنني مساعدتك؟",
        "items": []
    }

    if data.get("intent") == "add" and data.get("search_query"):
        try:
            retriever = get_retriever()
            if retriever:
                results = retriever.search(data["search_query"], limit=1)
                if results:
                    best = results[0]
                    price = best.get("price", 0)
                    name = best.get("name", "أثاث")

                    response_payload["text"] = f"لقد وجدت {name} بسعر {price} ريال. سأقوم بإضافته إلى الغرفة الآن!"

                    item_obj = {
                        "name": name,
                        "hex_color": "#ffffff",
                        "economy": {
                            "price": float(price),
                            "currency": "SAR",
                            "store_url": best.get("link", ""),
                            "brand": "IKEA",
                            "sku": best.get("item_id", ""),
                            "name": name
                        }
                    }

                    item_obj["dimensions"] = {
                        "width": _catalog_dim_to_mm(best.get("dim_width"), 1000),
                        "height": _catalog_dim_to_mm(best.get("dim_height"), 800),
                        "depth": _catalog_dim_to_mm(best.get("dim_depth"), 800),
                    }

                    item_obj["transform"] = {"t_x": 0, "t_y": 0, "t_z": 0, "yaw_y": 0, "scale": 1.0}

                    cat_lower = str(best.get("category", "")).lower()
                    name_lower = str(name).lower()
                    text_lower = f"{cat_lower} {name_lower}"
                    if "sofa" in text_lower or "couch" in text_lower or "كنب" in text_lower or "أريكة" in text_lower:
                        item_obj["asset_id"] = "sofa"
                    elif ("dining" in text_lower and ("chair" in text_lower or "كرسي" in text_lower)) or "stool" in text_lower:
                        item_obj["asset_id"] = "dining_chair"
                    elif "deck" in text_lower or "lounge" in text_lower:
                        item_obj["asset_id"] = "deck_chair"
                    elif "chair" in text_lower or "كرسي" in text_lower or "armchair" in text_lower or "seating" in text_lower or "مقاعد" in text_lower:
                        item_obj["asset_id"] = "armchair"
                    elif "shelf" in text_lower or "bookcase" in text_lower or "bookshelf" in text_lower or "رف" in text_lower:
                        item_obj["asset_id"] = "bookshelf"
                    elif "tv" in text_lower or "تلفزيون" in text_lower or "تلفاز" in text_lower:
                        item_obj["asset_id"] = "tv_unit"
                    elif "cabinet" in text_lower or "drawer" in text_lower or "storage" in text_lower or "خزانة" in text_lower:
                        item_obj["asset_id"] = "drawer_cabinet"
                    elif "outdoor" in text_lower or "garden" in text_lower or "حديقة" in text_lower:
                        item_obj["asset_id"] = "outdoor_set"
                    elif "table" in text_lower or "طاولات" in text_lower or "طاولة" in text_lower:
                        item_obj["asset_id"] = "coffee_table"
                    elif "vase" in text_lower or "flower" in text_lower or "مزهرية" in text_lower:
                        item_obj["asset_id"] = "vase_flowers"
                    elif "plant" in text_lower or "نبات" in text_lower or "decor" in text_lower or "ديكور" in text_lower:
                        item_obj["asset_id"] = "plant"
                    else:
                        item_obj["asset_id"] = "armchair"

                    response_payload["items"].append(item_obj)
                else:
                    response_payload["text"] = "عذراً، لم أتمكن من العثور على أثاث يطابق طلبك."
        except Exception as e:
            logger.error("RAG search failed in chat: %s", e, exc_info=True)
            response_payload["text"] = "حدث خطأ أثناء البحث في الكتالوج."
    else:
        try:
            chat_response = _call_gemini_with_retry(
                model="gemini-2.5-flash",
                contents=[user_message],
                config=types.GenerateContentConfig(
                    system_instruction="You are a helpful Interior Design AI. Answer in Arabic briefly.",
                ),
            )
            response_payload["text"] = chat_response.text.strip()
        except Exception as e:
            if _is_non_retryable_gemini_error(e):
                raise
            logger.warning("Chat reply generation failed: %s", e)

    return response_payload

def _safe_float(value: object, default: float) -> float:
    if value is None or isinstance(value, bool):
        return default
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return default
    return parsed if math.isfinite(parsed) else default

def _extract_xz_position(pos: object) -> tuple[float, float]:
    """Extract (x, z) coordinates in meters from a 3D [x, y, z] sequence."""
    if not isinstance(pos, (list, tuple)) or len(pos) < 3:
        return 0.0, 0.0
    return _safe_float(pos[0], 0.0), _safe_float(pos[2], 0.0)

def _extract_xz_dimensions(dims: object) -> tuple[float, float]:
    """Extract (width_x, depth_z) in meters from either {length, width} or {width, depth}."""
    if not isinstance(dims, dict) or not dims:
        return 1.0, 0.8
    if "length" in dims and dims["length"] is not None:
        w = _safe_float(dims["length"], 1.0)
        d_val = dims.get("width") if dims.get("width") is not None else dims.get("depth")
        d = _safe_float(d_val, 0.8) if d_val is not None else 0.8
    else:
        w_val = dims.get("width")
        d_val = dims.get("depth")
        w = _safe_float(w_val, 1.0) if w_val is not None else 1.0
        d = _safe_float(d_val, 0.8) if d_val is not None else 0.8
    return w, d

def audit_spatial_layout(items: list, room_width: float = 5.0, room_depth: float = 5.0) -> dict:
    """Architectural audit checking clearances, walkways, and spatial balance."""
    score = 100
    recommendations = []
    clearance_checks = []

    safe_room_w = _safe_float(room_width, 5.0)
    safe_room_d = _safe_float(room_depth, 5.0)
    room_area = max(1.0, safe_room_w * safe_room_d)
    furniture_footprint = 0.0

    # Categorize items
    sofas = []
    coffee_tables = []
    tv_units = []
    valid_item_count = 0

    for item in (items or []):
        if not isinstance(item, dict):
            continue
        valid_item_count += 1
        pos_x, pos_z = _extract_xz_position(item.get("position"))
        w, d = _extract_xz_dimensions(item.get("dimensions"))
        asset = str(item.get("asset_id") or item.get("name") or "").lower()

        if not any(k in asset for k in ["rug", "carpet", "floor", "سجادة", "أرضية"]):
            furniture_footprint += (w * d)

        if "sofa" in asset:
            sofas.append((item, (pos_x, pos_z), (w, d)))
        elif "table" in asset or "coffee" in asset:
            coffee_tables.append((item, (pos_x, pos_z), (w, d)))
        elif "tv" in asset:
            tv_units.append((item, (pos_x, pos_z), (w, d)))

    # 1. Density ratio check
    density = (furniture_footprint / room_area) * 100
    if valid_item_count == 0:
        recommendations.append("الغرفة فارغة حالياً ولا تحتوي على قطع أثاث لتقييم توزيعها. يمكنك إضافة القطع الأساسية مثل الكنبة والطاولة.")
    elif density > 45:
        score -= 15
        recommendations.append(f"كثافة الأثاث في الغرفة مرتفعة ({density:.0f}% من مساحة الأرضية). يُفضل إزالة أو تقليص أحجام بعض القطع لتحقيق انسيابية الحركة.")
    elif density < 15:
        recommendations.append(f"المساحة شاغرة نسبياً ({density:.0f}% فقط مشغولة). يمكنك إضافة سجادة أوسع، كراسي قراءة، أو نباتات لإضفاء الحميمية.")
    else:
        clearance_checks.append("نسبة إشغال الفراغ مثالية وضمن المعايير الهندسية (25% - 40%).")

    # 2. Coffee table to sofa distance check (2D AABB edge-to-edge clearance)
    if sofas and coffee_tables:
        _, (sx, sz), (sw, sd) = sofas[0]
        _, (cx, cz), (cw, cd) = coffee_tables[0]
        gap_x = max(0.0, abs(sx - cx) - (sw + cw) / 2.0)
        gap_z = max(0.0, abs(sz - cz) - (sd + cd) / 2.0)
        dist = math.hypot(gap_x, gap_z)
        if dist < 0.30:
            score -= 10
            recommendations.append(f"طاولة القهوة قريبة جداً من الكنبة ({dist*100:.0f} سم). المعيار الهندسي الموصى به هو 35 إلى 45 سم لسهولة الجلوس والنهوض.")
        elif dist > 0.65:
            score -= 10
            recommendations.append(f"طاولة القهوة بعيدة جداً عن الكنبة ({dist*100:.0f} سم). يُفضل تقريبها لتكون في متناول اليد بسهولة.")
        else:
            clearance_checks.append(f"المسافة بين الكنبة وطاولة القهوة ممتازة ({dist*100:.0f} سم - المعيار 35-45 سم).")

    # 3. TV viewing distance check
    if sofas and tv_units:
        sx, sz = sofas[0][1]
        tx, tz = tv_units[0][1]
        tv_dist = math.sqrt((sx - tx)**2 + (sz - tz)**2)
        if tv_dist < 1.5:
            score -= 15
            recommendations.append(f"شاشة التلفاز قريبة جداً من الجالسين ({tv_dist:.1f} متر). المسافة الصحية المريحة للعين تبدأ من 2.0 متر على الأقل.")
        else:
            clearance_checks.append(f"مسافة الرؤية بين وحدة التلفاز والمقاعد مطابقة للمعيار الصحي ({tv_dist:.1f} متر).")

    # 4. 2D Bounding Box Collision Check (Excludes rugs / flooring)
    solid_items = []
    for item in (items or []):
        if not isinstance(item, dict):
            continue
        asset_id = str(item.get("asset_id") or item.get("name") or "").lower()
        if any(keyword in asset_id for keyword in ["rug", "carpet", "floor", "سجادة", "أرضية"]):
            continue
        pos_x, pos_z = _extract_xz_position(item.get("position"))
        w, d = _extract_xz_dimensions(item.get("dimensions"))
        name = item.get("name") or asset_id
        min_x = pos_x - (w / 2.0)
        max_x = pos_x + (w / 2.0)
        min_z = pos_z - (d / 2.0)
        max_z = pos_z + (d / 2.0)
        solid_items.append((name, min_x, max_x, min_z, max_z))

    overlapping_pairs = []
    for i in range(len(solid_items)):
        for j in range(i + 1, len(solid_items)):
            name_a, min_xa, max_xa, min_za, max_za = solid_items[i]
            name_b, min_xb, max_xb, min_zb, max_zb = solid_items[j]

            overlap_x = min(max_xa, max_xb) - max(min_xa, min_xb)
            overlap_z = min(max_za, max_zb) - max(min_za, min_zb)

            if overlap_x > 0.05 + 1e-6 and overlap_z > 0.05 + 1e-6:
                overlapping_pairs.append((name_a, name_b))

    if overlapping_pairs:
        score -= min(25, len(overlapping_pairs) * 10)
        pairs_str = "، ".join([f"({a} مع {b})" for a, b in overlapping_pairs[:3]])
        recommendations.append(f"تم رصد تداخل مكاني بين بعض قطع الأثاث: {pairs_str}. يُرجى تعديل مواضعها لتجنب التصادم الهندسي.")
    elif len(solid_items) > 1:
        clearance_checks.append("لا يوجد أي تداخل مكاني (Collision) بين قطع الأثاث الرئيسية.")

    score = max(50, min(100, score))
    status = "ممتاز ومطابق للمعايير" if score >= 85 else ("جيد مع بعض الملاحظات" if score >= 70 else "يحتاج إلى إعادة تنظيم")

    if not recommendations:
        recommendations.append("التوزيع الفراغي الحالي يراعي كافة مسارات الحركة والنسب الإنسانية المعمارية بشكل ممتاز!")

    return {
        "status": "success",
        "spatial_score": score,
        "assessment_label": status,
        "density_percentage": round(density, 1),
        "recommendations": recommendations,
        "passed_checks": clearance_checks
    }

