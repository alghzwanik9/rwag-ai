from ai_agent import generate_layout as _generate_layout, handle_chat_request as _handle_chat_request

def generate_room_layout(prompt: str, image_base64: str | None = None):
    return _generate_layout(prompt, image_base64)

def process_chat_message(message: str):
    return _handle_chat_request(message)
