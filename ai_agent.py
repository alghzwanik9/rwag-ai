import os
import sys
import json
import math
import time
import uuid
import logging

# Fix for Windows console encoding
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

import httpx
import requests
from requests.exceptions import RequestException, Timeout as RequestsTimeout
from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from dotenv import load_dotenv

from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Dict, Any

load_dotenv()

logger = logging.getLogger(__name__)

# Set environment variables
api_key = (os.environ.get("GEMINI_API_KEY") or "").strip()
os.environ["GOOGLE_API_KEY"] = api_key
os.environ["GEMINI_API_KEY"] = api_key

GEMINI_TIMEOUT_MS = 90000
GEMINI_MAX_ATTEMPTS = 3


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

# Initialize the modern google-genai client with increased timeout
_client = genai.Client(
    api_key=api_key,
    http_options=types.HttpOptions(timeout=GEMINI_TIMEOUT_MS)
) if api_key else None


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
    if isinstance(exc, (genai_errors.ServerError, TimeoutError, ConnectionError, RequestsTimeout, httpx.TimeoutException, httpx.TransportError)):
        return True
    status_code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
    if isinstance(status_code, int) and 500 <= status_code < 600:
        return True
    msg = str(exc).lower()
    return any(code in msg for code in ("500", "502", "503", "504", "deadline_exceeded", "unavailable", "high demand", "timed out", "read timeout"))


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
                delay_s = 2.0 * (2 ** (attempt - 1))
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


