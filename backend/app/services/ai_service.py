from ai_agent import (
    generate_layout as _generate_layout,
    handle_chat_request as _handle_chat_request,
    audit_spatial_layout as _audit_spatial_layout
)

def generate_room_layout(prompt: str, image_base64: str | None = None):
    return _generate_layout(prompt, image_base64)

def process_chat_message(message: str):
    return _handle_chat_request(message)

def audit_room_layout(items: list, room_width: float = 5.0, room_depth: float = 5.0):
    return _audit_spatial_layout(items, room_width, room_depth)

