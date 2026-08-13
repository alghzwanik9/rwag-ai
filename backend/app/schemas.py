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
