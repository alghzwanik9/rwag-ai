import copy
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from google.genai import _transformers
from pydantic import ValidationError

import ai_agent
from ai_agent import (
    Dimensions,
    Economy,
    FullDesignOutput,
    Object3D,
    RoomDimensions,
    Transform,
)
from backend.app.services.ai_service import (
    audit_room_layout,
    generate_room_layout,
    process_chat_message,
)


def _contains_key(obj, target_key: str) -> bool:
    if isinstance(obj, dict):
        if target_key in obj:
            return True
        return any(_contains_key(v, target_key) for v in obj.values())
    if isinstance(obj, list):
        return any(_contains_key(item, target_key) for item in obj)
    return False


def test_full_design_output_schema_compatible_with_gemini():
    schema = FullDesignOutput.model_json_schema()
    assert not _contains_key(schema, "default")
    schema_copy = copy.deepcopy(schema)
    _transformers.process_schema(
        schema_copy,
        client=SimpleNamespace(vertexai=False),
    )
    assert "properties" in schema_copy
    assert "property_ordering" in schema_copy
    t_schema_out = _transformers.t_schema(
        SimpleNamespace(vertexai=False),
        FullDesignOutput,
    )
    assert "objects" in t_schema_out.properties


def test_generate_layout(monkeypatch):
    design = FullDesignOutput(
        concept_philosophy="Modern warm minimalism with balanced circulation.",
        architectural_references=["Neufert Architects' Data"],
        spatial_layout_rules="Maintain 0.9m walkways and 0.4m coffee table clearance.",
        wall_color="#F2ECE4",
        floor_color="#C8B29B",
        ambient_mode="morning",
        room_dimensions=RoomDimensions(width=5.0, depth=5.0),
        objects=[
            Object3D(
                id="sofa_main",
                type="furniture",
                asset_id="sofa",
                hex_color="#2E5A88",
                dimensions=Dimensions(length=2.2, width=0.95, height=0.83),
                transform=Transform(t_x=0.0, t_y=0.0, t_z=-1.5, yaw_y=0.0, scale=1.0),
                economy=Economy(
                    price=2495.0,
                    currency="SAR",
                    store_url="https://www.ikea.com",
                    brand="IKEA",
                    sku="IK-SOFA-01",
                ),
            )
        ],
    )
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = SimpleNamespace(
        text=design.model_dump_json()
    )
    monkeypatch.setattr(ai_agent, "_client", mock_client)

    res = generate_room_layout("تصميم غرفة معيشة مع كنبة زرقاء")

    mock_client.models.generate_content.assert_called_once()
    assert res["stage"] == 1
    assert res["wall_color"] == "#F2ECE4"
    assert res["floor_color"] == "#C8B29B"
    assert res["ambient_mode"] == "morning"
    assert res["room_dimensions"]["width"] == 5.0
    assert res["room_dimensions"]["depth"] == 5.0
    assert res["room_dimensions"]["shape"] == "single"
    assert len(res["objects"]) >= 1
    assert res["objects"][0]["asset_id"] == "sofa"
    assert res["objects"][0]["dimensions"] == {"length": 2.2, "width": 0.95, "height": 0.83}
    # Verify architectural dressing items were added
    dressing_assets = {o["asset_id"] for o in res["objects"]}
    assert any("rug" in a for a in dressing_assets)


def test_generate_layout_fallback_on_api_error(monkeypatch):
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = RuntimeError("API unavailable")
    monkeypatch.setattr(ai_agent, "_client", mock_client)

    with pytest.raises(RuntimeError, match="API unavailable"):
        generate_room_layout("تصميم غرفة معيشة مع كنبة زرقاء")
    assert mock_client.models.generate_content.call_count == 3

    mock_429_client = MagicMock()
    mock_429_client.models.generate_content.side_effect = RuntimeError(
        "429 RESOURCE_EXHAUSTED: Quota exceeded"
    )
    monkeypatch.setattr(ai_agent, "_client", mock_429_client)

    with pytest.raises(RuntimeError, match="429"):
        generate_room_layout("تصميم غرفة معيشة مع كنبة زرقاء")
    assert mock_429_client.models.generate_content.call_count == 1


