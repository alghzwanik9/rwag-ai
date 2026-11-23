from ai_agent import (
    generate_layout as _generate_layout,
    handle_chat_request as _handle_chat_request,
    audit_spatial_layout as _audit_spatial_layout,
    analyze_floorplan_image as _analyze_floorplan_image,
)

def generate_room_layout(prompt: str, image_base64: str | None = None):
    return _generate_layout(prompt, image_base64)

def analyze_floorplan(image_input: bytes | str, mime_type: str = "image/jpeg"):
    return _analyze_floorplan_image(image_input, mime_type)


def process_chat_message(
    message: str,
    scene_items: list = None,
    selected_asset_id: str = None,
    room_width: float = 5.0,
    room_depth: float = 5.0,
    room_shape: str = "single",
    windows: list = None,
    wall_color: str = None,
    floor_color: str = None,
):
    return _handle_chat_request(
        user_message=message,
        scene_items=scene_items,
        selected_asset_id=selected_asset_id,
        room_width=room_width,
        room_depth=room_depth,
        room_shape=room_shape,
        windows=windows,
        wall_color=wall_color,
        floor_color=floor_color,
    )

def audit_room_layout(items: list, room_width: float = 5.0, room_depth: float = 5.0):
    return _audit_spatial_layout(items, room_width, room_depth)

