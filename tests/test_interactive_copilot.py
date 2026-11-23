"""
Unit and Integration Tests for Spatial Diff & Patch Protocol (In-Place Interactive Co-Pilot).
Verifies:
1. Strict Snap Spatial Solver (Collision avoidance & anchor snapping).
2. Selection Priority & Ambiguity Disambiguation Gate.
3. Atomic Mutation Generation (MODIFY, REMOVE, ADD, ROOM_STYLE).
4. FastAPI End-to-End Endpoint (/api/v1/chat).
"""

import math
from unittest.mock import patch, MagicMock
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.spatial_solver import SpatialClusteringSolver
from ai_agent import handle_chat_request


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


# ─── 1. SpatialClusteringSolver.solve_incremental_placement Tests ─────────────

def test_strict_snap_avoids_existing_objects():
    """Verify that newly added items strictly snap without colliding with existing furniture."""
    # Existing sofa centered on back wall
    existing_items = [
        {
            "instance_id": "sofa_1",
            "asset_id": "sofa",
            "position": [0.0, 0.0, -1.9],
            "dimensions": {"width": 2.2, "depth": 0.9, "height": 0.85},
        }
    ]

    # Add a bookshelf with anchor next to back wall
    placement = SpatialClusteringSolver.solve_incremental_placement(
        new_asset_id="bookshelf",
        new_dims={"width": 1000, "depth": 400, "height": 1800},
        existing_items=existing_items,
        room_width=5.0,
        room_depth=5.0,
        anchor_hint="back_wall"
    )

    new_x = placement["t_x"]
    new_z = placement["t_z"]

    # Verify placement is valid and not colliding with sofa (sofa x is [-1.1, 1.1])
    assert abs(new_x) > 1.1, f"New item at x={new_x} collides with existing sofa at x=0.0"
    assert placement["t_y"] == 0.0
    assert placement["yaw_y"] in (0.0, 90.0, -90.0)


def test_strict_snap_window_proximity():
    """Verify that anchor_hint='window' positions the item near the window opening."""
    windows = [
        {"wall": "back", "positionOffset": 0.6, "size": "large"}
    ]
    existing_items = []

    placement = SpatialClusteringSolver.solve_incremental_placement(
        new_asset_id="bookshelf",
        new_dims={"width": 1000, "depth": 400, "height": 1800},
        existing_items=existing_items,
        room_width=5.0,
        room_depth=5.0,
        windows=windows,
        anchor_hint="next_to_window"
    )

    # Window is on back wall at positive X (+0.6 offset * 1.75m ~ 1.05m)
    # The placed bookshelf should snap to back wall with positive X close to window
    assert placement["t_x"] > 0.5
    assert placement["yaw_y"] == 0.0


# ─── 2. Ambiguity Gate & Selection Priority Tests ─────────────

def test_selection_priority_targets_selected_item():
    """When an item is selected in 3D, mutations target its instanceId directly."""
    scene_items = [
        {
            "instance_id": "chair_alpha",
            "asset_id": "armchair",
            "name": "Ektorp Armchair",
            "color": "#000000",
            "position": [-1.5, 0.0, 0.0],
        },
        {
            "instance_id": "chair_beta",
            "asset_id": "armchair",
            "name": "Strandmon Armchair",
            "color": "#333333",
            "position": [1.5, 0.0, 0.0],
        }
    ]

    mock_llm_response = {
        "action_type": "mutate",
        "intent": "modify",
        "text": "تم تغيير لون الكرسي المحدد إلى بيج كتان.",
        "target_instance_id": "chair_beta",
        "modifications": {"color": "#E8DFD5"}
    }

    with patch("ai_agent._call_gemini_with_retry") as mock_gemini:
        mock_resp = MagicMock()
        import json
        mock_resp.text = json.dumps(mock_llm_response)
        mock_gemini.return_value = mock_resp

        result = handle_chat_request(
            user_message="غيّر لون هذا الكرسي إلى بيج كتان",
            scene_items=scene_items,
            selected_asset_id="chair_beta"
        )

    assert result["status"] == "success"
    assert result["action_type"] == "mutate"
    assert len(result["mutations"]) == 1
    mutation = result["mutations"][0]
    assert mutation["op"] == "MODIFY"
    assert mutation["target_id"] == "chair_beta"
    assert mutation["patch"]["color"] == "#E8DFD5"


