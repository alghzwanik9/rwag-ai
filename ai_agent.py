import os
import sys
import json
import math

# Fix for Windows console encoding
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

from google import genai
from google.genai import types
from dotenv import load_dotenv

from pydantic import BaseModel, Field
from typing import List

load_dotenv()

# Set environment variables
api_key = (os.environ.get("GEMINI_API_KEY") or "").strip()
os.environ["GOOGLE_API_KEY"] = api_key
os.environ["GEMINI_API_KEY"] = api_key


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

class Object3D(BaseModel):
    id: str = Field(description="Unique string identifier for this instance (e.g. sofa_main)")
    type: str = Field(description="Type of object. Must be one of: 'furniture', 'window', 'wall'")
    asset_id: str = Field(description="Asset ID. For 'furniture', must be one of: sofa, coffee_table, tv_unit, plant, armchair, bookshelf, rug")
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
    room_dimensions: RoomDimensions
    objects: List[Object3D]

from asset_scraper import IngestionPipeline

def get_dynamic_asset_registry():
    try:
        pipeline = IngestionPipeline()
        assets = pipeline.get_all()
        registry = [a["asset_id"] for a in assets]
        return registry if registry else ["sofa", "coffee_table", "tv_unit", "plant", "armchair", "bookshelf", "rug"]
    except Exception as e:
        print(f"Failed to load dynamic registry: {e}")
        return ["sofa", "coffee_table", "tv_unit", "plant", "armchair", "bookshelf", "rug"]
# Initialize the modern google-genai client
_client = genai.Client(api_key=api_key) if api_key else None

def refine_prompt_with_groq(user_prompt: str) -> str:
    """Reads a user prompt (in Arabic or English), translates and expands it into a highly detailed English layout specification."""
    try:
        from groq import Groq
        groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        
        system_prompt = (
            "You are an expert interior design AI assistant.\n"
            "Your job is to read a user's room design prompt (which may be in Arabic or English) and convert it into a highly detailed, professional, structured design specification in English.\n\n"
            "Guidelines:\n"
            "1. Translate any Arabic request to English.\n"
            "2. Expand the design logically: specify exact furniture items, color choices (following the 60-30-10 rule: 60% dominant neutral wall/floor, 30% furniture, 10% accents), lighting mood, and relative spatial layout (e.g. coffee table in front of sofa, TV unit opposite the sofa).\n"
            "3. Limit the items to our allowed asset registry: sofa, coffee_table, tv_unit, plant, armchair, bookshelf, rug, window.\n"
            "4. Describe the color palette in Hex codes so the executor can apply it precisely.\n"
            "5. Do NOT output any code or JSON. Just output a clean, descriptive paragraph in English describing the layout, dimensions, colors, and positioning details for the generator."
        )
        
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        refined_prompt = response.choices[0].message.content.strip()
        print(f"Refined prompt generated by Groq: {refined_prompt}")
        return refined_prompt
    except Exception as e:
        print(f"Failed to refine prompt with Groq: {e}. Using original user prompt.")
        return user_prompt

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
        
        if _client is None:
            raise RuntimeError("GEMINI_API_KEY not configured")

        response = _client.models.generate_content(
            model="gemini-2.5-flash",
            contents=parts
        )
        return response.text.strip()
    except Exception as e:
        print(f"Vision analysis failed: {e}")
        return ""