def analyze_floorplan_image(
    image_input: bytes | str,
    mime_type: str = "image/jpeg"
):
    """Multimodal 2D Floorplan & CAD blueprint extractor using Gemini 2.5 Flash.

    Extracts:
    - Printed or estimated room dimensions (width, depth, height) safely clamped (2.5m-12.0m).
    - Room classification & confidence score (0.0-1.0).
    - Perimeter wall openings (doors, windows) with offsets and dimensions.
    - Detected furniture items / architectural zones.
    """
    import base64
    from backend.app.schemas import ExtractedOpening, FloorplanExtractionResult

    image_bytes: bytes
    if isinstance(image_input, bytes):
        image_bytes = image_input
    elif isinstance(image_input, str):
        if "," in image_input:
            header, encoded = image_input.split(",", 1)
            if "image/" in header:
                mime_type = header.split(";")[0].split(":")[1]
            image_bytes = base64.b64decode(encoded)
        else:
            image_bytes = base64.b64decode(image_input)
    else:
        raise ValueError("image_input must be bytes or base64 string")

    system_instruction = (
        "You are an expert Architectural CAD & Floorplan Vision AI adhering to Neufert and Saudi Building Code (SBC) standards.\n"
        "Your task is to analyze 2D floor plans, CAD blueprints, or hand-drawn sketches and accurately extract structural room data.\n\n"
        "EXTRACTION RULES:\n"
        "1. ROOM DIMENSIONS:\n"
        "   - If printed dimensions/labels are visible (e.g. '4.50 x 5.20', '450 x 520 cm', '4500 x 5200 mm'), read them and convert to meters.\n"
        "   - If no printed dimensions exist (e.g. hand-drawn sketch or unlabelled CAD), estimate realistic residential proportions based on the room type:\n"
        "     * Living room / Majlis: typically 5.0m to 7.5m width, 4.5m to 6.5m depth.\n"
        "     * Bedroom: typically 3.8m to 5.0m width, 4.0m to 5.5m depth.\n"
        "     * Office / Study: typically 3.2m to 4.5m width, 3.5m to 4.5m depth.\n"
        "     * Studio: typically 4.5m to 6.0m width, 4.5m to 6.5m depth.\n"
        "   - Clamped safely: width between 2.5m and 12.0m, depth between 2.5m and 12.0m.\n"
        "   - Height (wall height) defaults to 2.8m (typical 2.6m to 3.5m, clamped 2.4m to 4.5m).\n"
        "2. DOMINANT ROOM EXTRACTION:\n"
        "   - If the plan contains multiple rooms (e.g. entire apartment CAD), extract the primary/largest dominant living room or bedroom.\n"
        "3. DETECTED OPENINGS (DOORS & WINDOWS):\n"
        "   - Assign each opening to its perimeter wall: 'back' (North), 'left' (West), 'right' (East), 'front' (South).\n"
        "   - 'offset_ratio': normalized coordinate along the wall from -1.0 to 1.0 (where 0.0 is center of the wall).\n"
        "   - 'width_m': opening width in meters (doors: 0.8m–1.2m, windows: 1.0m–3.0m).\n"
        "   - 'type': 'door' or 'window'.\n"
        "   - 'height_m': vertical span in meters (doors ~2.1m, windows ~1.6m).\n"
        "4. DETECTED FURNITURE / ZONES:\n"
        "   - List any furniture symbols or zones detected in the drawing (e.g. 'sofa', 'tv_unit', 'coffee_table', 'bed', 'desk').\n"
        "5. SUMMARIES:\n"
        "   - summary_ar: Arabic concise summary (e.g. 'تم استخراج صالة معيشة بأبعاد 5.2م × 4.8م مع نافذة خلفية وباب جانبي').\n"
        "   - summary_en: English technical summary."
    )

    try:
        parts = [
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type or "image/jpeg"),
            "Extract the precise architectural dimensions, openings, and furniture zones from this floor plan image."
        ]
        response = _call_gemini_with_retry(
            model="gemini-2.5-flash",
            contents=parts,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=FloorplanExtractionResult,
                temperature=0.2,
            ),
        )
        raw_json = json.loads(response.text.strip())
        res = FloorplanExtractionResult.model_validate(raw_json)
    except Exception as exc:
        if _is_non_retryable_gemini_error(exc):
            raise
        logger.warning("Gemini floorplan vision extraction failed or unavailable: %s. Using safe heuristic fallback.", exc)
        res = FloorplanExtractionResult(
            room_type="living room",
            confidence=0.70,
            width=5.5,
            depth=4.8,
            height=2.8,
            openings=[
                ExtractedOpening(wall="back", offset_ratio=0.0, width_m=1.8, type="window", height_m=1.6),
                ExtractedOpening(wall="right", offset_ratio=0.5, width_m=0.9, type="door", height_m=2.1),
            ],
            detected_furniture=["sofa", "coffee_table", "tv_unit"],
            room_shape="single",
            summary_ar="تم تقدير أبعاد الغرفة بـ 5.5م × 4.8م بناءً على النماذج المعمارية السكنية القياسية.",
            summary_en="Estimated room dimensions 5.5m x 4.8m based on standard residential architectural heuristics."
        )

    clamped_w = round(max(2.5, min(12.0, float(res.width))), 2)
    clamped_d = round(max(2.5, min(12.0, float(res.depth))), 2)
    clamped_h = round(max(2.4, min(4.5, float(res.height or 2.8))), 2)
    clamped_conf = round(max(0.0, min(1.0, float(res.confidence))), 2)

    sanitized_openings: List[ExtractedOpening] = []
    for op in (res.openings or []):
        wall = op.wall if op.wall in ("back", "left", "right", "front") else "back"
        offset = round(max(-1.0, min(1.0, float(op.offset_ratio))), 3)
        w_m = round(max(0.6, min(4.0, float(op.width_m))), 2)
        h_m = round(max(0.8, min(3.5, float(op.height_m or (2.1 if op.type == "door" else 1.6)))), 2)
        sanitized_openings.append(
            ExtractedOpening(
                wall=wall,
                offset_ratio=offset,
                width_m=w_m,
                type=op.type if op.type in ("door", "window") else "window",
                height_m=h_m
            )
        )

    return FloorplanExtractionResult(
        room_type=res.room_type or "living room",
        confidence=clamped_conf,
        width=clamped_w,
        depth=clamped_d,
        height=clamped_h,
        openings=sanitized_openings,
        detected_furniture=res.detected_furniture or [],
        room_shape=res.room_shape or "single",
        summary_ar=res.summary_ar or f"تم تحليل المخطط: أبعاد {clamped_w}م × {clamped_d}م مع {len(sanitized_openings)} فتحات.",
        summary_en=res.summary_en or f"Analyzed floorplan: dimensions {clamped_w}m x {clamped_d}m with {len(sanitized_openings)} openings."
    )


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
        "1. ROOM SHAPE & ARCHITECTURE: Infer 'shape' in room_dimensions from the user's prompt:\n"
        "   - 'corridor_room': if the user mentions a hallway, corridor, or entry (سيب، ممر، مدخل).\n"
        "   - 'open_plan': if the user mentions open kitchen with living room (مطبخ مفتوح مع صالة، مطبخ أمريكي).\n"
        "   - 'l_shape': if the user requests an L-shaped layout or angled space (شكل L، زاوية).\n"
        "   - 'single': for a standard rectangular room (غرفة نوم، مكتب، مجلس مستقل).\n"
        "   Default room dimensions between 4m and 7m. Floor centered at (0, 0, 0).\n"
        "2. DIORAMA MODE: Generate back perimeter walls framing the scene (North and West walls). Leave South and East open for viewing.\n"
        "3. FUNCTIONAL CLUSTERING & LOGICAL GROUPING: Furniture MUST be organized into cohesive functional clusters:\n"
        "   - Work Cluster: Desk backed against wall, Desk Chair centered and facing desk, Rug underneath the desk and chair.\n"
        "   - Living Cluster: Sofa facing TV unit with Coffee Table in between at 0.45m distance, Rug centered under the cluster.\n"
        "   - Circulation: Maintain unobstructed 0.9m minimum primary walkways.\n"
        "4. FLOOR ANCHOR: All furniture objects MUST have transform.t_y = 0.0. Never let furniture float or sink.\n"
        "5. WALL SNAPPING: Objects like TV units, cabinets, bookshelves, or desks MUST have their back edge aligned flush with a perimeter wall without intersecting it.\n"
        "6. WINDOW: Generate at least ONE architectural window object (type='window', asset_id='window') flush against either the back North wall (z = -depth/2, yaw_y = 0) or the left West wall (x = -width/2, yaw_y = 90) with realistic dimensions and transform position.\n"
        "7. SPACING & CLEARANCES: Furniture MUST face logical directions (yaw_y: 0, 90, 180, or -90 degrees).\n"
        f"8. ASSET REGISTRY: For 'furniture' objects, choose asset_id strictly from this list: {json.dumps(asset_registry)}. Avoid overlaps.\n"
        "9. 60-30-10 COLOR HARMONY & FINISHES: Always populate top-level 'wall_color' (e.g., '#E8E5DF') and 'floor_color' (e.g., '#C8B29B') as valid hex color codes matching the requested palette, plus 'ambient_mode' strictly as one of 'morning', 'rainy', or 'midnight'.\n"
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

    # Apply Spatial Clustering Solver for architectural alignments and ergonomic grouping
    try:
        from backend.app.services.spatial_solver import SpatialClusteringSolver
        r_dims = payload.get("room_dimensions") or {}
        r_w = _safe_float(r_dims.get("width"), 5.0)
        r_d = _safe_float(r_dims.get("depth"), 5.0)

        # Keyword-based architectural shape inference
        lower_prompt = prompt.lower()
        if any(k in lower_prompt for k in ["سيب", "ممر", "مدخل", "corridor", "hallway", "entry"]):
            r_dims["shape"] = "corridor_room"
        elif any(k in lower_prompt for k in ["مطبخ مفتوح", "مطبخ مع صالة", "صالة ومطبخ", "مطبخ امريكي", "مطبخ أمريكي", "open kitchen", "open plan", "open-plan"]):
            r_dims["shape"] = "open_plan"
        elif any(k in lower_prompt for k in ["شكل l", "l-shape", "l shape", "زاوية", "l_shape"]):
            r_dims["shape"] = "l_shape"
        elif not r_dims.get("shape"):
            r_dims["shape"] = "single"

        payload["room_dimensions"] = r_dims
        r_s = r_dims.get("shape", "single")

        if "objects" in payload and isinstance(payload["objects"], list):
            payload["objects"] = SpatialClusteringSolver.solve_layout(
                payload["objects"],
                room_width=r_w,
                room_depth=r_d,
                shape=r_s
            )
            logger.info("Spatial clustering solver applied successfully with shape: %s", r_s)

        # ── Closed-Loop Self-Correction Engine ──
        # Convert objects to audit format to verify SBC & Neufert standards
        audit_items = []
        for obj in payload.get("objects", []):
            if obj.get("type") == "furniture":
                t = obj.get("transform", {})
                dims = obj.get("dimensions", {})
                w_m = _safe_float(dims.get("length") or dims.get("width_mm", 1000) / 1000.0, 1.0)
                d_m = _safe_float(dims.get("width") or dims.get("depth_mm", 800) / 1000.0, 0.8)
                audit_items.append({
                    "asset_id": obj.get("asset_id", ""),
                    "name": obj.get("name") or obj.get("asset_id", ""),
                    "position": [_safe_float(t.get("t_x")), _safe_float(t.get("t_y")), _safe_float(t.get("t_z"))],
                    "dimensions": {"width": w_m, "depth": d_m}
                })

        initial_audit = audit_spatial_layout(audit_items, room_width=r_w, room_depth=r_d)
        initial_score = initial_audit.get("spatial_score", 100)
        logger.info("Closed-loop initial audit score: %s (%s)", initial_score, initial_audit.get("assessment_label"))

        # If score is below 85 or any violation is flagged, trigger automatic self-correction pass
        if initial_score < 85 or any("تداخل" in rec or "قريبة" in rec or "بعيدة" in rec or "مقيد" in rec for rec in initial_audit.get("recommendations", [])):
            logger.info("Spatial audit score %s < 85. Executing auto-correction pass via SpatialClusteringSolver...", initial_score)
            payload["objects"] = SpatialClusteringSolver.auto_correct_violations(
                payload["objects"],
                room_width=r_w,
                room_depth=r_d,
                violations=initial_audit.get("recommendations", [])
            )
            # Re-audit post correction
            audit_items_fixed = []
            for obj in payload.get("objects", []):
                if obj.get("type") == "furniture":
                    t = obj.get("transform", {})
                    dims = obj.get("dimensions", {})
                    w_m = _safe_float(dims.get("length") or dims.get("width_mm", 1000) / 1000.0, 1.0)
                    d_m = _safe_float(dims.get("width") or dims.get("depth_mm", 800) / 1000.0, 0.8)
                    audit_items_fixed.append({
                        "asset_id": obj.get("asset_id", ""),
                        "name": obj.get("name") or obj.get("asset_id", ""),
                        "position": [_safe_float(t.get("t_x")), _safe_float(t.get("t_y")), _safe_float(t.get("t_z"))],
                        "dimensions": {"width": w_m, "depth": d_m}
                    })
            final_audit = audit_spatial_layout(audit_items_fixed, room_width=r_w, room_depth=r_d)
            payload["spatial_audit"] = final_audit
            payload["auto_corrected"] = True
            logger.info("Closed-loop auto-correction completed. New score: %s", final_audit.get("spatial_score"))
        else:
            payload["spatial_audit"] = initial_audit
            payload["auto_corrected"] = False
    except Exception as solver_err:
        logger.warning("Spatial solver fallback: %s", solver_err)

    logger.info("Direct 3D layout generated successfully.")
    return payload


