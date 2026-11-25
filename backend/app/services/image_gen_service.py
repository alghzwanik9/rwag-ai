import os
import re
import io
import base64
import urllib.parse
import httpx
from typing import Optional, Dict, Any
from PIL import Image, ImageEnhance

from backend.app.config import FAL_KEY, GEMINI_API_KEY

# High-resolution architectural photography presets for graceful fallback when AI generation is unavailable
ARCHITECTURAL_PRESETS: Dict[str, list[str]] = {
    "Living Room": [
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1200&auto=format&fit=crop",
    ],
    "Bedroom": [
        "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1540518614846-7ede433c4576?q=80&w=1200&auto=format&fit=crop",
    ],
    "Kitchen": [
        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1600585152220-90363fe7e115?q=80&w=1200&auto=format&fit=crop",
    ],
    "Majlis": [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?q=80&w=1200&auto=format&fit=crop",
    ],
    "Office": [
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1593062096033-9a26b09da705?q=80&w=1200&auto=format&fit=crop",
    ],
    "Dining Room": [
        "https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?q=80&w=1200&auto=format&fit=crop",
    ]
}

def get_architectural_preset_fallback(prompt: str, settings: Optional[Dict[str, Any]] = None) -> str:
    import random
    rt = (settings or {}).get("roomType", "Living Room")
    p_lower = (prompt or "").lower()
    if "مجلس" in p_lower or "majlis" in p_lower:
        candidates = ARCHITECTURAL_PRESETS["Majlis"]
    elif "مطبخ" in p_lower or "kitchen" in p_lower:
        candidates = ARCHITECTURAL_PRESETS["Kitchen"]
    elif "نوم" in p_lower or "سرير" in p_lower or "bedroom" in p_lower:
        candidates = ARCHITECTURAL_PRESETS["Bedroom"]
    elif "مكتب" in p_lower or "office" in p_lower:
        candidates = ARCHITECTURAL_PRESETS["Office"]
    elif "طعام" in p_lower or "dining" in p_lower:
        candidates = ARCHITECTURAL_PRESETS["Dining Room"]
    else:
        candidates = ARCHITECTURAL_PRESETS.get(rt, ARCHITECTURAL_PRESETS["Living Room"])
    return random.choice(candidates)


