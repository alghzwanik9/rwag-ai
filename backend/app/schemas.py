from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Literal

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

class SceneItemContext(BaseModel):
    instance_id: str
    asset_id: str
    name: Optional[str] = None
    category: Optional[str] = None
    position: Optional[List[float]] = None
    rotation: Optional[List[float]] = None
    dimensions: Optional[Dict[str, Any]] = None
    color: Optional[str] = None
    brand: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = "SAR"
    store_url: Optional[str] = None

class SceneMutation(BaseModel):
    op: str  # "MODIFY", "REMOVE", "ADD", "ROOM_STYLE"
    target_id: Optional[str] = None
    patch: Optional[Dict[str, Any]] = None
    item: Optional[Dict[str, Any]] = None
    room_patch: Optional[Dict[str, Any]] = None

class ChatRequest(BaseModel):
    message: str
    scene_items: Optional[List[SceneItemContext]] = None
    selected_asset_id: Optional[str] = None
    room_width: Optional[float] = 5.0
    room_depth: Optional[float] = 5.0
    room_shape: Optional[str] = "single"
    windows: Optional[List[Dict[str, Any]]] = None
    wall_color: Optional[str] = None
    floor_color: Optional[str] = None

class StudioGenerateRequest(BaseModel):
    prompt: str
    base_image_url: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None

class SpatialAuditRequest(BaseModel):
    items: List[Dict[str, Any]]
    room_width: float = 5.0
    room_depth: float = 5.0

class StudioRenderFrom3DRequest(BaseModel):
    image_base64: str
    depth_map_base64: Optional[str] = None
    room_style: Optional[str] = "Modern Luxury"
    wall_color: Optional[str] = None
    floor_color: Optional[str] = None
    ambient_mode: Optional[str] = "morning"
    items: Optional[List[Dict[str, Any]]] = None


class ExtractedOpening(BaseModel):
    wall: Literal["back", "left", "right", "front"] = Field(
        description="Perimeter wall hosting the opening: back (North), left (West), right (East), or front (South)"
    )
    offset_ratio: float = Field(
        default=0.0,
        description="Position offset along the wall normalized from -1.0 to 1.0 (0.0 is center)"
    )
    width_m: float = Field(
        default=0.9,
        description="Width of opening in meters (e.g. 0.8m–1.2m for doors, 1.2m–3.0m for windows)"
    )
    type: Literal["door", "window"] = Field(description="Opening classification: door or window")
    height_m: Optional[float] = Field(
        default=None,
        description="Vertical height in meters (e.g. 2.1m for doors, 1.6m for windows)"
    )


class FloorplanExtractionResult(BaseModel):
    room_type: str = Field(
        default="living room",
        description="Identified functional room type (e.g., living room, bedroom, majlis, office, dining, studio)"
    )
    confidence: float = Field(
        default=0.85,
        description="Confidence score for the extraction between 0.0 and 1.0"
    )
    width: float = Field(
        default=5.0,
        description="Extracted room width in meters (X axis, clamped 2.5m–12.0m)"
    )
    depth: float = Field(
        default=5.0,
        description="Extracted room depth in meters (Z axis, clamped 2.5m–12.0m)"
    )
    height: float = Field(
        default=2.8,
        description="Estimated ceiling/wall height in meters (clamped 2.4m–4.5m)"
    )
    openings: List[ExtractedOpening] = Field(
        default_factory=list,
        description="List of detected architectural openings (doors and windows)"
    )
    detected_furniture: Optional[List[str]] = Field(
        default_factory=list,
        description="Optional list of detected furniture items or functional zones marked on the plan"
    )
    room_shape: Optional[Literal["single", "corridor_room", "open_plan", "l_shape"]] = Field(
        default="single",
        description="Architectural room footprint shape"
    )
    summary_ar: Optional[str] = Field(
        default=None,
        description="Arabic summary of the extracted blueprint structure"
    )
    summary_en: Optional[str] = Field(
        default=None,
        description="English technical summary of the extracted blueprint structure"
    )


class FloorplanTo3DResponse(BaseModel):
    status: str = "success"
    room_dimensions: Dict[str, float] = Field(
        description="Final normalized room dimensions {'width': w, 'depth': d, 'height': h}"
    )
    room_type: str = Field(description="Identified room category")
    confidence: float = Field(description="Vision model confidence score")
    room_shape: str = Field(default="single")
    openings: List[ExtractedOpening] = Field(default_factory=list)
    windows: List[Dict[str, Any]] = Field(default_factory=list)
    doors: List[Dict[str, Any]] = Field(default_factory=list)
    items: List[Dict[str, Any]] = Field(default_factory=list)
    spatial_audit: Optional[Dict[str, Any]] = None
    auto_corrected: Optional[bool] = False
    concept_philosophy: Optional[str] = None
    wall_color: Optional[str] = "#EDE8E0"
    floor_color: Optional[str] = "#C8B29B"
    ambient_mode: Optional[str] = "morning"
    summary_ar: Optional[str] = None
    summary_en: Optional[str] = None