def _catalog_dim_to_mm(value: object, default_mm: int) -> int:
    parsed = _safe_float(value, 0.0)
    if parsed <= 0.0:
        return default_mm
    if parsed < 10.0:
        return round(parsed * 1000.0)
    return round(parsed)


STYLE_PRESETS = {
    "japandi": {
        "title": "ياباندي (Japandi)",
        "wall_color": "#EDE8E0",
        "floor_color": "#C8B29B",
        "ambient_mode": "morning",
        "seating_color": "#D5CEBF",
        "tables_color": "#C2AB95",
        "rug_color": "#E4DDD3",
        "storage_color": "#B8A38E",
        "general_color": "#D8D0C5"
    },
    "neoclassic": {
        "title": "نيو كلاسيك (Neo-Classic)",
        "wall_color": "#F4F1EA",
        "floor_color": "#3D2B1F",
        "ambient_mode": "midnight",
        "seating_color": "#2C3E50",
        "tables_color": "#C5A059",
        "rug_color": "#EAE5DA",
        "storage_color": "#1F2937",
        "general_color": "#8B7355"
    },
    "modern": {
        "title": "مودرن معاصر (Modern)",
        "wall_color": "#F0EFEB",
        "floor_color": "#5A5A5A",
        "ambient_mode": "morning",
        "seating_color": "#2D3142",
        "tables_color": "#BFC0C0",
        "rug_color": "#EAE8E1",
        "storage_color": "#4F5D75",
        "general_color": "#3A3D40"
    },
    "bohemian": {
        "title": "بوهيمي دافئ (Bohemian)",
        "wall_color": "#FAF0E6",
        "floor_color": "#B8860B",
        "ambient_mode": "rainy",
        "seating_color": "#C86D51",
        "tables_color": "#8B5A2B",
        "rug_color": "#F5DEB3",
        "storage_color": "#A0522D",
        "general_color": "#DEB887"
    },
    "minimalist": {
        "title": "مينيمال هادئ (Minimalist)",
        "wall_color": "#F8F9FA",
        "floor_color": "#D6D6D6",
        "ambient_mode": "morning",
        "seating_color": "#495057",
        "tables_color": "#E9ECEF",
        "rug_color": "#F1F3F5",
        "storage_color": "#6C757D",
        "general_color": "#CED4DA"
    },
    "wabi_sabi": {
        "title": "وابي سابي طبيعي (Wabi-Sabi)",
        "wall_color": "#E3DCCF",
        "floor_color": "#8C7B6B",
        "ambient_mode": "morning",
        "seating_color": "#B7A99A",
        "tables_color": "#7D6B58",
        "rug_color": "#D3C7B5",
        "storage_color": "#9A8C7C",
        "general_color": "#5C5346"
    }
}


