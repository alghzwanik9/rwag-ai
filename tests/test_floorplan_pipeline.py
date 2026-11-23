"""Unit tests for Phase 3 Floorplan Vision Pipeline.

Covers:
- FloorplanExtractionResult and ExtractedOpening schema validation
- Dimension and offset clamping safety rules (2.5m–12.0m)
- analyze_floorplan_image parsing & heuristic fallbacks
- POST /api/v1/floorplan-to-3d endpoint via TestClient (auto_furnish True & False, error handling)
"""

import io
import math
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.schemas import (
    ExtractedOpening,
    FloorplanExtractionResult,
    FloorplanTo3DResponse,
)
from ai_agent import analyze_floorplan_image


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


# ── 1. Schema & Clamping Tests ──────────────────────────────────────────────

def test_floorplan_extraction_result_defaults():
    res = FloorplanExtractionResult(
        room_type="bedroom",
        confidence=0.9,
        width=4.5,
        depth=5.0,
    )
    assert res.room_type == "bedroom"
    assert res.confidence == 0.9
    assert res.width == 4.5
    assert res.depth == 5.0
    assert res.height == 2.8
    assert res.openings == []
    assert res.room_shape == "single"


def test_extracted_opening_validation():
    opening = ExtractedOpening(
        wall="left",
        offset_ratio=-0.35,
        width_m=1.8,
        type="window",
        height_m=1.5,
    )
    assert opening.wall == "left"
    assert opening.offset_ratio == -0.35
    assert opening.type == "window"


def test_analyze_floorplan_image_clamping():
    """Verify that dimensions outside the safe range (e.g., 25m or 1m) are clamped to 2.5m–12.0m."""
    mock_gemini_obj = FloorplanExtractionResult(
        room_type="living room",
        confidence=1.2,  # Should be clamped to 1.0
        width=25.0,      # Should be clamped to 12.0
        depth=1.2,       # Should be clamped to 2.5
        height=6.0,      # Should be clamped to 4.5
        openings=[
            ExtractedOpening(wall="back", offset_ratio=3.5, width_m=10.0, type="window", height_m=5.0),
            ExtractedOpening(wall="right", offset_ratio=-2.0, width_m=0.2, type="door", height_m=0.4),
        ],
        detected_furniture=["sofa"],
    )

    with patch("ai_agent._call_gemini_with_retry") as mock_gemini:
        mock_response = MagicMock()
        mock_response.text = mock_gemini_obj.model_dump_json()
        mock_gemini.return_value = mock_response

        dummy_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
        result = analyze_floorplan_image(dummy_bytes, mime_type="image/png")

    assert result.width == 12.0
    assert result.depth == 2.5
    assert result.height == 4.5
    assert result.confidence == 1.0

    # Verify openings clamping
    win_op = result.openings[0]
    assert win_op.offset_ratio == 1.0  # Clamped from 3.5
    assert win_op.width_m == 4.0      # Clamped from 10.0
    assert win_op.height_m == 3.5     # Clamped from 5.0

    door_op = result.openings[1]
    assert door_op.offset_ratio == -1.0  # Clamped from -2.0
    assert door_op.width_m == 0.6        # Clamped from 0.2
    assert door_op.height_m == 0.8       # Clamped from 0.4


def test_analyze_floorplan_image_heuristic_fallback_on_error():
    """Ensure heuristic architectural fallback is returned if Gemini fails gracefully."""
    with patch("ai_agent._call_gemini_with_retry", side_effect=RuntimeError("Connection timeout")):
        dummy_bytes = b"fake-sketch-image-bytes"
        result = analyze_floorplan_image(dummy_bytes, mime_type="image/jpeg")

    assert result.room_type == "living room"
    assert result.width == 5.5
    assert result.depth == 4.8
    assert result.height == 2.8
    assert len(result.openings) == 2
    assert any(op.type == "door" for op in result.openings)
    assert any(op.type == "window" for op in result.openings)


# ── 2. Route Integration Tests: POST /api/v1/floorplan-to-3d ─────────────────

