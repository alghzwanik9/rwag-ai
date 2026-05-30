from ai_agent import generate_layout

try:
    print("Testing generate_layout...")
    res = generate_layout("تصميم غرفة معيشة مع كنبة زرقاء")
    print(res)
except Exception as e:
    import traceback
    traceback.print_exc()
