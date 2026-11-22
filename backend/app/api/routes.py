import math
import uuid
import socket
import traceback
from typing import List, Dict, Any

from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from fastapi.responses import JSONResponse

from backend.app.schemas import (
    IngestRequest,
    RoomLayoutRequest,
    RecommendationRequest,
    ChatRequest,
    StudioGenerateRequest,
    SpatialAuditRequest,
)
from backend.app.services.rag_service import (
    _get_table_names,
    get_ikea_catalog_data,
    find_budget_alternatives,
    get_all_standards_catalog
)
from backend.app.services.ai_service import (
    generate_room_layout,
    process_chat_message,
    audit_room_layout
)
from backend.app.services.scraper_service import get_ingestion_pipeline
from backend.app.services.image_gen_service import generate_studio_image



router = APIRouter()
ingestion_pipeline = get_ingestion_pipeline()

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        ip_addr = s.getsockname()[0]
    except Exception:
        ip_addr = '127.0.0.1'
    finally:
        s.close()
    return ip_addr

@router.get("/api/server-ip")
async def get_server_ip():
    return {"ip": get_local_ip()}

def run_ingestion_task(req: IngestRequest):
    try:
        ingestion_pipeline.run(
            source=req.source,
            url=req.url,
            category=req.category,
            delay=req.delay
        )
    except Exception as e:
        print(f"Ingestion failed: {e}")

@router.post("/api/v1/assets/ingest")
async def ingest_assets(req: IngestRequest, background_tasks: BackgroundTasks):
    """Trigger the automated 3D asset ingestion pipeline."""
    background_tasks.add_task(run_ingestion_task, req)
    return {"status": "success", "message": f"Ingestion task started for source: {req.source}"}

@router.get("/api/v1/assets")
async def get_assets():
    """Return the furniture asset catalog from LanceDB."""
    records = ingestion_pipeline.get_all()
    return {"items": records, "assets": records, "total": len(records)}

@router.get("/api/v1/ikea-catalog")
async def get_ikea_catalog(limit: int = 200):
    """Return the IKEA catalog from LanceDB 'ikea_catalog' table."""
    try:
        return get_ikea_catalog_data(limit=limit)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/furniture")
async def get_furniture(limit: int = 200):
    """Alias for /api/v1/ikea-catalog required by the frontend."""
    return await get_ikea_catalog(limit=limit)

def _safe_float(value: Any, default: float = 0.0) -> float:
    if value is None or isinstance(value, bool):
        return default
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return default
    return parsed if math.isfinite(parsed) else default


def _normalize_dimensions_mm(dims: Any) -> Dict[str, int]:
    """Normalize furniture dimensions to canonical millimeters {width, height, depth}.

    Supports either:
    - {length, width, height} (Gemini schema: length=X width, width=Z depth, height=Y height)
    - {width, height, depth} (catalog schema: width=X, height=Y, depth=Z)
    Values with max <= 20 are treated as meters and converted via * 1000; larger values are kept as mm.
    """
    defaults = {"width": 1000, "height": 800, "depth": 800}
    if not isinstance(dims, dict) or not dims:
        return dict(defaults)

    if "length" in dims and dims.get("length") is not None:
        raw_w = _safe_float(dims.get("length"), 0.0)
        raw_h = _safe_float(dims.get("height"), 0.0)
        raw_d = _safe_float(
            dims.get("width") if dims.get("width") is not None else dims.get("depth"),
            0.0,
        )
    else:
        raw_w = _safe_float(dims.get("width"), 0.0)
        raw_h = _safe_float(dims.get("height"), 0.0)
        raw_d = _safe_float(dims.get("depth"), 0.0)

    positive_vals = [v for v in (raw_w, raw_h, raw_d) if v > 0.0]
    scale = 1000.0 if (positive_vals and max(positive_vals) <= 20.0) else 1.0

    return {
        "width": round(raw_w * scale) if raw_w > 0.0 else defaults["width"],
        "height": round(raw_h * scale) if raw_h > 0.0 else defaults["height"],
        "depth": round(raw_d * scale) if raw_d > 0.0 else defaults["depth"],
    }


