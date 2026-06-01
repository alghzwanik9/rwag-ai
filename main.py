from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Any
import uuid
import os
import json
import traceback
import socket

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

from orchestrator import BlenderOrchestrator
from ai_agent import generate_layout, handle_chat_request

app = FastAPI(title="Atelier AI Orchestrator")

# Ensure outputs and assets directories exist
os.makedirs(os.path.join("frontend", "public", "outputs"), exist_ok=True)
os.makedirs(os.path.join("frontend", "public", "assets"), exist_ok=True)
app.mount("/outputs", StaticFiles(directory=os.path.join("frontend", "public", "outputs")), name="outputs")

# CORS setup
# Use CORS_ORIGINS from env if available, else allow all (useful for local dev)
cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from ai_agent import get_retriever

@app.on_event("startup")
def startup_event():
    print("Initializing global RAG Retriever...")
    get_retriever()
    print("RAG Retriever initialized successfully.")

# ── Asset Catalog ──────────────────────────────────────────────────────────────

from asset_scraper import IngestionPipeline

# Initialize the ingestion pipeline (which wraps LanceDB)
ingestion_pipeline = IngestionPipeline()

class IngestRequest(BaseModel):
    source: str = "local"
    url: str | None = None
    category: str = "seating"
    delay: float = 0.4

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

@app.post("/api/v1/assets/ingest")
async def ingest_assets(req: IngestRequest, background_tasks: BackgroundTasks):
    """Trigger the automated 3D asset ingestion pipeline."""
    background_tasks.add_task(run_ingestion_task, req)
    return {"status": "success", "message": f"Ingestion task started for source: {req.source}"}

@app.get("/api/v1/assets")
async def get_assets():
    """Return the furniture asset catalog from LanceDB."""
    records = ingestion_pipeline.get_all()
    return {"items": records, "total": len(records)}

FALLBACK_GLB_URL = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb"


def _resolve_ikea_model_url(name: str, category: str) -> str:
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

    # If the catalog metadata does not provide a real 3D model URL,
    # use a generic fallback GLB so the studio renders a real object
    # instead of a plain procedural cube.
    return FALLBACK_GLB_URL


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default

@app.get("/api/v1/ikea-catalog")
async def get_ikea_catalog(limit: int = 200):
    """Return the IKEA catalog from LanceDB 'ikea_catalog' table."""
    try:
        import lancedb
        db = lancedb.connect(".lancedb")
        if "ikea_catalog" not in db.table_names():
            return {"items": [], "total": 0}
            
        table = db.open_table("ikea_catalog")
        # Use pyarrow or pandas to get records. Limit the query to prevent massive payloads.
        records = table.search().limit(limit).to_arrow().to_pylist()
        
        results = []
        for r in records:
            name = str(r.get("name", "Unknown"))
            category = str(r.get("category", ""))
            model_url = str(r.get("model_url", "") or r.get("model_3d_url", "") or _resolve_ikea_model_url(name, category))
            model_3d_url = str(r.get("model_3d_url", "") or r.get("model_url", "") or model_url or FALLBACK_GLB_URL)
            results.append({
                "id": str(r.get("item_id", "")),
                "name": name,
                "category": category,
                "price": _safe_float(r.get("price", 0.0)),
                "dimensions": {
                    "width": _safe_float(r.get("dim_width_mm", r.get("dim_width", 0.0))),
                    "height": _safe_float(r.get("dim_height_mm", r.get("dim_height", 0.0))),
                    "depth": _safe_float(r.get("dim_depth_mm", r.get("dim_depth", 0.0)))
                },
                "link": str(r.get("link", "")),
                "short_description": str(r.get("short_description", "")),
                "model_url": model_url,
                "model_3d_url": model_3d_url,
                "thumbnail_url": str(r.get("thumbnail_url", "") or r.get("image_url", "")),
                "default_scale_x": _safe_float(r.get("default_scale_x", 1.0), 1.0),
                "default_scale_y": _safe_float(r.get("default_scale_y", 1.0), 1.0),
                "default_scale_z": _safe_float(r.get("default_scale_z", 1.0), 1.0),
            })
        return {"items": results, "total": len(results)}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/furniture")