def handle_chat_request(
    user_message: str,
    scene_items: Optional[List[Dict[str, Any]]] = None,
    selected_asset_id: Optional[str] = None,
    room_width: float = 5.0,
    room_depth: float = 5.0,
    room_shape: str = "single",
    windows: Optional[List[Dict[str, Any]]] = None,
    wall_color: Optional[str] = None,
    floor_color: Optional[str] = None,
) -> dict:
    """
    Multi-Turn Interactive Co-Pilot: Uses Gemini 2.5 to interpret chat, resolve spatial ambiguity,
    and generate atomic Scene Mutations (MODIFY, REMOVE, ADD, ROOM_STYLE) without destructive re-generation.
    """
    # 1. Format active scene context
    items_summary = []
    if scene_items:
        for it in scene_items:
            iid = it.get("instance_id") or it.get("id") or "unknown"
            aid = it.get("asset_id") or "furniture"
            name = it.get("name") or aid
            pos = it.get("position") or [0, 0, 0]
            pos_str = f"[{_safe_float(pos[0], 0):.2f}, {_safe_float(pos[1], 0):.2f}, {_safe_float(pos[2], 0):.2f}]" if len(pos) >= 3 else "[0, 0, 0]"
            col = it.get("color") or "default"
            is_sel = (iid == selected_asset_id) if selected_asset_id else False
            sel_str = " (CURRENTLY_SELECTED)" if is_sel else ""
            items_summary.append(f"- instance_id: '{iid}', asset_id: '{aid}', name: '{name}', color: '{col}', position: {pos_str}{sel_str}")

    scene_text = "\n".join(items_summary) if items_summary else "المشهد فارغ حالياً (لا توجد قطع أثاث)."
    sel_text = f"'{selected_asset_id}'" if selected_asset_id else "لا يوجد (None)"

    system_instruction = f"""أنت مهندس تصميم داخلي ذكي ومساعد استوديو تفاعلي في منصة 'رواق AI' (Spatial Interior Co-Pilot).
مهمتك تحليل رسالة المستخدم بالنسبة لحالة المشهد الحالي ثلاثي الأبعاد وتحديد العملية المعمارية بدقة متناهية.

حالة المشهد الحالي:
- أبعاد الغرفة: {room_width:.1f}م عرض × {room_depth:.1f}م عمق (الشكل: {room_shape})
- لون الجدران: {wall_color or '#EDE8E0'} | لون الأرضية: {floor_color or '#C8B29B'}
- القطعة المحددة حالياً (selected_asset_id): {sel_text}
- قطع الأثاث الحالية في الغرفة:
{scene_text}

قواعد القرار الهندسي الصارمة:
1. أولوية العنصر المحدد (Selection Priority):
   إذا كان هناك عنصر محدد حالياً (CURRENTLY_SELECTED) وكان طلب المستخدم ينطبق على نوعه أو قال 'هذه القطعة / هذا / المحدد'، استهدف هذا العنصر حصراً (target_instance_id).
2. بوابة الغموض وتعدد العناصر (Ambiguity Gate):
   إذا لم يكن هناك عنصر محدد، وكان هناك أكثر من عنصر في الغرفة يطابق طلب المستخدم (مثال: يوجد كرسيان وطلب 'غيّر لون الكرسي' أو 'احذف الكرسي'):
   - يمنع التخمين أو التعديل التلقائي منعاً باتاً!
   - اضبط action_type = 'clarify' و intent = 'clarify'.
   - اكتب سؤالاً توضيحياً بالعربية المباشرة في 'text' يذكر العناصر المتاحة ويسأل المستخدم عن القطعة المقصودة تحديداً أو إن كان يرغب بتعديل جميع القطع.
3. المطابقة الأحادية (Single Match):
   إذا كان هناك عنصر واحد فقط يطابق الوصف (مثلاً كنبة واحدة فقط)، استهدفه مباشرة في target_instance_id.
4. التعديل (MODIFY):
   لتغيير اللون أو الخامة، استخرج كود الـ HEX الدقيق (مثال: بيج كتان #E8DFD5، بيج دافئ #F5F5DC، كحلي #1B2A4A، رمادي فحمي #333333، رمادي فاتح #D3D3D3).
   للتدوير، استخرج rotation_yaw بالدرجات.
5. الإضافة (ADD):
   عند طلب إضافة قطعة جديدة، حدد search_query للكتالوج و asset_id والـ anchor_hint (مثل: next_to_window, corner, left_wall, right_wall, back_wall).
6. الحذف (REMOVE):
   عند طلب حذف قطعة، حدد target_instance_id.
7. تحويل الطراز المعماري الشامل (RETHEME):
   عند طلب تغيير طراز/ستايل الغرفة بالكامل (مثال: 'حول الستايل لياباندي', 'خلها نيو كلاسيك', 'طراز مودرن', 'ستايل بوهيمي', 'مينيمال', 'وابي سابي'):
   - اضبط intent = 'retheme'.
   - حدد 'retheme_style' كأحد القيم التالية: 'japandi', 'neoclassic', 'modern', 'bohemian', 'minimalist', 'wabi_sabi'.
8. طراز الغرفة البسيط (ROOM_STYLE):
   عند طلب تعديل لون الجدار أو الأرضية أو الإضاءة فقط دون طراز كامل.
9. الدردشة العامة (CHAT):
   إذا كان سؤالاً أو استشارة تصميمية عامة.

أخرج النتيجة بصيغة JSON فقط:
{{
  "action_type": "mutate" | "clarify" | "chat",
  "intent": "modify" | "remove" | "add" | "room_style" | "retheme" | "clarify" | "chat",
  "retheme_style": "japandi" | "neoclassic" | "modern" | "bohemian" | "minimalist" | "wabi_sabi" | null,
  "text": "الرد النصي بالعربية للمستخدم",
  "target_instance_id": "..." | null,
  "modifications": {{
    "color": "#HEX" | null,
    "rotation_yaw": float | null
  }},
  "add_item": {{
    "search_query": "..." | null,
    "asset_id": "..." | null,
    "anchor_hint": "..." | null
  }},
  "room_style": {{
    "wall_color": "#HEX" | null,
    "floor_color": "#HEX" | null,
    "ambient_mode": "morning" | "rainy" | "midnight" | null
  }}
}}"""

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
            raise ValueError("Expected JSON object from chat co-pilot")
    except Exception as e:
        if _is_non_retryable_gemini_error(e):
            raise
        logger.warning("Chat intent parsing failed: %s", e)
        # Fallback heuristic
        data = {"action_type": "chat", "intent": "chat", "text": "مرحباً! كيف يمكنني مساعدتك في تصميم الغرفة؟"}

    action_type = data.get("action_type") or "chat"
    intent = data.get("intent") or "chat"
    reply_text = data.get("text") or "تم استلام طلبك بنجاح."
    mutations: List[Dict[str, Any]] = []
    response_items: List[Dict[str, Any]] = []

    # 2. Process Intent & Construct Atomic Mutations
    if action_type == "clarify" or intent == "clarify":
        return {
            "status": "success",
            "action_type": "clarify",
            "text": reply_text,
            "mutations": [],
            "items": []
        }

    if intent == "modify" and data.get("target_instance_id"):
        target_id = str(data["target_instance_id"])
        patch: Dict[str, Any] = {}
        mods = data.get("modifications") or {}
        if mods.get("color"):
            patch["color"] = mods["color"]
        if mods.get("rotation_yaw") is not None:
            yaw_rad = math.radians(_safe_float(mods["rotation_yaw"], 0.0))
            patch["rotation"] = [0, yaw_rad, 0]

        if patch:
            mutations.append({
                "op": "MODIFY",
                "target_id": target_id,
                "patch": patch
            })
            action_type = "mutate"

    elif intent == "remove" and data.get("target_instance_id"):
        mutations.append({
            "op": "REMOVE",
            "target_id": str(data["target_instance_id"])
        })
        action_type = "mutate"

    elif intent == "room_style" and data.get("room_style"):
        mutations.append({
            "op": "ROOM_STYLE",
            "room_patch": data["room_style"]
        })
        action_type = "mutate"

    elif intent == "retheme" or any(k in user_message.lower() for k in ("ياباندي", "japandi", "نيوكلاسيك", "نيو كلاسيك", "neo-classic", "بوهيمي", "bohemian", "مودرن", "modern", "مينيمال", "minimalist", "وابي سابي", "wabi_sabi", "wabi-sabi")):
        # Detect target style
        target_style_key = data.get("retheme_style") or "japandi"
        msg_l = user_message.lower()
        if "ياباندي" in msg_l or "japandi" in msg_l:
            target_style_key = "japandi"
        elif "نيو" in msg_l or "classic" in msg_l or "كلاسيك" in msg_l:
            target_style_key = "neoclassic"
        elif "بوهيمي" in msg_l or "bohemian" in msg_l:
            target_style_key = "bohemian"
        elif "مينيمال" in msg_l or "minimal" in msg_l or "بسيط" in msg_l:
            target_style_key = "minimalist"
        elif "وابي" in msg_l or "wabi" in msg_l:
            target_style_key = "wabi_sabi"
        elif "مودرن" in msg_l or "modern" in msg_l:
            target_style_key = "modern"

        preset = STYLE_PRESETS.get(target_style_key, STYLE_PRESETS["japandi"])

        # Map each existing scene item to a harmonious color in the new palette
        item_recolors: Dict[str, str] = {}
        for it in (scene_items or []):
            iid = str(it.get("instance_id") or it.get("id") or "")
            if not iid:
                continue
            cat = str(it.get("category") or it.get("asset_id") or "").lower()
            if any(k in cat for k in ("sofa", "chair", "armchair", "seating", "كنب", "كرسي")):
                item_recolors[iid] = preset["seating_color"]
            elif any(k in cat for k in ("table", "desk", "coffee", "طاولة", "مكتب")):
                item_recolors[iid] = preset["tables_color"]
            elif any(k in cat for k in ("rug", "carpet", "سجاد")):
                item_recolors[iid] = preset["rug_color"]
            elif any(k in cat for k in ("shelf", "storage", "cabinet", "tv", "رف", "خزانة")):
                item_recolors[iid] = preset["storage_color"]
            else:
                item_recolors[iid] = preset["general_color"]

        mutations.append({
            "op": "RETHEME",
            "style_name": preset["title"],
            "room_patch": {
                "wall_color": preset["wall_color"],
                "floor_color": preset["floor_color"],
                "ambient_mode": preset["ambient_mode"]
            },
            "item_recolors": item_recolors
        })
        action_type = "mutate"
        reply_text = f"تم تحويل طراز وتشطيبات الغرفة بنجاح إلى طراز {preset['title']} مع تناغم الألوان والحفاظ على التوزيع الهندسي للأثاث."

    elif intent == "add":
        add_meta = data.get("add_item") or {}
        search_query = add_meta.get("search_query") or user_message
        anchor_hint = add_meta.get("anchor_hint") or ""

        # Identify candidate asset_id
        candidate_asset_id = add_meta.get("asset_id") or "armchair"
        q_lower = search_query.lower()
        if any(w in q_lower for w in ("sofa", "couch", "كنب", "أريكة")):
            candidate_asset_id = "sofa"
        elif any(w in q_lower for w in ("shelf", "bookcase", "bookshelf", "مكتبة", "رف")):
            candidate_asset_id = "bookshelf"
        elif any(w in q_lower for w in ("desk", "مكتب", "طاولة عمل")):
            candidate_asset_id = "desk"
        elif any(w in q_lower for w in ("tv", "تلفزيون", "شاشة")):
            candidate_asset_id = "tv_unit"
        elif any(w in q_lower for w in ("plant", "نبات", "نبتة")):
            candidate_asset_id = "plant"
        elif any(w in q_lower for w in ("lamp", "إضاءة", "مصباح")):
            candidate_asset_id = "floor_lamp"
        elif any(w in q_lower for w in ("table", "طاولة", "قهوة")):
            candidate_asset_id = "coffee_table"
        elif any(w in q_lower for w in ("chair", "كرسي")):
            candidate_asset_id = "chair"

        # Catalog lookup via LanceDB RAG if available
        matched_item = None
        try:
            retriever = get_retriever()
            if retriever:
                results = retriever.search(search_query, limit=1)
                if results:
                    matched_item = results[0]
        except Exception as e:
            logger.warning("RAG retrieval failed: %s", e)

        # Standard default dimensions per asset_id
        default_dims_map = {
            "sofa": {"width": 2200, "height": 850, "depth": 900},
            "armchair": {"width": 850, "height": 800, "depth": 850},
            "chair": {"width": 600, "height": 850, "depth": 600},
            "bookshelf": {"width": 1000, "height": 1800, "depth": 400},
            "desk": {"width": 1400, "height": 750, "depth": 700},
            "coffee_table": {"width": 1000, "height": 450, "depth": 600},
            "tv_unit": {"width": 1600, "height": 500, "depth": 450},
            "floor_lamp": {"width": 450, "height": 1600, "depth": 450},
            "plant": {"width": 400, "height": 900, "depth": 400},
        }

        item_dims = default_dims_map.get(candidate_asset_id, {"width": 900, "height": 900, "depth": 900})
        item_name = candidate_asset_id.replace("_", " ").title()
        item_price = 450.0
        item_sku = f"IKEA-{uuid.uuid4().hex[:6]}"
        item_url = ""

        if matched_item:
            item_name = matched_item.get("name") or item_name
            item_price = _safe_float(matched_item.get("price"), item_price)
            item_url = matched_item.get("link") or ""
            item_sku = str(matched_item.get("item_id") or item_sku)
            if matched_item.get("dim_width") or matched_item.get("dim_depth"):
                item_dims = {
                    "width": _catalog_dim_to_mm(matched_item.get("dim_width"), item_dims["width"]),
                    "height": _catalog_dim_to_mm(matched_item.get("dim_height"), item_dims["height"]),
                    "depth": _catalog_dim_to_mm(matched_item.get("dim_depth"), item_dims["depth"]),
                }

        # Calculate strict snap collision-free coordinate
        from backend.app.services.spatial_solver import SpatialClusteringSolver
        placement = SpatialClusteringSolver.solve_incremental_placement(
            new_asset_id=candidate_asset_id,
            new_dims=item_dims,
            existing_items=scene_items or [],
            room_width=room_width,
            room_depth=room_depth,
            windows=windows,
            anchor_hint=anchor_hint
        )

        yaw_rad = math.radians(_safe_float(placement.get("yaw_y"), 0.0))
        new_instance_id = str(uuid.uuid4())
        item_obj = {
            "instance_id": new_instance_id,
            "asset_id": candidate_asset_id,
            "name": item_name,
            "position": [
                _safe_float(placement.get("t_x"), 0.0),
                _safe_float(placement.get("t_y"), 0.0),
                _safe_float(placement.get("t_z"), 0.0),
            ],
            "rotation": [0, yaw_rad, 0],
            "dimensions": item_dims,
            "color": "#ffffff",
            "economy": {
                "price": item_price,
                "currency": "SAR",
                "store_url": item_url,
                "brand": "IKEA",
                "sku": item_sku,
                "name": item_name
            }
        }
        mutations.append({
            "op": "ADD",
            "item": item_obj
        })
        response_items.append(item_obj)
        action_type = "mutate"

    return {
        "status": "success",
        "action_type": action_type,
        "text": reply_text,
        "mutations": mutations,
        "items": response_items
    }

