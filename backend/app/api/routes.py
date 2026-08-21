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

@router.post("/api/v1/chat")
def chat_endpoint(request: ChatRequest):
    try:
        payload = process_chat_message(request.message)
        frontend_items = []
        if "items" in payload:
            for obj in payload["items"]:
                t = obj.get("transform", {})
                item = {
                    "instance_id": str(uuid.uuid4()),
                    "asset_id": obj.get("asset_id", ""),
                    "position": [t.get("t_x", 0), t.get("t_y", 0), t.get("t_z", 0)],
                    "rotation": [0, t.get("yaw_y", 0), 0],
                    "dimensions": obj.get("dimensions"),
                    "economy": obj.get("economy")
                }
                frontend_items.append(item)
                
        return {
            "status": "success",
            "text": payload.get("text", ""),
            "items": frontend_items
        }
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "text": "عذراً، حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى.",
                "items": [],
                "detail": str(e)
            }
        )

@router.post("/api/generate-room")
def generate_room(request: RoomLayoutRequest, api_request: Request):
    try:
        print(f"Generating room layout for prompt: {request.prompt}")
        payload = generate_room_layout(request.prompt, request.imageBase64)
        
        frontend_items = []
        if "objects" in payload:
            for obj in payload["objects"]:
                if obj.get("type") == "furniture":
                    t = obj.get("transform", {})
                    yaw_rad = math.radians(t.get("yaw_y", 0))
                    
                    item = {
                        "instance_id": str(uuid.uuid4()),
                        "asset_id": obj.get("asset_id", ""),
                        "position": [t.get("t_x", 0), t.get("t_y", 0), t.get("t_z", 0)],
                        "rotation": [0, yaw_rad, 0],
                        "dimensions": obj.get("dimensions"),
                        "economy": obj.get("economy")
                    }
                    frontend_items.append(item)
        
        response_data = {"status": "success", "items": frontend_items}
        for key in ["room_dimensions", "concept_philosophy", "architectural_references", "spatial_layout_rules", "wall_color", "floor_color"]:
            if key in payload:
                response_data[key] = payload[key]
            
        return response_data

    except Exception as e:
        traceback.print_exc()
        error_str = str(e)
        if "429" in error_str or "Quota" in error_str or "exhausted" in error_str.lower():
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
        tables = db.table_names()
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


