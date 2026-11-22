"""Comprehensive route tests covering all 12/12 endpoints in backend/app/api/routes.py."""

import math
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


# 1. GET /api/server-ip
def test_get_server_ip(client):
    response = client.get("/api/server-ip")
    assert response.status_code == 200
    data = response.json()
    assert "ip" in data
    assert isinstance(data["ip"], str) and len(data["ip"]) > 0


# 2. GET /api/v1/ikea-catalog
def test_get_ikea_catalog_with_limit(client):
    response = client.get("/api/v1/ikea-catalog", params={"limit": 5})
    assert response.status_code == 200
    data = response.json()
    assert "items" in data and "assets" in data and "total" in data
    assert isinstance(data["items"], list)
    assert len(data["items"]) <= 5
    assert data["total"] == len(data["items"])
    if data["items"]:
        first = data["items"][0]
        assert "id" in first and "name" in first and "model_url" in first
        assert first["model_url"].endswith(".glb")


# 3. POST /api/generate-room
def test_generate_room_happy_path(client):
    mock_payload = {
        "stage": 1,
        "concept_philosophy": "Warm modern living room with natural light.",
        "architectural_references": ["Neufert Architects' Data"],
        "spatial_layout_rules": "Maintain 0.9m circulation walkways.",
        "wall_color": "#EDE8E0",
        "floor_color": "#C8B29B",
        "ambient_mode": "morning",
        "room_dimensions": {"width": 5.0, "depth": 4.5},
        "objects": [
            {
                "id": "sofa_1",
                "type": "furniture",
                "asset_id": "sofa",
                "hex_color": "#2E5A88",
                "dimensions": {"length": 2.2, "width": 0.95, "height": 0.83},
                "transform": {
                    "t_x": 0.0,
                    "t_y": 0.0,
                    "t_z": -1.5,
                    "yaw_y": 90.0,
                    "scale": 1.0,
                },
                "economy": {
                    "price": 2495.0,
                    "currency": "SAR",
                    "store_url": "https://www.ikea.com",
                    "brand": "IKEA",
                    "sku": "IK-SOFA-01",
                },
            },
            {
                "id": "win_north",
                "type": "window",
                "asset_id": "window",
                "hex_color": "#FFFFFF",
                "dimensions": {"length": 1.8, "width": 0.15, "height": 1.9},
                "transform": {
                    "t_x": 0.0,
                    "t_y": 0.8,
                    "t_z": -2.25,
                    "yaw_y": 0.0,
                    "scale": 1.0,
                },
            },
        ],
    }

    with patch("backend.app.api.routes.generate_room_layout", return_value=mock_payload) as mock_gen:
        response = client.post(
            "/api/generate-room",
            json={"prompt": "غرفة معيشة حديثة دافئة مع نافذة واسعة"},
        )

    mock_gen.assert_called_once_with("غرفة معيشة حديثة دافئة مع نافذة واسعة", None)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["wall_color"] == "#EDE8E0"
    assert data["floor_color"] == "#C8B29B"
    assert data["ambient_mode"] == "morning"
    assert data["room_dimensions"] == {"width": 5.0, "depth": 4.5}

    # Furniture-only items
    assert len(data["items"]) == 1
    sofa = data["items"][0]
    assert sofa["asset_id"] == "sofa"
    assert sofa["dimensions"] == {"width": 2200, "height": 830, "depth": 950}
    assert sofa["rotation"][1] == pytest.approx(math.radians(90.0))
    assert sofa["economy"]["sku"] == "IK-SOFA-01"

    # Normalized windows separated from furniture items
    assert len(data["windows"]) == 1
    win = data["windows"][0]
    assert win["id"] == "win_north"
    assert win["wall"] == "back"
    assert win["size"] == "medium"


def test_generate_room_quota_429(client):
    with patch(
        "backend.app.api.routes.generate_room_layout",
        side_effect=RuntimeError("429 RESOURCE_EXHAUSTED: Quota exceeded"),
    ):
        response = client.post(
            "/api/generate-room",
            json={"prompt": "تصميم غرفة جلوس"},
        )

    assert response.status_code == 429
    detail = response.json()["detail"]
    assert "تم تجاوز الحد المسموح" in detail


def test_generate_room_generic_500(client):
    with patch(
        "backend.app.api.routes.generate_room_layout",
        side_effect=RuntimeError("Unexpected backend error"),
    ):
        response = client.post(
            "/api/generate-room",
            json={"prompt": "تصميم غرفة جلوس"},
        )

    assert response.status_code == 500
    assert "Unexpected backend error" in response.json()["detail"]


