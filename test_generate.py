import asyncio
from main import generate_room
from pydantic import BaseModel
from typing import Optional

class RoomRequest(BaseModel):
    prompt: str = ""
    imageBase64: Optional[str] = None

async def main():
    try:
        req = RoomRequest(prompt="تصميم غرفة نوم بسيطة")
        res = await generate_room(req)
        print("Success:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