def test_generate_layout_fallback_when_client_unconfigured(monkeypatch):
    monkeypatch.setattr(ai_agent, "_client", None)

    with pytest.raises(RuntimeError, match="GEMINI_API_KEY"):
        generate_room_layout("تصميم غرفة معيشة مع كنبة زرقاء")


def test_audit_room_layout_no_collision():
    items = [
        {"asset_id": "sofa", "name": "كنبة", "position": [0, 0, -1.5], "dimensions": {"width": 2.0, "depth": 0.9}},
        {"asset_id": "coffee_table", "name": "طاولة", "position": [0, 0, -0.4], "dimensions": {"width": 1.0, "depth": 0.5}},
        {"asset_id": "rug", "name": "سجادة", "position": [0, 0, -1.0], "dimensions": {"width": 3.0, "depth": 2.0}},
    ]
    res = audit_room_layout(items, 5.0, 5.0)
    assert res["status"] == "success"
    assert res["spatial_score"] >= 80
    assert not any("تداخل مكاني" in rec for rec in res["recommendations"])
    assert "لا يوجد أي تداخل مكاني (Collision) بين قطع الأثاث الرئيسية." in res["passed_checks"]


def test_audit_room_layout_with_collision():
    items = [
        {"asset_id": "sofa", "name": "كنبة", "position": [0, 0, 0], "dimensions": {"width": 2.0, "depth": 1.0}},
        {"asset_id": "tv_unit", "name": "تلفزيون", "position": [0.2, 0, 0.1], "dimensions": {"width": 1.5, "depth": 0.6}},
    ]
    res = audit_room_layout(items, 5.0, 5.0)
    assert res["status"] == "success"
    assert res["spatial_score"] < 100
    assert any("تداخل مكاني" in rec for rec in res["recommendations"])
    assert "لا يوجد أي تداخل مكاني (Collision) بين قطع الأثاث الرئيسية." not in res["passed_checks"]


def test_audit_room_layout_dimension_conventions_equivalent():
    width_depth_items = [
        {"asset_id": "sofa", "name": "كنبة", "position": [0, 0, -1.5], "dimensions": {"width": 2.0, "depth": 0.9}},
        {"asset_id": "coffee_table", "name": "طاولة", "position": [0, 0, -0.4], "dimensions": {"width": 1.0, "depth": 0.5}},
        {"asset_id": "tv_unit", "name": "تلفزيون", "position": [0, 0, 1.8], "dimensions": {"width": 1.8, "depth": 0.4}},
    ]
    length_width_items = [
        {"asset_id": "sofa", "name": "كنبة", "position": [0, 0, -1.5], "dimensions": {"length": 2.0, "width": 0.9}},
        {"asset_id": "coffee_table", "name": "طاولة", "position": [0, 0, -0.4], "dimensions": {"length": 1.0, "width": 0.5}},
        {"asset_id": "tv_unit", "name": "تلفزيون", "position": [0, 0, 1.8], "dimensions": {"length": 1.8, "width": 0.4}},
    ]
    res_wd = audit_room_layout(width_depth_items, 5.0, 5.0)
    res_lw = audit_room_layout(length_width_items, 5.0, 5.0)
    assert res_wd == res_lw
    assert res_wd["spatial_score"] == 100
    assert not any("تداخل مكاني" in rec for rec in res_wd["recommendations"])


@pytest.mark.parametrize("bad_json", ["{}", '{"objects": "not-a-list"}'])
def test_generate_layout_fallback_on_schema_mismatch(monkeypatch, bad_json):
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = SimpleNamespace(text=bad_json)
    monkeypatch.setattr(ai_agent, "_client", mock_client)

    with pytest.raises(ValidationError):
        generate_room_layout("تصميم غرفة معيشة")


def test_handle_chat_request_non_dict_json_fallback(monkeypatch):
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = [
        SimpleNamespace(text="[]"),
        RuntimeError("chat response unavailable"),
    ]
    monkeypatch.setattr(ai_agent, "_client", mock_client)

    res = process_chat_message("مرحبا")

    assert isinstance(res, dict)
    assert isinstance(res["text"], str) and len(res["text"]) > 0
    assert res["items"] == []