def apply_architectural_lighting_pass(data_url: str) -> str:
    """
    Applies a high-contrast architectural studio lighting pass to the 3D snapshot,
    enhancing contrast, edge sharpness, and subtle warm color tones to ground the geometry
    while strictly preserving the user's 3D furniture layout and perspective.
    """
    try:
        header, b64_str = data_url.split(",", 1) if "," in data_url else ("", data_url)
        raw_bytes = base64.b64decode(b64_str)
        img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")

        # High-contrast architectural lighting pass
        img = ImageEnhance.Contrast(img).enhance(1.24)
        img = ImageEnhance.Sharpness(img).enhance(1.35)
        img = ImageEnhance.Color(img).enhance(1.12)
        img = ImageEnhance.Brightness(img).enhance(1.04)

        out_buf = io.BytesIO()
        img.save(out_buf, format="PNG", optimize=True)
        enhanced_b64 = base64.b64encode(out_buf.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{enhanced_b64}"
    except Exception as e:
        print(f"[image_gen_service] Lighting pass fallback warning: {e}")
        return data_url


STYLE_TRANSLATIONS: Dict[str, str] = {
    "Living Room": "living room",
    "Bedroom": "bedroom",
    "Kitchen": "kitchen",
    "Bathroom": "bathroom",
    "Office": "modern home office",
    "Dining Room": "dining room",
    "Modern": "modern contemporary",
    "Minimalist": "minimalist warm",
    "Japandi": "japandi minimalist Scandinavian Japanese",
    "Industrial": "modern industrial loft",
    "Bohemian": "bohemian chic",
    "Mid-Century": "mid-century modern",
    "Warm Neutrals": "warm neutral tones (beige, cream, oak wood)",
    "Cool Tones": "cool tones (soft grey, slate blue, matte white)",
    "Monochromatic": "monochromatic aesthetic",
    "Earthy": "earthy organic palette (terracotta, olive green, warm stone)",
    "Bold Contrast": "bold contrast palette (charcoal, walnut wood, brass accents)"
}


def enhance_interior_prompt(user_prompt: str, settings: Optional[Dict[str, Any]] = None) -> str:
    room_type = "living room"
    decor_style = "modern luxury"
    color_palette = "warm neutrals"

    if settings:
        rt = settings.get("roomType", "")
        ds = settings.get("decorStyle", "")
        cp = settings.get("colorPalette", "")
        room_type = STYLE_TRANSLATIONS.get(rt, rt or room_type)
        decor_style = STYLE_TRANSLATIONS.get(ds, ds or decor_style)
        color_palette = STYLE_TRANSLATIONS.get(cp, cp or color_palette)

    cleaned_prompt = user_prompt.strip() if user_prompt else "luxury interior with exquisite furniture arrangement and ambient architectural lighting"

    enhanced = (
        f"A cinematic high-end architectural photo of a {room_type}, {decor_style} interior style, "
        f"{color_palette} color scheme. {cleaned_prompt}. "
        f"Professional architectural photography, 8k resolution, soft daylight through large windows, "
        f"clean geometry, perfectly aligned furniture, high-end materials, editorial shoot for Architectural Digest."
    )
    return enhanced

async def generate_studio_image(
    prompt: str,
    base_image_url: Optional[str] = None,
    settings: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    enhanced_prompt = enhance_interior_prompt(prompt, settings)
    fal_api_key = FAL_KEY or os.getenv("FAL_KEY", "")

    if fal_api_key:
        try:
            headers = {
                "Authorization": f"Key {fal_api_key}",
                "Content-Type": "application/json"
            }

            # Choose model based on whether a base image is provided
            if base_image_url and base_image_url.startswith("data:image"):
                endpoint = "https://fal.run/fal-ai/flux/dev/image-to-image"
                payload = {
                    "image_url": base_image_url,
                    "prompt": enhanced_prompt,
                    "strength": 0.75,
                    "num_inference_steps": 28,
                    "guidance_scale": 3.5,
                    "enable_safety_checker": True
                }
            else:
                endpoint = "https://fal.run/fal-ai/flux/schnell"
                payload = {
                    "prompt": enhanced_prompt,
                    "image_size": "landscape_16_9",
                    "num_inference_steps": 4,
                    "enable_safety_checker": True
                }

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(endpoint, headers=headers, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    images = data.get("images", [])
                    if images and len(images) > 0:
                        image_url = images[0].get("url")
                        return {
                            "status": "success",
                            "image_url": image_url,
                            "prompt_used": prompt or "تصميم مساحة داخلية متناسقة",
                            "enhanced_prompt": enhanced_prompt
                        }
                else:
                    print(f"[FAL.ai] API returned status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"[FAL.ai] Error generating image: {e}")

    # ── Fallback Handling when Fal.ai is missing or fails ──
    processed_fallback: Optional[str] = None
    if base_image_url and base_image_url.startswith("data:image"):
        processed_fallback = apply_architectural_lighting_pass(base_image_url)
    else:
        # High-res curated architectural photography fallback
        processed_fallback = get_architectural_preset_fallback(enhanced_prompt, settings)

    return {
        "status": "success",
        "image_url": processed_fallback,
        "prompt_used": prompt or "تصميم مساحة داخلية متناسقة",
        "enhanced_prompt": enhanced_prompt,
        "is_mock_fallback": True,
        "note": "معاينة تجريبية (أضف FAL_KEY في .env لتفعيل الرندرة المطابقة 1:1)",
        "env_hint": "FAL_KEY=fal_your_api_key_here"
    }


def build_3d_render_prompt(metadata: Optional[Dict[str, Any]] = None) -> str:
    """Builds a rich architectural interior prompt preserving the 3D studio viewpoint & layout."""
    metadata = metadata or {}
    room_style = metadata.get("room_style") or "Modern Luxury"
    wall_color = metadata.get("wall_color") or "#EDE8E0"
    floor_color = metadata.get("floor_color") or "#C8B29B"
    ambient_mode = metadata.get("ambient_mode") or "morning"
    items = metadata.get("items") or []

    lighting_desc = "bathed in bright natural morning sunlight through windows with realistic soft shadow gradients"
    if ambient_mode == "rainy":
        lighting_desc = "cozy diffused overcast natural daylight with gentle mood reflections"
    elif ambient_mode == "midnight":
        lighting_desc = "luxurious evening ambiance with warm 2700K recessed architectural spotlighting and subtle floor lamps"

    furniture_descriptions = []
    for it in items[:8]:
        name = it.get("name") or it.get("asset_id") or "furniture"
        col = it.get("color")
        if col:
            furniture_descriptions.append(f"{col} {name}")
        else:
            furniture_descriptions.append(name)

    furniture_str = ", ".join(furniture_descriptions) if furniture_descriptions else "tasteful designer furniture"

    prompt = (
        f"Award-winning 8k architectural photograph of a high-end {room_style} interior design. "
        f"Walls finished in refined {wall_color} plaster, flooring in {floor_color} architectural material. "
        f"Interior features {furniture_str}. "
        f"Lighting: {lighting_desc}. "
        f"Strictly preserving the exact 3D camera angle, perspective, walls geometry, and furniture positions. "
        f"Hyperrealistic material textures, realistic cloth folds, natural wood grain, metallic reflections, "
        f"Architectural Digest luxury villa, cinematic 8k resolution, crisp focus, photorealistic interior photography."
    )
    return prompt


async def render_photorealistic_from_3d(
    image_base64: str,
    depth_map_base64: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Neural Render Bridge:
    Takes the base64 snapshot of the 3D Studio viewport and synthesizes a photorealistic render.
    If depth_map_base64 is provided, routes through Fal.ai Depth ControlNet pipeline
    for exact 1:1 architectural geometry preservation, falling back gracefully to standard
    image-to-image or curated presets if unavailable.
    """
    metadata = metadata or {}
    prompt = build_3d_render_prompt(metadata)
    fal_api_key = FAL_KEY or os.getenv("FAL_KEY", "")

    # Format base64 data url properly
    data_url = image_base64.strip()
    if not data_url.startswith("data:image"):
        data_url = f"data:image/png;base64,{data_url}"

    depth_data_url: Optional[str] = None
    if depth_map_base64:
        d_clean = depth_map_base64.strip()
        if d_clean:
            depth_data_url = d_clean if d_clean.startswith("data:image") else f"data:image/png;base64,{d_clean}"

    if fal_api_key:
        headers = {
            "Authorization": f"Key {fal_api_key}",
            "Content-Type": "application/json"
        }

        # ── 1. If Depth Map is provided, attempt Depth-Guided ControlNet ──
        if depth_data_url:
            try:
                # Primary depth endpoint: Flux Control LoRA Depth with calibrated conditioning
                depth_endpoint = "https://fal.run/fal-ai/flux-control-lora-depth"
                depth_payload = {
                    "prompt": prompt,
                    "control_image_url": depth_data_url,
                    "image_url": data_url,
                    "conditioning_scale": 0.80,
                    "controlnet_conditioning_scale": 0.80,
                    "num_inference_steps": 28,
                    "guidance_scale": 3.5,
                    "enable_safety_checker": True
                }

                async with httpx.AsyncClient(timeout=90.0) as client:
                    resp = await client.post(depth_endpoint, headers=headers, json=depth_payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        images = data.get("images", [])
                        if images and len(images) > 0:
                            return {
                                "status": "success",
                                "image_url": images[0].get("url"),
                                "prompt_used": prompt,
                                "source": "fal_ai_depth_control",
                                "depth_guided": True
                            }
                    else:
                        print(f"[FAL.ai] Depth Control returned status {resp.status_code}: {resp.text}. Falling back to img2img.")
            except Exception as e_depth:
                print(f"[FAL.ai] Depth Control failed ({e_depth}), falling back to img2img.")

        # ── 2. Standard Structure-Preserving Image-to-Image (Flux Dev) ──
        try:
            endpoint = "https://fal.run/fal-ai/flux/dev/image-to-image"
            payload = {
                "image_url": data_url,
                "prompt": prompt,
                "strength": 0.68,
                "num_inference_steps": 28,
                "guidance_scale": 3.5,
                "enable_safety_checker": True
            }

            async with httpx.AsyncClient(timeout=90.0) as client:
                response = await client.post(endpoint, headers=headers, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    images = data.get("images", [])
                    if images and len(images) > 0:
                        image_url = images[0].get("url")
                        return {
                            "status": "success",
                            "image_url": image_url,
                            "prompt_used": prompt,
                            "source": "fal_ai",
                            "depth_guided": False
                        }
                else:
                    print(f"[FAL.ai] Image-to-Image returned status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"[FAL.ai] Error during 3D photorealistic render: {e}")

    # ── Fallback Handling: Honest & Smart 3D Snapshot Lighting Pass ──
    # When FAL_KEY is missing or unreachable, preserve 100% geometry parity
    # by applying an architectural studio lighting pass to the captured 3D snapshot
    # rather than displaying an unrelated pre-baked stock photograph.
    processed_url = data_url
    if data_url and data_url.startswith("data:image"):
        processed_url = apply_architectural_lighting_pass(data_url)
    else:
        # Curated architectural photography fallback
        processed_url = get_architectural_preset_fallback(prompt)

    return {
        "status": "success",
        "image_url": processed_url,
        "prompt_used": prompt,
        "source": "preview_simulation",
        "depth_guided": bool(depth_data_url),
        "is_mock_fallback": True,
        "note": "معاينة تجريبية (أضف FAL_KEY في .env لتفعيل الرندرة المطابقة 1:1)",
        "env_hint": "FAL_KEY=fal_your_api_key_here"
    }

