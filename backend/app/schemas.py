from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class IngestRequest(BaseModel):
    source: str = "local"
    url: Optional[str] = None
    category: str = "seating"
    delay: float = 0.4

class RoomLayoutRequest(BaseModel):
    prompt: str
    imageBase64: Optional[str] = None

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

class ChatRequest(BaseModel):
    message: str

class StudioGenerateRequest(BaseModel):
    prompt: str
    base_image_url: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None

class SpatialAuditRequest(BaseModel):
    items: List[Dict[str, Any]]
    room_width: float = 5.0
    room_depth: float = 5.0