def test_audit_room_layout_empty_items_no_false_occupancy_pass():
    res = audit_room_layout([], 5.0, 5.0)

    assert res["status"] == "success"
    assert res["density_percentage"] == 0.0
    assert not any("نسبة إشغال الفراغ مثالية" in chk for chk in res["passed_checks"])


def test_audit_room_layout_malformed_position_and_dimensions():
    items = [
        None,
        {
            "asset_id": "sofa",
            "name": "كنبة",
            "position": None,
            "dimensions": [2, 1, 1],
        },
        {
            "asset_id": "coffee_table",
            "name": "طاولة",
            "position": [0, 0],
            "dimensions": {"width": "bad"},
        },
        {
            "asset_id": "tv_unit",
            "name": "تلفزيون",
            "position": ["0", "0", "-1.5"],
            "dimensions": {"width": 1.6, "depth": 0.4},
        },
    ]

    res = audit_room_layout(items, 5.0, 5.0)

    assert res["status"] == "success"
    assert isinstance(res["spatial_score"], int)


def test_audit_room_layout_rug_exclusion_with_empty_or_none_asset_id():
    items = [
        {
            "asset_id": "sofa",
            "name": "كنبة",
            "position": [0.0, 0.0, 0.0],
            "dimensions": {"width": 2.0, "depth": 1.0},
        },
        {
            "asset_id": "",
            "name": "سجادة",
            "position": [0.0, 0.0, 0.0],
            "dimensions": {"width": 3.0, "depth": 2.0},
        },
        {
            "asset_id": None,
            "name": "rug",
            "position": [0.0, 0.0, 0.0],
            "dimensions": {"width": 3.0, "depth": 2.0},
        },
    ]

    res = audit_room_layout(items, 5.0, 5.0)

    assert res["status"] == "success"
    assert res["density_percentage"] == 8.0
    assert res["spatial_score"] == 100
    assert not any("تداخل مكاني" in rec for rec in res["recommendations"])


def test_audit_room_layout_exact_5cm_boundary_determinism():
    pair_small = [
        {"asset_id": "armchair", "name": "armchair", "position": [0.0, 0.0, 0.0], "dimensions": {"width": 0.2, "depth": 0.2}},
        {"asset_id": "bookshelf", "name": "bookshelf", "position": [0.15, 0.0, 0.0], "dimensions": {"width": 0.2, "depth": 0.2}},
    ]
    pair_large = [
        {"asset_id": "armchair", "name": "armchair", "position": [0.0, 0.0, 0.0], "dimensions": {"width": 1.0, "depth": 1.0}},
        {"asset_id": "bookshelf", "name": "bookshelf", "position": [0.95, 0.0, 0.0], "dimensions": {"width": 1.0, "depth": 1.0}},
    ]
    pair_collision = [
        {"asset_id": "armchair", "name": "armchair", "position": [0.0, 0.0, 0.0], "dimensions": {"width": 1.0, "depth": 1.0}},
        {"asset_id": "bookshelf", "name": "bookshelf", "position": [0.94, 0.0, 0.0], "dimensions": {"width": 1.0, "depth": 1.0}},
    ]

    res_small = audit_room_layout(pair_small, 5.0, 5.0)
    res_large = audit_room_layout(pair_large, 5.0, 5.0)
    res_collision = audit_room_layout(pair_collision, 5.0, 5.0)

    assert res_small["spatial_score"] == 100
    assert res_large["spatial_score"] == 100
    assert not any("تداخل مكاني" in rec for rec in res_small["recommendations"])
    assert not any("تداخل مكاني" in rec for rec in res_large["recommendations"])
    assert "لا يوجد أي تداخل مكاني (Collision) بين قطع الأثاث الرئيسية." in res_small["passed_checks"]
    assert "لا يوجد أي تداخل مكاني (Collision) بين قطع الأثاث الرئيسية." in res_large["passed_checks"]

    assert res_collision["spatial_score"] == 90
    assert any("تداخل مكاني" in rec for rec in res_collision["recommendations"])
    assert "لا يوجد أي تداخل مكاني (Collision) بين قطع الأثاث الرئيسية." not in res_collision["passed_checks"]


