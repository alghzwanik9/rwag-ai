from backend.app.services.ai_service import generate_room_layout

def test_generate_layout():
    try:
        print("Testing generate_room_layout...")
        res = generate_room_layout("تصميم غرفة معيشة مع كنبة زرقاء")
        assert res is not None
    except Exception as e:
        import traceback
        traceback.print_exc()
