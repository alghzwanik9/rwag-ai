import pytest
from backend.app.schemas import RoomLayoutRequest
from backend.app.services.ai_service import generate_room_layout

def test_room_generation():
    req = RoomLayoutRequest(prompt="تصميم غرفة نوم بسيطة")
    assert req.prompt == "تصميم غرفة نوم بسيطة"