def generate_layout(prompt: str, image_b64: str | None = None, schema_path: str = "schema.json") -> dict:
    """Fast, direct Gemini 2.5 Flash architectural generation with Neufert standards and structured output."""
    
    # 1. Vision preprocessing
    image_context = ""
    if image_b64:
        print("Analyzing image context using vision model...")
        analyzed_desc = analyze_image_layout(image_b64)
        if analyzed_desc:
            image_context = f"\nAdditional Room Image Context:\n{analyzed_desc}\n"
            print(f"Vision context gathered: {analyzed_desc[:100]}...")

    asset_registry = get_dynamic_asset_registry()
    
    # Retrieve relevant architectural standards context
    from backend.app.services.rag_service import get_relevant_standards_context
    standards_context = get_relevant_standards_context(prompt)

    system_instruction = (
        "You are an elite Senior Architectural Spatial Planner & Interior Design AI adhering strictly to Neufert and Saudi Building Code standards.\n"
        "Your task is to analyze the user request and generate a complete, mathematically precise 3D room layout.\n\n"
        "STRICT SPATIAL AND SCHEMA CONSTRAINTS:\n"
        "1. REALISTIC ROOM SIZE: Default to room dimensions (width and depth between 4m and 6m, e.g., 5x5m). The floor is centered at (t_x: 0, t_y: 0, t_z: 0).\n"
        "2. DIORAMA MODE: Always generate exactly two walls at the back perimeters to frame the scene (e.g., North wall at z=-2.5, West wall at x=-2.5). "
        "NEVER enclose the room fully. Leave the front (South and East sides) open for the camera.\n"
        "3. STRICT COORDINATE BOUNDARIES: ALL generated objects MUST have their [t_x, t_z] coordinates strictly inside the room's dimensions. For a 5x5 room, no object coordinates can be < -2.5 or > 2.5.\n"
        "4. FLOOR ANCHOR: All objects MUST have transform.t_y = 0.0. Never let objects float or sink.\n"
        "5. WALL SNAPPING: Objects like TV units, cabinets, bookshelves, or beds MUST have their back edge aligned flush with a perimeter wall without intersecting it.\n"
        "6. WINDOW: Generate exactly ONE large floor-to-ceiling window mesh flush against one of the walls (type must be 'window').\n"
        "7. SPACING & CLEARANCES: Furniture MUST face logical directions (yaw_y: 0, 90, 180, or -90 degrees). Maintain at least 0.9m primary walkways and 0.4m between coffee table and sofa.\n"
        f"8. ASSET REGISTRY: For 'furniture' objects, choose asset_id strictly from this list: {json.dumps(asset_registry)}. Avoid overlaps.\n"
        "9. 60-30-10 COLOR HARMONY: 60% dominant neutral wall/floor (warm limestone, beige limewash), 30% furniture body, 10% accents (aged brass, deep terracotta, walnut).\n"
        "10. SMART ECONOMY: Generate realistic price in SAR (currency 'SAR'), store details, and SKU from real brands (IKEA, Abyat, West Elm).\n\n"
        f"ARCHITECTURAL & ERGONOMIC CONTEXT:\n{standards_context}\n"
    )

    user_full_prompt = f"User Request: {prompt}\n{image_context}\nGenerate the complete 3D interior design layout conforming to all constraints."

    print(f"Generating direct 3D architectural layout for: {prompt[:80]}...")

    try:
        if _client is None:
            raise RuntimeError("GEMINI_API_KEY not configured")

        response = _client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[user_full_prompt],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=FullDesignOutput,
                temperature=0.3
            )
        )
        
        raw_payload = json.loads(response.text.strip())
        validated = FullDesignOutput.model_validate(raw_payload)
        payload = validated.model_dump()
        payload["stage"] = 1

        wall_color = raw_payload.get("wall_color") if isinstance(raw_payload, dict) else None
        floor_color = raw_payload.get("floor_color") if isinstance(raw_payload, dict) else None
        payload["wall_color"] = (
            wall_color if isinstance(wall_color, str) and wall_color.strip() else "#E8E5DF"
        )
        payload["floor_color"] = (
            floor_color if isinstance(floor_color, str) and floor_color.strip() else "#C8B29B"
        )
            
        print("Direct 3D layout generated successfully in seconds.")
        return payload

    except Exception as e:
        print(f"Direct generation failed, error: {e}")
        # Fallback to simple valid structured output
        return {
            "stage": 1,
            "concept_philosophy": "تصميم معماري عصري بتوزيع مكاني متناسق وإضاءة دافئة مريحة.",
            "architectural_references": ["معايير نوفرت للتصميم الداخلي"],
            "spatial_layout_rules": "توزيع الأثاث مع الحفاظ على ممرات حركة لا تقل عن 90 سم.",
            "room_dimensions": {"width": 5.0, "depth": 5.0},
            "wall_color": "#EDE8E0",
            "floor_color": "#C8B29B",
            "objects": [
                {
                    "id": "sofa_main",
                    "type": "furniture",
                    "asset_id": "sofa",
                    "hex_color": "#B2A59A",
                    "dimensions": {"length": 2.28, "width": 0.95, "height": 0.83},
                    "transform": {"t_x": 0.0, "t_y": 0.0, "t_z": -1.5, "yaw_y": 0.0, "scale": 1.0},
                    "economy": {"price": 2495.0, "currency": "SAR", "store_url": "https://www.ikea.com", "brand": "IKEA", "sku": "IK-SOFA-01"}
                },
                {
                    "id": "coffee_table_main",
                    "type": "furniture",
                    "asset_id": "table",
                    "hex_color": "#4A3B32",
                    "dimensions": {"length": 0.9, "width": 0.55, "height": 0.45},
                    "transform": {"t_x": 0.0, "t_y": 0.0, "t_z": -0.7, "yaw_y": 0.0, "scale": 1.0},
                    "economy": {"price": 195.0, "currency": "SAR", "store_url": "https://www.ikea.com", "brand": "IKEA", "sku": "IK-TABLE-01"}
                },
                {
                    "id": "rug_main",
                    "type": "furniture",
                    "asset_id": "rug",
                    "hex_color": "#D4C8B8",
                    "dimensions": {"length": 2.4, "width": 1.7, "height": 0.02},
                    "transform": {"t_x": 0.0, "t_y": 0.0, "t_z": -1.1, "yaw_y": 0.0, "scale": 1.0},
                    "economy": {"price": 1250.0, "currency": "SAR", "store_url": "https://www.ikea.com", "brand": "IKEA", "sku": "IK-RUG-01"}
                },
                {
                    "id": "plant_corner",
                    "type": "furniture",
                    "asset_id": "plant",
                    "hex_color": "#3E5336",
                    "dimensions": {"length": 0.4, "width": 0.4, "height": 1.2},
                    "transform": {"t_x": -2.0, "t_y": 0.0, "t_z": -2.0, "yaw_y": 0.0, "scale": 1.0},
                    "economy": {"price": 295.0, "currency": "SAR", "store_url": "https://www.ikea.com", "brand": "IKEA", "sku": "IK-PLANT-01"}
                }
            ]
        }

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
        if _client is None:
            raise RuntimeError("GEMINI_API_KEY not configured")

        response = _client.models.generate_content(
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
        print(f"Chat intent parsing failed: {e}")
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
                    
                    dim_w = best.get("dim_width", 0)
                    dim_h = best.get("dim_height", 0)
                    dim_d = best.get("dim_depth", 0)
                    
                    if dim_w > 0 and dim_h > 0 and dim_d > 0:
                        item_obj["dimensions"] = {
                            "length": dim_w / 1000.0,
                            "height": dim_h / 1000.0,
                            "width": dim_d / 1000.0
                        }
                    else:
                        item_obj["dimensions"] = {"length": 1.0, "height": 1.0, "width": 1.0}
                        
                    item_obj["transform"] = {"t_x": 0, "t_y": 0, "t_z": 0, "yaw_y": 0, "scale": 1.0}
                    
                    cat_lower = str(best.get("category", "")).lower()
                    if "sofa" in cat_lower or "seating" in cat_lower or "مقاعد" in cat_lower:
                        item_obj["asset_id"] = "sofa"
                    elif "table" in cat_lower or "طاولات" in cat_lower:
                        item_obj["asset_id"] = "coffee_table"
                    elif "tv" in cat_lower or "تلفزيون" in cat_lower:
                        item_obj["asset_id"] = "tv_unit"
                    elif "rug" in cat_lower or "سجاد" in cat_lower:
                        item_obj["asset_id"] = "rug"
                    elif "chair" in cat_lower or "كرسي" in cat_lower or "armchair" in cat_lower:
                        item_obj["asset_id"] = "armchair"
                    elif "bed" in cat_lower or "سرير" in cat_lower:
                        item_obj["asset_id"] = "bed"
                    else:
                        item_obj["asset_id"] = "sofa"
                        
                    response_payload["items"].append(item_obj)
                else:
                    response_payload["text"] = "عذراً، لم أتمكن من العثور على أثاث يطابق طلبك."
        except Exception as e:
            print(f"RAG search failed in chat: {e}")
            response_payload["text"] = "حدث خطأ أثناء البحث في الكتالوج."
    else:
        try:
            if _client is None:
                raise RuntimeError("GEMINI_API_KEY not configured")

            chat_response = _client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[user_message],
                config=types.GenerateContentConfig(
                    system_instruction="You are a helpful Interior Design AI. Answer in Arabic briefly.",
                ),
            )
            response_payload["text"] = chat_response.text.strip()
        except Exception as e:
            pass

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