async def get_furniture(limit: int = 200):
    """Alias for /api/v1/ikea-catalog required by the frontend"""
    return await get_ikea_catalog(limit=limit)

# ── Legacy / existing endpoints ────────────────────────────────────────────────

class RoomLayoutRequest(BaseModel):
    prompt: str
    imageBase64: str | None = None

class RecommendationRequest(BaseModel):
    current_item_id: str
    budget_left: float

class ProjectSaveRequest(BaseModel):
    name: str
    sceneId: str
    glbUrl: str
    sceneItems: List[Dict[str, Any]]
    customMaterials: Dict[str, Any]
    totalCost: float

class ProjectStateV1(BaseModel):
    roomItems: List[Dict[str, Any]]



MOCK_INVENTORY = [
    {"asset_id": "sofa", "brand": "IKEA", "price": 1200, "currency": "SAR", "store_url": "https://www.ikea.com/sa/en/p/kivik-sofa", "sku": "111.222.33"},
    {"asset_id": "sofa", "brand": "Abyat", "price": 2500, "currency": "SAR", "store_url": "https://www.abyat.com/sa/en/sofa-modern", "sku": "AB-2200"},
    {"asset_id": "sofa", "brand": "Home Centre", "price": 1800, "currency": "SAR", "store_url": "https://www.homecentre.com/sa/en/sofa", "sku": "HC-881"},
    {"asset_id": "tv_unit", "brand": "IKEA", "price": 450, "currency": "SAR", "store_url": "https://www.ikea.com/sa/en/p/lack-tv-bench", "sku": "902.432.98"},
    {"asset_id": "tv_unit", "brand": "Abyat", "price": 950, "currency": "SAR", "store_url": "https://www.abyat.com/sa/en/tv-unit-wood", "sku": "AB-TV1"},
    {"asset_id": "coffee_table", "brand": "IKEA", "price": 250, "currency": "SAR", "store_url": "https://www.ikea.com/sa/en/p/lack-coffee-table", "sku": "401.042.94"},
    {"asset_id": "coffee_table", "brand": "West Elm", "price": 1100, "currency": "SAR", "store_url": "https://www.westelm.com.sa/en/p/coffee-table", "sku": "WE-CT01"},
]

@app.get("/api/server-ip")
async def get_server_ip():
    return {"ip": get_local_ip()}

class ChatRequest(BaseModel):
    message: str

@app.post("/api/v1/chat")
def chat_endpoint(request: ChatRequest):
    try:
        payload = handle_chat_request(request.message)
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
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "text": "عذراً، حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى.",
                "items": [],
                "detail": str(e)
            }
        )


@app.post("/api/generate-room")
def generate_room(request: RoomLayoutRequest, api_request: Request):
    try:
        print(f"Generating room layout for prompt: {request.prompt}")
        
        # Call Gemini to get dynamic layout
        payload = generate_layout(request.prompt, request.imageBase64)
        
        # Transform the AI payload into the frontend's expected array format
        frontend_items = []
        if "objects" in payload:
            for obj in payload["objects"]:
                if obj.get("type") == "furniture":
                    t = obj.get("transform", {})
                    # Convert yaw_y degrees to radians for R3F
                    import math
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
        
        if "room_dimensions" in payload:
            response_data["room_dimensions"] = payload["room_dimensions"]
            
        return response_data
        
    except Exception as e:
        traceback.print_exc()
        error_str = str(e)
        if "429" in error_str or "Quota" in error_str or "exhausted" in error_str.lower():
            raise HTTPException(status_code=429, detail="تم تجاوز الحد المسموح للطلبات المجانية من الذكاء الاصطناعي. الرجاء الانتظار لمدة دقيقة والمحاولة مجدداً.")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recommendations/alternatives")