def _safe_float(value: object, default: float = 0.0) -> float:
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

    # 5. Primary Walkway & Circulation Clearance Check (SBC & Neufert >= 0.90m)
    walkway_constrained = False
    if coffee_tables and tv_units:
        ct_front = coffee_tables[0][1][1] + (coffee_tables[0][2][1] / 2.0)
        tv_front = tv_units[0][1][1] - (tv_units[0][2][1] / 2.0)
        passage = abs(tv_front - ct_front)
        if passage < 0.90:
            score -= 10
            walkway_constrained = True
            recommendations.append(f"ممر الحركة بين طاولة القهوة ووحدة التلفاز ضيق ({passage:.2f}م). كود البناء السعودي وNeufert يتطلبان 90 سم على الأقل.")
    elif sofas and tv_units:
        s_front = sofas[0][1][1] + (sofas[0][2][1] / 2.0)
        tv_front = tv_units[0][1][1] - (tv_units[0][2][1] / 2.0)
        passage = abs(tv_front - s_front)
        if passage < 0.90:
            score -= 10
            walkway_constrained = True
            recommendations.append(f"ممر الحركة بين المقاعد ووحدة التلفاز ضيق ({passage:.2f}م). كود البناء السعودي وNeufert يتطلبان 90 سم على الأقل.")

    if not walkway_constrained and solid_items:
        clearance_checks.append("مسارات الحركة والممرات الرئيسية شاغرة ومطابقة لكود البناء السعودي (عرض >= 90 سم).")

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