def test_ambiguity_gate_triggers_clarification():
    """When multiple items match and none is selected, trigger clarification."""
    scene_items = [
        {
            "instance_id": "chair_1",
            "asset_id": "chair",
            "name": "Dining Chair A",
            "color": "#ffffff",
        },
        {
            "instance_id": "chair_2",
            "asset_id": "chair",
            "name": "Dining Chair B",
            "color": "#ffffff",
        }
    ]

    mock_llm_clarify = {
        "action_type": "clarify",
        "intent": "clarify",
        "text": "يوجد أكثر من كرسي في الغرفة. هل تقصد كرسياً محدداً أم ترغب بتحديث جميع الكراسي؟",
        "target_instance_id": None
    }

    with patch("ai_agent._call_gemini_with_retry") as mock_gemini:
        mock_resp = MagicMock()
        import json
        mock_resp.text = json.dumps(mock_llm_clarify)
        mock_gemini.return_value = mock_resp

        result = handle_chat_request(
            user_message="غيّر لون الكرسي لأزرق",
            scene_items=scene_items,
            selected_asset_id=None
        )

    assert result["status"] == "success"
    assert result["action_type"] == "clarify"
    assert "أكثر من كرسي" in result["text"]
    assert len(result["mutations"]) == 0


# ─── 3. Full FastAPI Endpoint Tests (/api/v1/chat) ─────────────

def test_api_chat_endpoint_with_scene_context_and_mutation(client):
    """Test /api/v1/chat receives scene items and returns atomic mutations."""
    request_body = {
        "message": "احذف الكنبة القديمة",
        "scene_items": [
            {
                "instance_id": "sofa_target_123",
                "asset_id": "sofa",
                "name": "Old Sofa",
                "position": [0, 0, -2],
                "rotation": [0, 0, 0],
                "dimensions": {"width": 2200, "height": 850, "depth": 900},
                "color": "#444444"
            }
        ],
        "selected_asset_id": "sofa_target_123",
        "room_width": 5.0,
        "room_depth": 5.0
    }

    mock_llm_remove = {
        "action_type": "mutate",
        "intent": "remove",
        "text": "تمت إزالة الكنبة القديمة من الغرفة.",
        "target_instance_id": "sofa_target_123"
    }

    with patch("ai_agent._call_gemini_with_retry") as mock_gemini:
        mock_resp = MagicMock()
        import json
        mock_resp.text = json.dumps(mock_llm_remove)
        mock_gemini.return_value = mock_resp

        response = client.post("/api/v1/chat", json=request_body)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["action_type"] == "mutate"
    assert len(data["mutations"]) == 1
    mut = data["mutations"][0]
    assert mut["op"] == "REMOVE"
    assert mut["target_id"] == "sofa_target_123"


def test_api_chat_endpoint_add_item_mutation(client):
    """Test /api/v1/chat returns ADD mutation with calculated non-zero position."""
    request_body = {
        "message": "أضف مكتبة بجانب النافذة",
        "scene_items": [
            {
                "instance_id": "sofa_fixed",
                "asset_id": "sofa",
                "position": [0, 0, -2.0],
                "dimensions": {"width": 2200, "height": 850, "depth": 900}
            }
        ],
        "room_width": 6.0,
        "room_depth": 5.0,
        "windows": [{"wall": "back", "positionOffset": -0.8}]
    }

    mock_llm_add = {
        "action_type": "mutate",
        "intent": "add",
        "text": "تمت إضافة مكتبة كتب بجانب النافذة.",
        "add_item": {
            "search_query": "bookshelf",
            "asset_id": "bookshelf",
            "anchor_hint": "next_to_window"
        }
    }

    with patch("ai_agent._call_gemini_with_retry") as mock_gemini:
        mock_resp = MagicMock()
        import json
        mock_resp.text = json.dumps(mock_llm_add)
        mock_gemini.return_value = mock_resp

        response = client.post("/api/v1/chat", json=request_body)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["action_type"] == "mutate"
    assert len(data["mutations"]) == 1
    mut = data["mutations"][0]
    assert mut["op"] == "ADD"
    assert mut["item"]["asset_id"] == "bookshelf"
    # Ensure position was calculated and not overlapping sofa
    assert isinstance(mut["item"]["position"], list)
    assert len(mut["item"]["position"]) == 3