def test_floorplan_to_3d_endpoint_auto_furnish_true(client):
    mock_extraction = FloorplanExtractionResult(
        room_type="living room",
        confidence=0.92,
        width=5.8,
        depth=4.6,
        height=2.8,
        openings=[
            ExtractedOpening(wall="back", offset_ratio=0.1, width_m=1.8, type="window", height_m=1.6),
            ExtractedOpening(wall="right", offset_ratio=0.4, width_m=0.9, type="door", height_m=2.1),
        ],
        detected_furniture=["sofa", "coffee_table"],
        summary_ar="تم استخراج صالة معيشة 5.8م × 4.6م مع نافذة وباب",
    )

    mock_furnish = {
        "concept_philosophy": "Modern Saudi living diorama",
        "wall_color": "#EDE8E0",
        "floor_color": "#C8B29B",
        "ambient_mode": "morning",
        "spatial_audit": {"spatial_score": 92, "assessment_label": "ممتاز"},
        "auto_corrected": True,
        "objects": [
            {
                "id": "sofa_1",
                "type": "furniture",
                "asset_id": "sofa",
                "dimensions": {"length": 2.2, "width": 0.9, "height": 0.8},
                "transform": {"t_x": 0.0, "t_y": 0.0, "t_z": -1.2, "yaw_y": 0.0},
                "economy": {"price": 1850, "currency": "SAR", "brand": "IKEA", "sku": "SOFA-01"},
            }
        ]
    }

    with patch("backend.app.api.routes.analyze_floorplan", return_value=mock_extraction), \
         patch("backend.app.api.routes.generate_room_layout", return_value=mock_furnish):

        file_content = b"fake-floorplan-cad-data"
        response = client.post(
            "/api/v1/floorplan-to-3d",
            files={"image": ("floorplan.png", io.BytesIO(file_content), "image/png")},
            data={"auto_furnish": "true", "style": "مودرن"}
        )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["room_dimensions"] == {"width": 5.8, "depth": 4.6, "height": 2.8}
    assert data["room_type"] == "living room"
    assert data["confidence"] == 0.92

    # Windows and Doors verification
    assert len(data["windows"]) == 1
    win = data["windows"][0]
    assert win["wall"] == "back"
    assert win["size"] == "medium"
    assert win["positionOffset"] == 0.1

    assert len(data["doors"]) == 1
    door = data["doors"][0]
    assert door["wall"] == "right"
    assert door["positionOffset"] == 0.4
    assert door["width"] == 0.9

    # Furnishing items verification
    assert len(data["items"]) == 1
    item = data["items"][0]
    assert item["asset_id"] == "sofa"
    assert item["economy"]["price"] == 1850

    # Self-correction flag
    assert data["auto_corrected"] is True
    assert data["spatial_audit"]["spatial_score"] == 92


def test_floorplan_to_3d_endpoint_auto_furnish_false(client):
    """When auto_furnish is false, it returns room boundaries, windows and doors with empty items."""
    mock_extraction = FloorplanExtractionResult(
        room_type="bedroom",
        confidence=0.88,
        width=4.2,
        depth=3.8,
        height=2.8,
        openings=[
            ExtractedOpening(wall="back", offset_ratio=0.0, width_m=1.4, type="window", height_m=1.5),
        ],
    )

    with patch("backend.app.api.routes.analyze_floorplan", return_value=mock_extraction), \
         patch("backend.app.api.routes.generate_room_layout") as mock_furnish:

        file_content = b"fake-sketch-data"
        response = client.post(
            "/api/v1/floorplan-to-3d",
            files={"image": ("sketch.jpg", io.BytesIO(file_content), "image/jpeg")},
            data={"auto_furnish": "false"}
        )

    mock_furnish.assert_not_called()
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["room_dimensions"]["width"] == 4.2
    assert len(data["items"]) == 0
    assert len(data["windows"]) == 1


def test_floorplan_to_3d_endpoint_empty_file_error(client):
    response = client.post(
        "/api/v1/floorplan-to-3d",
        files={"image": ("empty.png", io.BytesIO(b""), "image/png")},
        data={"auto_furnish": "true"}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_floorplan_to_3d_endpoint_quota_exceeded(client):
    with patch("backend.app.api.routes.analyze_floorplan", side_effect=RuntimeError("429 RESOURCE_EXHAUSTED")):
        response = client.post(
            "/api/v1/floorplan-to-3d",
            files={"image": ("plan.png", io.BytesIO(b"valid-data"), "image/png")}
        )
    assert response.status_code == 429
    assert "تم تجاوز الحد المسموح" in response.json()["detail"]