async def recommend_alternatives(request: RecommendationRequest):
    # For Sprint 3, we simulate looking up the item's asset_id based on current_item_id
    # We will assume current_item_id contains the asset_id type (e.g. "sofa_main" -> "sofa")
    asset_id_guess = "sofa" # default
    if "tv_unit" in request.current_item_id:
        asset_id_guess = "tv_unit"
    elif "coffee_table" in request.current_item_id:
        asset_id_guess = "coffee_table"
    elif "rug" in request.current_item_id:
        asset_id_guess = "rug"
        
    alternatives = []
    for item in MOCK_INVENTORY:
        if item["asset_id"] == asset_id_guess and item["price"] <= request.budget_left:
            # Generate justification
            savings = request.budget_left - item["price"]
            justification = f"توفر هذه القطعة {savings} ريال وتحافظ على نفس الطابع البصري وتناسب ميزانيتك."
            
            alternatives.append({
                "brand": item["brand"],
                "price": item["price"],
                "currency": item["currency"],
                "store_url": item["store_url"],
                "sku": item["sku"],
                "justification": justification
            })
            
            if len(alternatives) == 3:
                break
                
    return {
        "status": "success",
        "original_item_id": request.current_item_id,
        "alternatives": alternatives
    }

@app.post("/api/projects/save")
async def save_project(request: ProjectSaveRequest):
    try:
        projects_dir = os.path.join("frontend", "public", "outputs", "projects")
        os.makedirs(projects_dir, exist_ok=True)
        
        project_id = str(uuid.uuid4())
        filepath = os.path.join(projects_dir, f"{project_id}.json")
        
        project_data = {
            "id": project_id,
            "name": request.name,
            "sceneId": request.sceneId,
            "glbUrl": request.glbUrl,
            "sceneItems": request.sceneItems,
            "customMaterials": request.customMaterials,
            "totalCost": request.totalCost,
            "savedAt": __import__("datetime").datetime.now().isoformat()
        }
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(project_data, f, ensure_ascii=False, indent=2)
            
        return {"status": "success", "message": "تم الحفظ بنجاح", "project_id": project_id}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/projects")
async def list_projects():
    try:
        projects_dir = os.path.join("frontend", "public", "outputs", "projects")
        if not os.path.exists(projects_dir):
            return {"projects": []}
            
        projects = []
        for filename in os.listdir(projects_dir):
            if filename.endswith(".json"):
                with open(os.path.join(projects_dir, filename), "r", encoding="utf-8") as f:
                    data = json.load(f)
                    projects.append({
                        "id": data["id"],
                        "name": data.get("name", "مشروع بدون اسم"),
                        "savedAt": data.get("savedAt", ""),
                        "totalCost": data.get("totalCost", 0)
                    })
        # Sort by date descending
        projects.sort(key=lambda x: x["savedAt"], reverse=True)
        return {"projects": projects}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/projects/{project_id}")
async def load_project(project_id: str):
    try:
        filepath = os.path.join("frontend", "public", "outputs", "projects", f"{project_id}.json")
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="المشروع غير موجود")
            
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/projects/{project_id}/save")
async def save_project_v1(project_id: str, request: ProjectStateV1):
    try:
        projects_dir = os.path.join("frontend", "public", "outputs", "projects_v1")
        os.makedirs(projects_dir, exist_ok=True)
        filepath = os.path.join(projects_dir, f"{project_id}.json")
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(request.model_dump(), f, ensure_ascii=False, indent=2)
            
        return {"status": "success", "message": "تم الحفظ بنجاح", "project_id": project_id}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/projects/{project_id}")
async def load_project_v1(project_id: str):
    try:
        filepath = os.path.join("frontend", "public", "outputs", "projects_v1", f"{project_id}.json")
        if not os.path.exists(filepath):
            return {"roomItems": []} # Return empty if new project
            
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