# 4. POST /api/v1/chat
def test_chat_normal_qa(client):
    mock_reply = {
        "text": "لغرفة معيشة هادئة، يُنصح باستخدام ألوان ترابية وإضاءة 3000K.",
        "items": [],
    }
    with patch("backend.app.api.routes.process_chat_message", return_value=mock_reply):
        response = client.post(
            "/api/v1/chat",
            json={"message": "ما هي أفضل إضاءة لغرفة المعيشة؟"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "3000K" in data["text"]
    assert data["items"] == []


def test_chat_add_action_radians_and_mm_dimensions(client):
    mock_add = {
        "text": "لقد وجدت أريكة KIVIK بسعر 2495 ريال. سأقوم بإضافتها الآن!",
        "items": [
            {
                "asset_id": "sofa",
                "transform": {"t_x": 0.5, "t_y": 0.0, "t_z": -1.2, "yaw_y": 90},
                "dimensions": {"length": 2.2, "width": 0.95, "height": 0.83},
                "economy": {
                    "brand": "IKEA",
                    "sku": "IK-SOFA-01",
                    "price": 2495.0,
                    "currency": "SAR",
                },
            }
        ],
    }
    with patch("backend.app.api.routes.process_chat_message", return_value=mock_add):
        response = client.post("/api/v1/chat", json={"message": "أضف أريكة ثلاثية"})

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert len(data["items"]) == 1

    item = data["items"][0]
    rot_y = item["rotation"][1]
    assert abs(rot_y) <= 2 * math.pi
    assert rot_y == pytest.approx(math.radians(90))
    assert set(item["dimensions"].keys()) == {"width", "height", "depth"}
    assert item["dimensions"] == {"width": 2200, "height": 830, "depth": 950}


def test_chat_quota_429_and_generic_500(client):
    with patch(
        "backend.app.api.routes.process_chat_message",
        side_effect=RuntimeError("429 RESOURCE_EXHAUSTED"),
    ):
        resp_429 = client.post("/api/v1/chat", json={"message": "أضف كرسي"})
    assert resp_429.status_code == 429
    assert resp_429.json()["status"] == "error"
    assert "تم تجاوز الحد المسموح" in resp_429.json()["text"]

    with patch(
        "backend.app.api.routes.process_chat_message",
        side_effect=RuntimeError("internal chat crash"),
    ):
        resp_500 = client.post("/api/v1/chat", json={"message": "أضف كرسي"})
    assert resp_500.status_code == 500
    assert resp_500.json()["status"] == "error"


# 5. GET /api/v1/assets
def test_get_assets(client):
    response = client.get("/api/v1/assets")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data and "assets" in data and "total" in data
    assert isinstance(data["items"], list)
    assert data["total"] == len(data["items"])
    assert data["total"] >= 1


# 6. POST /api/v1/assets/ingest
def test_ingest_assets_mocked_no_lancedb_mutation(client):
    with patch("backend.app.api.routes.ingestion_pipeline.run") as mock_run:
        response = client.post(
            "/api/v1/assets/ingest",
            json={
                "source": "local",
                "url": None,
                "category": "seating",
                "delay": 0.1,
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "local" in data["message"]
    mock_run.assert_called_once_with(
        source="local",
        url=None,
        category="seating",
        delay=0.1,
    )


# 7. GET /api/furniture
def test_get_furniture_catalog_query_params(client):
    response = client.get(
        "/api/furniture",
        params={"limit": 4, "search": "sofa", "category": "seating"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data and "assets" in data and "total" in data
    assert len(data["items"]) <= 4
    assert data["total"] == len(data["items"])


# 8. POST /api/recommendations/alternatives
def test_recommend_alternatives_success(client):
    mock_alts = [
        {
            "brand": "IKEA",
            "name": "KIVIK",
            "price": 1295.0,
            "currency": "SAR",
            "store_url": "https://www.ikea.com/sa/en/p/kivik",
            "sku": "IK-KIVIK-01",
            "justification": "بديل ممتاز من KIVIK يوفر الميزانية.",
        }
    ]
    with patch(
        "backend.app.api.routes.find_budget_alternatives",
        return_value=mock_alts,
    ) as mock_find:
        response = client.post(
            "/api/recommendations/alternatives",
            json={"current_item_id": "sofa", "budget_left": 1500.0},
        )
    mock_find.assert_called_once_with(current_item_id="sofa", budget_left=1500.0)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["alternatives"] == mock_alts


def test_recommend_alternatives_live_readonly_catalog(client):
    response = client.post(
        "/api/recommendations/alternatives",
        json={"current_item_id": "bookcase", "budget_left": 1500.0},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert isinstance(data["alternatives"], list)
    assert len(data["alternatives"]) > 0
    first = data["alternatives"][0]
    assert "name" in first and "price" in first and "currency" in first


def test_recommend_alternatives_error_handling(client):
    with patch(
        "backend.app.api.routes.find_budget_alternatives",
        side_effect=RuntimeError("catalog read error"),
    ):
        response = client.post(
            "/api/recommendations/alternatives",
            json={"current_item_id": "sofa", "budget_left": 1000.0},
        )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "error"
    assert data["alternatives"] == []


# 9. POST /api/v1/studio/generate
def test_studio_generate_mocked_fal_success(client):
    mock_http_response = MagicMock()
    mock_http_response.status_code = 200
    mock_http_response.json.return_value = {
        "images": [{"url": "https://fal.media/files/test-interior-render.png"}]
    }

    mock_async_client = AsyncMock()
    mock_async_client.__aenter__.return_value = mock_async_client
    mock_async_client.__aexit__.return_value = False
    mock_async_client.post.return_value = mock_http_response

    with (
        patch("backend.app.services.image_gen_service.FAL_KEY", "test-fal-key"),
        patch(
            "backend.app.services.image_gen_service.httpx.AsyncClient",
            return_value=mock_async_client,
        ),
    ):
        response = client.post(
            "/api/v1/studio/generate",
            json={
                "prompt": "Modern Japandi living room with oak wood",
                "settings": {
                    "roomType": "Living Room",
                    "decorStyle": "Japandi",
                    "colorPalette": "Warm Neutrals",
                },
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["image_url"] == "https://fal.media/files/test-interior-render.png"
    assert "japandi" in data["enhanced_prompt"].lower()
    mock_async_client.post.assert_awaited_once()


def test_studio_generate_graceful_fallback_and_route_error(client):
    # Graceful fallback when Fal.ai raises an error
    mock_async_client = AsyncMock()
    mock_async_client.__aenter__.return_value = mock_async_client
    mock_async_client.__aexit__.return_value = False
    mock_async_client.post.side_effect = RuntimeError("Fal upstream timeout")

    with (
        patch("backend.app.services.image_gen_service.FAL_KEY", "test-fal-key"),
        patch(
            "backend.app.services.image_gen_service.httpx.AsyncClient",
            return_value=mock_async_client,
        ),
    ):
        fallback_resp = client.post(
            "/api/v1/studio/generate",
            json={"prompt": "Minimalist bedroom"},
        )

    assert fallback_resp.status_code == 200
    fallback_data = fallback_resp.json()
    assert fallback_data["status"] == "success"
    assert fallback_data["image_url"].startswith("https://")
    assert "note" in fallback_data

    # Route-level 500 when service itself raises unexpectedly
    with patch(
        "backend.app.api.routes.generate_studio_image",
        new_callable=AsyncMock,
        side_effect=RuntimeError("Studio pipeline failure"),
    ):
        error_resp = client.post(
            "/api/v1/studio/generate",
            json={"prompt": "Minimalist bedroom"},
        )
    assert error_resp.status_code == 500
    assert "Studio pipeline failure" in error_resp.json()["detail"]


# 10. GET /api/v1/db-check
def test_db_check_healthy(client):
    response = client.get("/api/v1/db-check")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "ikea_catalog" in data["tables"]
    assert "furniture_assets" in data["tables"]
    assert data["counts"]["ikea_catalog"] >= 3694
    assert data["counts"]["furniture_assets"] >= 12


# 11. POST /api/v1/spatial-audit
def test_spatial_audit_clean_and_congested_layouts(client):
    # Clean well-spaced layout
    clean_resp = client.post(
        "/api/v1/spatial-audit",
        json={
            "room_width": 5.0,
            "room_depth": 5.0,
            "items": [
                {
                    "asset_id": "sofa",
                    "name": "كنبة ثلاثية",
                    "position": [0.0, 0.0, -1.6],
                    "dimensions": {"width": 2.2, "depth": 0.95},
                },
                {
                    "asset_id": "coffee_table",
                    "name": "طاولة قهوة",
                    "position": [0.0, 0.0, -0.2],
                    "dimensions": {"width": 0.9, "depth": 0.9},
                },
                {
                    "asset_id": "tv_unit",
                    "name": "وحدة تلفزيون",
                    "position": [0.0, 0.0, 1.9],
                    "dimensions": {"width": 1.8, "depth": 0.4},
                },
            ],
        },
    )
    assert clean_resp.status_code == 200
    clean_data = clean_resp.json()
    assert clean_data["status"] == "success"
    assert clean_data["spatial_score"] >= 90

    # Congested / overlapping layout
    congested_resp = client.post(
        "/api/v1/spatial-audit",
        json={
            "room_width": 3.0,
            "room_depth": 3.0,
            "items": [
                {
                    "asset_id": "sofa",
                    "name": "كنبة 1",
                    "position": [0.0, 0.0, 0.0],
                    "dimensions": {"width": 2.2, "depth": 1.2},
                },
                {
                    "asset_id": "tv_unit",
                    "name": "وحدة تلفزيون",
                    "position": [0.1, 0.0, 0.1],
                    "dimensions": {"width": 2.0, "depth": 1.0},
                },
                {
                    "asset_id": "armchair",
                    "name": "كرسي",
                    "position": [0.2, 0.0, 0.2],
                    "dimensions": {"width": 1.2, "depth": 1.2},
                },
            ],
        },
    )
    assert congested_resp.status_code == 200
    congested_data = congested_resp.json()
    assert congested_data["status"] == "success"
    assert congested_data["spatial_score"] < clean_data["spatial_score"]
    assert len(congested_data["recommendations"]) > 0
    assert any("تداخل مكاني" in rec for rec in congested_data["recommendations"])


# 12. GET /api/v1/architectural-standards
def test_get_architectural_standards(client):
    response = client.get("/api/v1/architectural-standards")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert isinstance(data["standards"], list)
    assert data["total"] == len(data["standards"])
    assert data["total"] > 0