def _normalize_window(obj: Dict[str, Any], room_dims: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize an AI window Object3D into a RoomWindow-compatible payload."""
    room_w = max(1.0, _safe_float(room_dims.get("width"), 5.0))
    room_d = max(1.0, _safe_float(room_dims.get("depth"), 5.0))
    t = obj.get("transform") or {}
    tx = _safe_float(t.get("t_x"), 0.0)
    ty = _safe_float(t.get("t_y"), 0.0)
    tz = _safe_float(t.get("t_z"), -room_d / 2.0)
    yaw_deg = _safe_float(t.get("yaw_y"), 0.0)

    dims_mm = _normalize_dimensions_mm(obj.get("dimensions"))
    span_m = max(dims_mm["width"], dims_mm["depth"]) / 1000.0
    height_m = dims_mm["height"] / 1000.0

    dist_left = abs(tx + room_w / 2.0)
    dist_back = abs(tz + room_d / 2.0)
    is_left_wall = (dist_left < dist_back) or (abs(abs(yaw_deg) % 180.0 - 90.0) < 15.0 and dist_left <= dist_back + 0.5)
    wall = "left" if is_left_wall else "back"

    if wall == "back":
        raw_offset = tx / max(room_w / 2.0, 1.0)
    else:
        raw_offset = tz / max(room_d / 2.0, 1.0)
    position_offset = round(max(-1.0, min(1.0, raw_offset)), 3)

    if span_m < 1.25:
        size = "small"
    elif span_m >= 2.0:
        size = "large"
    else:
        size = "medium"

    # RoomWindow.height in useSceneStore.ts is a 0.5..1.0 ratio of wallHeight (default 0.55)
    wall_height_m = 3.0
    center_ratio = ((ty + height_m / 2.0) / wall_height_m) if ty > 0.0 else 0.55
    height_ratio = round(max(0.5, min(1.0, center_ratio)), 2)

    return {
        "id": str(obj.get("id") or f"win_{uuid.uuid4().hex[:8]}"),
        "wall": wall,
        "position": [tx, ty, tz],
        "width": round(span_m, 2),
        "height": height_ratio,
        "height_m": round(height_m, 2),
        "size": size,
        "positionOffset": position_offset,
        "curtain": "sheer",
        "curtainColor": "#f0ece4",
        "isOpen": True,
    }


@router.post("/api/v1/chat")
def chat_endpoint(request: ChatRequest):
    try:
        payload = process_chat_message(request.message)
        frontend_items = []
        if "items" in payload:
            for obj in payload["items"]:
                t = obj.get("transform", {})
                yaw_rad = math.radians(_safe_float(t.get("yaw_y"), 0.0))
                item = {
                    "instance_id": str(uuid.uuid4()),
                    "asset_id": obj.get("asset_id", ""),
                    "position": [
                        _safe_float(t.get("t_x"), 0.0),
                        _safe_float(t.get("t_y"), 0.0),
                        _safe_float(t.get("t_z"), 0.0),
                    ],
                    "rotation": [0, yaw_rad, 0],
                    "dimensions": _normalize_dimensions_mm(obj.get("dimensions")),
                    "economy": obj.get("economy"),
                }
                frontend_items.append(item)

        return {
            "status": "success",
            "text": payload.get("text", ""),
            "items": frontend_items
        }
    except Exception as e:
        traceback.print_exc()
        error_str = str(e)
        if "429" in error_str or "quota" in error_str.lower() or "exhausted" in error_str.lower():
            return JSONResponse(
                status_code=429,
                content={
                    "status": "error",
                    "text": "تم تجاوز الحد المسموح للطلبات المجانية من الذكاء الاصطناعي. الرجاء الانتظار لمدة دقيقة والمحاولة مجدداً.",
                    "items": [],
                    "detail": error_str,
                },
            )
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "text": "عذراً، حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى.",
                "items": [],
                "detail": error_str
            }
        )

@router.post("/api/generate-room")
def generate_room(request: RoomLayoutRequest, api_request: Request):
    try:
        print(f"Generating room layout for prompt: {request.prompt}")
        payload = generate_room_layout(request.prompt, request.imageBase64)

        room_dims = payload.get("room_dimensions") if isinstance(payload.get("room_dimensions"), dict) else {}
        frontend_items = []
        windows = []
        if "objects" in payload:
            for obj in payload["objects"]:
                obj_type = obj.get("type")
                if obj_type == "furniture":
                    t = obj.get("transform", {})
                    yaw_rad = math.radians(_safe_float(t.get("yaw_y"), 0.0))

                    item = {
                        "instance_id": str(uuid.uuid4()),
                        "asset_id": obj.get("asset_id", ""),
                        "position": [
                            _safe_float(t.get("t_x"), 0.0),
                            _safe_float(t.get("t_y"), 0.0),
                            _safe_float(t.get("t_z"), 0.0),
                        ],
                        "rotation": [0, yaw_rad, 0],
                        "dimensions": _normalize_dimensions_mm(obj.get("dimensions")),
                        "economy": obj.get("economy")
                    }
                    frontend_items.append(item)
                elif obj_type == "window":
                    windows.append(_normalize_window(obj, room_dims))

        response_data = {
            "status": "success",
            "items": frontend_items,
            "windows": windows,
            "ambient_mode": payload.get("ambient_mode", "morning"),
        }
        for key in ["room_dimensions", "concept_philosophy", "architectural_references", "spatial_layout_rules", "wall_color", "floor_color"]:
            if key in payload:
                response_data[key] = payload[key]

        return response_data

    except Exception as e:
        traceback.print_exc()
        error_str = str(e)
        if "429" in error_str or "quota" in error_str.lower() or "exhausted" in error_str.lower():
            raise HTTPException(status_code=429, detail="تم تجاوز الحد المسموح للطلبات المجانية من الذكاء الاصطناعي. الرجاء الانتظار لمدة دقيقة والمحاولة مجدداً.")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/recommendations/alternatives")
async def recommend_alternatives(request: RecommendationRequest):
    """Find smart budget alternatives from LanceDB for the current item."""
    try:
        alternatives = find_budget_alternatives(
            current_item_id=request.current_item_id,
            budget_left=request.budget_left
        )
        return {"status": "success", "alternatives": alternatives}
    except Exception as e:
        traceback.print_exc()
        return {"status": "error", "alternatives": [], "detail": str(e)}

@router.post("/api/v1/studio/generate")
async def studio_generate(request: StudioGenerateRequest):
    """Generate high-end 2D interior visualization via Fal.ai Flux Schnell."""
    try:
        result = await generate_studio_image(
            prompt=request.prompt,
            base_image_url=request.base_image_url,
            settings=request.settings
        )
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/v1/db-check")
async def db_check():
    """Health check for LanceDB and catalog index."""
    try:
        from backend.app.config import LANCEDB_DIR
        import lancedb
        db = lancedb.connect(str(LANCEDB_DIR))
        tables = _get_table_names(db)
        table_stats = {}
        for t in tables:
            tbl = db.open_table(t)
            table_stats[t] = tbl.count_rows()
        return {
            "status": "healthy",
            "lancedb_dir": str(LANCEDB_DIR),
            "tables": tables,
            "counts": table_stats
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

@router.post("/api/v1/spatial-audit")
def spatial_audit_endpoint(request: SpatialAuditRequest):
    """Run an architectural clearance, density, and anthropometric audit on the active 3D scene."""
    try:
        result = audit_room_layout(
            items=request.items,
            room_width=request.room_width,
            room_depth=request.room_depth
        )
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/v1/architectural-standards")
def architectural_standards_catalog():
    """Return the structured architectural design standards catalog."""
    try:
        standards = get_all_standards_catalog()
        return {"status": "success", "standards": standards, "total": len(standards)}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


