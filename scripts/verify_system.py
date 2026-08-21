import sys
from pathlib import Path

# Ensure root is in sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def run_tests():
    print("=== Running Rwaq AI Comprehensive Verification Suite ===")

    # 1. Server IP test
    print("\n[1/7] Testing /api/server-ip...")
    res = client.get("/api/server-ip")
    assert res.status_code == 200, f"Failed: {res.text}"
    print("  -> Passed! IP:", res.json().get("ip"))

    # 2. DB Check test
    print("\n[2/7] Testing /api/v1/db-check...")
    res = client.get("/api/v1/db-check")
    assert res.status_code == 200, f"Failed: {res.text}"
    db_data = res.json()
    print("  -> Passed! LanceDB status:", db_data.get("status"), "Tables:", db_data.get("tables"))

    # 3. IKEA Catalog test
    print("\n[3/7] Testing /api/v1/ikea-catalog...")
    res = client.get("/api/v1/ikea-catalog?limit=5")
    assert res.status_code == 200, f"Failed: {res.text}"
    catalog_data = res.json()
    total = catalog_data.get("total", 0)
    print(f"  -> Passed! Catalog returned {len(catalog_data.get('items', []))} items (Total: {total})")

    # 4. Budget Alternatives Recommendation test
    print("\n[4/7] Testing /api/recommendations/alternatives...")
    res = client.post("/api/recommendations/alternatives", json={
        "current_item_id": "sofa_main",
        "budget_left": 1500.0
    })
    assert res.status_code == 200, f"Failed: {res.text}"
    alt_data = res.json()
    assert alt_data.get("status") == "success"
    print(f"  -> Passed! Alternatives found: {len(alt_data.get('alternatives', []))}")

    # 5. Studio 2D Image Generation test
    print("\n[5/7] Testing /api/v1/studio/generate...")
    res = client.post("/api/v1/studio/generate", json={
        "prompt": "غرفة جلوس عصرية بألوان بيج دافئة وإضاءة طبيعية",
        "settings": {
            "roomType": "Living Room",
            "decorStyle": "Modern",
            "colorPalette": "Warm Neutrals"
        }
    })
    assert res.status_code == 200, f"Failed: {res.text}"
    gen_data = res.json()
    assert gen_data.get("status") == "success"
    assert "image_url" in gen_data
    print("  -> Passed! Generated image URL:", gen_data.get("image_url")[:60] + "...")

    # 6. Spatial & Neufert Audit test
    print("\n[6/7] Testing /api/v1/spatial-audit...")
    res = client.post("/api/v1/spatial-audit", json={
        "items": [
            {"asset_id": "sofa", "name": "كنبة ثلاثية", "position": [0, 0, -1.5], "dimensions": {"width": 2.2, "depth": 0.9, "height": 0.8}},
            {"asset_id": "coffee_table", "name": "طاولة قهوة", "position": [0, 0, -1.05], "dimensions": {"width": 1.1, "depth": 0.6, "height": 0.45}},
            {"asset_id": "tv_unit", "name": "طاولة تلفزيون", "position": [0, 0, 1.8], "dimensions": {"width": 1.8, "depth": 0.4, "height": 0.5}}
        ],
        "room_width": 5.0,
        "room_depth": 5.0
    })
    assert res.status_code == 200, f"Failed: {res.text}"
    audit_data = res.json()
    assert audit_data.get("status") == "success"
    print(f"  -> Passed! Spatial Score: {audit_data.get('spatial_score')}/100 ({audit_data.get('assessment_label')})")
    print(f"     Passed checks count: {len(audit_data.get('passed_checks', []))}")
    print(f"     Recommendations count: {len(audit_data.get('recommendations', []))}")

    # 7. Architectural Standards Catalog test
    print("\n[7/7] Testing /api/v1/architectural-standards...")
    res = client.get("/api/v1/architectural-standards")
    assert res.status_code == 200, f"Failed: {res.text}"
    stds_data = res.json()
    assert stds_data.get("status") == "success"
    print(f"  -> Passed! Standards documents loaded: {stds_data.get('total')}")

    print("\n🎉 ALL 7 SYSTEM VERIFICATION TESTS PASSED FLAWLESSLY!")

if __name__ == "__main__":
    run_tests()
