import os
import sys
import json

# Fix for Windows console encoding (CrewAI emojis)
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

from google import genai
from google.genai import types
from dotenv import load_dotenv

from pydantic import BaseModel, Field
from typing import List, Optional
from crewai import Agent, Task, Crew, LLM

load_dotenv()

# Set environment variables for CrewAI LLM native initialization
api_key = os.environ.get("GEMINI_API_KEY")
os.environ["GOOGLE_API_KEY"] = api_key or ""
os.environ["GEMINI_API_KEY"] = api_key or ""


# ── Pydantic Output Models for CrewAI ─────────────────────────────────────────

class Dimensions(BaseModel):
    length: float = Field(description="Length (size along X axis) in meters")
    width: float = Field(description="Width/Depth (size along Z axis) in meters")
    height: float = Field(description="Height (size along Y axis) in meters")

class Transform(BaseModel):
    t_x: float = Field(description="Translation along X axis (in meters)")
    t_y: float = Field(default=0.0, description="Translation along Y axis (vertical). MUST be strictly 0.0")
    t_z: float = Field(description="Translation along Z axis (in meters)")
    yaw_y: float = Field(description="Rotation angle around Y axis (in degrees, e.g. 0, 90, 180, -90)")
    scale: float = Field(default=1.0, description="Scale multiplier, default is 1.0")

class Economy(BaseModel):
    price: float = Field(description="Retail price of the furniture in Saudi Riyal (SAR)")
    currency: str = Field(default="SAR", description="ISO currency code, e.g. SAR")
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
_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

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
        
        response = _client.models.generate_content(
            model="gemini-2.5-flash",
            contents=parts
        )
        return response.text.strip()
    except Exception as e:
        print(f"Vision analysis failed: {e}")
        return ""

def generate_layout(prompt: str, image_b64: str | None = None, schema_path: str = "schema.json") -> dict:
    """Uses CrewAI to generate a 3D scene payload using a Philosopher agent and a Spatial Architect agent."""
    
    # 1. Vision preprocessing
    image_context = ""
    if image_b64:
        print("Analyzing image context using vision model...")
        analyzed_desc = analyze_image_layout(image_b64)
        if analyzed_desc:
            image_context = f"\nAdditional Room Image Context:\n{analyzed_desc}\n"
            print(f"Vision context gathered: {analyzed_desc[:100]}...")

    asset_registry = get_dynamic_asset_registry()

    # Initialize CrewAI LLM using the loaded Gemini API key
    llm = LLM(model="gemini/gemini-2.5-flash", api_key=os.environ.get("GEMINI_API_KEY"))

    # 2. Define CrewAI Agents
    philosopher = Agent(
        role="Design Philosopher",
        goal="Analyze user requirements, translate any Arabic input to English, and output a detailed design concept backed by established design philosophies.",
        backstory=(
            "You are a world-class interior design philosopher and art historian. You believe that spaces should tell a story "
            "and be grounded in established design movements (Minimalism, Bauhaus, Japandi, Biophilic, Mid-Century Modern, Brutalism). "
            "You analyze client wishes and craft deep conceptual designs, explaining why specific colors (using hex codes), "
            "textures, materials, and lighting setups work conceptually. You provide real or realistic references (e.g. Dezeen, ArchDaily projects)."
        ),
        llm=llm,
        verbose=True
    )

    architect = Agent(
        role="Layout & Spatial Architect",
        goal="Take the philosophical concept and generate a practical, structural room layout conforming to strict 3D schema constraints.",
        backstory=(
            "You are a strict 3D architectural planner and spatial mathematician. You translate abstract design philosophies "
            "into functional, safe, and beautifully spaced room layouts. You respect room scale, clearance walkways (e.g., 36 inches or 0.9m for pathways), "
            "natural light entry, wall snapping, and prevent collision or overlapping of furniture. You output a mathematically precise layout "
            "conforming to the 3D scene schema."
        ),
        llm=llm,
        verbose=True
    )

    # 3. Define Tasks
    philosopher_task = Task(
        description=(
            f"Analyze the following user design request: {prompt}. {image_context}\n"
            "Formulate a cohesive design concept backed by established interior design philosophies. "
            "Explain why specific textures, colors, and lighting work. Provide real or realistic reference URLs "
            "(e.g., Dezeen, ArchDaily articles or specific designer project names)."
        ),
        expected_output="A detailed design philosophy description, color rationale, and architectural reference URLs.",
        agent=philosopher
    )

    architect_task = Task(
        description=(
            "Using the design concept, style guidelines, and references from the Design Philosopher, create a practical 3D room layout.\n"
            "STRICT SPATIAL AND SCHEMA CONSTRAINTS:\n"
            "1. REALISTIC ROOM SIZE: Default to room dimensions (width and depth between 4m and 6m, e.g., 5x5m). The floor is centered at (t_x: 0, t_y: 0, t_z: 0).\n"
            "2. DIORAMA MODE: Always generate exactly two walls at the back perimeters to frame the scene (e.g., North wall at z=-2.5, West wall at x=-2.5). "
            "NEVER enclose the room fully. Leave the front (South and East sides) open for the camera.\n"
            "3. STRICT COORDINATE BOUNDARIES: ALL generated objects MUST have their [t_x, t_z] coordinates strictly inside the room's dimensions. For a 5x5 room, no object coordinates can be < -2.5 or > 2.5.\n"
            "4. FLOOR ANCHOR: All objects MUST have transform.t_y = 0.0. Never let objects float or sink.\n"
            "5. WALL SNAPPING: Objects like TV units, cabinets, bookshelves, or beds MUST have their back edge perfectly aligned flush with a perimeter wall without intersecting it. "
            "e.g., if West Wall is at X=-2.5 (width 0.2), and a TV unit of depth (width) 0.4 is placed there, its t_x coordinate must be -2.5 + 0.1 + 0.2 = -2.2.\n"
            "6. WINDOW: Generate exactly ONE large floor-to-ceiling window mesh flush against one of the walls (type must be 'window').\n"
            "7. SPACING & CLEARANCES: Furniture MUST face logical directions (yaw_y: 0, 90, 180, or -90 degrees). Group related items but keep them spaced out (e.g. coffee table in front of sofa, TV unit opposite sofa, at least 0.9m pathways).\n"
            f"8. ASSET REGISTRY: For 'furniture' objects, choose asset_id strictly from this list: {json.dumps(asset_registry)}. Avoid overlaps.\n"
            "9. COLOR CONTRAST: Apply colors to the objects matching the Philosopher's concept and color palette. Ensure good contrast.\n"
            "10. SMART ECONOMY: For every object, generate realistic price (currency 'SAR') and store details: basic = IKEA (SAR 100-2500), contemporary = Abyat (SAR 1500-4500), luxury = West Elm (SAR 4000+)."
        ),
        expected_output="A structured FullDesignOutput JSON document containing room dimensions and the list of 3D objects with coordinates, dimensions, and economic details.",
        agent=architect,
        output_json=FullDesignOutput
    )

    # 4. Kickoff Crew
    crew = Crew(
        agents=[philosopher, architect],
        tasks=[philosopher_task, architect_task],
        verbose=True
    )

    print("Kicking off CrewAI design pipeline...")
    result = crew.kickoff()
    print("CrewAI design pipeline finished successfully.")

    # 5. Parse and Process Output
    try:
        if hasattr(result, 'json_dict') and result.json_dict:
            payload = result.json_dict
        else:
            payload = json.loads(result.raw.strip())
            
        print("Enriching generated layout payload with catalog details using RAG...")
        
        # Enforce that stage key is present
        payload["stage"] = 1
        
        # Extract wall and floor colors if missing from root (usually set by agents or fallback)
        if "wall_color" not in payload:
            # Look at objects or assign a default light warm color
            payload["wall_color"] = "#E8E5DF"
        if "floor_color" not in payload:
            payload["floor_color"] = "#A48E74"
            
        # RAG enrichment for real furniture details
        try:
            retriever = get_retriever()
            if retriever and "objects" in payload:
                for obj in payload["objects"]:
                    if obj.get("type") == "furniture":
                        color = obj.get("hex_color", "")
                        asset_id = obj.get("asset_id", "")
                        query = f"IKEA {color} {asset_id}"
                        results = retriever.search(query, limit=1)
                        if results:
                            best = results[0]
                            obj["economy"] = {
                                "price": float(best["price"]),
                                "currency": "SAR",
                                "store_url": best["link"],
                                "brand": "IKEA",
                                "sku": best["item_id"],
                                "name": best["name"]
                            }
                            # Convert mm to meters
                            if best["dim_width"] > 0 and best["dim_height"] > 0 and best["dim_depth"] > 0:
                                obj["dimensions"] = {
                                    "length": best["dim_width"] / 1000.0,
                                    "height": best["dim_height"] / 1000.0,
                                    "width": best["dim_depth"] / 1000.0
                                }
        except Exception as rag_e:
            print(f"[RAG] Failed to enrich payload: {rag_e}")

        return payload
        
    except Exception as e:
        print(f"Failed to parse or enrich CrewAI response: {result}")
        raise e

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
        response = _client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[user_message],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
            ),
        )
        data = json.loads(response.text.strip())
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
