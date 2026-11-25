"""Tests for 3D-to-Photorealistic neural render pipeline and depth pass conditioning."""

import asyncio
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.schemas import StudioRenderFrom3DRequest
from backend.app.services.image_gen_service import (
    render_photorealistic_from_3d,
    build_3d_render_prompt,
)


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


# ── 1. Schema Validation Tests ──

def test_studio_render_from_3d_schema_without_depth():
    payload = {
        "image_base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "room_style": "Modern Luxury",
        "ambient_mode": "morning",
    }
    req = StudioRenderFrom3DRequest(**payload)
    assert req.image_base64.startswith("data:image/png;base64,")
    assert req.depth_map_base64 is None
    assert req.room_style == "Modern Luxury"


def test_studio_render_from_3d_schema_with_depth():
    payload = {
        "image_base64": "data:image/png;base64,rgbData...",
        "depth_map_base64": "data:image/png;base64,depthData...",
        "room_style": "Japandi",
        "wall_color": "#F0EBE1",
        "floor_color": "#D2B48C",
        "ambient_mode": "midnight",
        "items": [{"name": "Sofa", "category": "seating", "color": "#334155"}],
    }
    req = StudioRenderFrom3DRequest(**payload)
    assert req.depth_map_base64 == "data:image/png;base64,depthData..."
    assert req.room_style == "Japandi"
    assert len(req.items) == 1


def test_studio_render_from_3d_schema_missing_image():
    with pytest.raises(Exception):
        StudioRenderFrom3DRequest(room_style="Modern")


# ── 2. Endpoint Tests (/api/v1/studio/render-from-3d) ──

def test_endpoint_render_from_3d_without_depth(client):
    mock_result = {
        "status": "success",
        "image_url": "https://images.unsplash.com/photo-test-without-depth",
        "prompt_used": "Test prompt",
        "source": "curated_architectural_render",
        "depth_guided": False,
    }
    with patch("backend.app.api.routes.render_photorealistic_from_3d", new_callable=AsyncMock) as mock_render:
        mock_render.return_value = mock_result
        response = client.post(
            "/api/v1/studio/render-from-3d",
            json={
                "image_base64": "data:image/png;base64,sampleRGB",
                "room_style": "Modern Luxury",
            },
        )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["depth_guided"] is False
    mock_render.assert_called_once()
    assert mock_render.call_args[1]["depth_map_base64"] is None


def test_endpoint_render_from_3d_with_depth(client):
    mock_result = {
        "status": "success",
        "image_url": "https://fal.media/files/test-depth-render.png",
        "prompt_used": "Test prompt depth",
        "source": "fal_ai_depth_control",
        "depth_guided": True,
    }
    with patch("backend.app.api.routes.render_photorealistic_from_3d", new_callable=AsyncMock) as mock_render:
        mock_render.return_value = mock_result
        response = client.post(
            "/api/v1/studio/render-from-3d",
            json={
                "image_base64": "data:image/png;base64,sampleRGB",
                "depth_map_base64": "data:image/png;base64,sampleDepth",
                "room_style": "Neo-Classic",
            },
        )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["depth_guided"] is True
    assert data["source"] == "fal_ai_depth_control"
    assert mock_render.call_args[1]["depth_map_base64"] == "data:image/png;base64,sampleDepth"


# ── 3. Service Level Depth ControlNet & Fallback Tests ──

def test_render_photorealistic_depth_controlnet_success():
    """When FAL_KEY is present and Depth ControlNet returns 200, return depth_guided success."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "images": [{"url": "https://fal.media/files/controlnet-depth-out.png"}]
    }

    with patch("backend.app.services.image_gen_service.FAL_KEY", "fake_fal_key"), \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        res = asyncio.run(render_photorealistic_from_3d(
            image_base64="data:image/png;base64,rgb123",
            depth_map_base64="data:image/png;base64,depth123",
            metadata={"room_style": "Bohemian", "ambient_mode": "morning"},
        ))

        assert res["status"] == "success"
        assert res["source"] == "fal_ai_depth_control"
        assert res["depth_guided"] is True
        assert res["image_url"] == "https://fal.media/files/controlnet-depth-out.png"
        called_endpoint = mock_post.call_args_list[0][0][0]
        assert "flux-control-lora-depth" in called_endpoint
        called_payload = mock_post.call_args_list[0][1]["json"]
        assert called_payload["control_image_url"] == "data:image/png;base64,depth123"
        assert called_payload["conditioning_scale"] == 0.80


def test_render_photorealistic_depth_controlnet_fallback_to_img2img():
    """When Depth ControlNet fails (e.g. 500), gracefully fall back to standard img2img."""
    mock_depth_fail = MagicMock()
    mock_depth_fail.status_code = 500
    mock_depth_fail.text = "Internal Model Error"

    mock_img2img_success = MagicMock()
    mock_img2img_success.status_code = 200
    mock_img2img_success.json.return_value = {
        "images": [{"url": "https://fal.media/files/img2img-out.png"}]
    }

    with patch("backend.app.services.image_gen_service.FAL_KEY", "fake_fal_key"), \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = [mock_depth_fail, mock_img2img_success]

        res = asyncio.run(render_photorealistic_from_3d(
            image_base64="data:image/png;base64,rgb123",
            depth_map_base64="data:image/png;base64,depth123",
            metadata={"room_style": "Modern"},
        ))

        assert res["status"] == "success"
        assert res["source"] == "fal_ai"
        assert res["depth_guided"] is False
        assert res["image_url"] == "https://fal.media/files/img2img-out.png"
        assert mock_post.call_count == 2


def test_render_photorealistic_fallback_curated_preset():
    """When no FAL_KEY is configured, return honest preview simulation with architectural lighting pass & note."""
    with patch("backend.app.services.image_gen_service.FAL_KEY", ""):
        res = asyncio.run(render_photorealistic_from_3d(
            image_base64="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            depth_map_base64="data:image/png;base64,depth123",
            metadata={"ambient_mode": "midnight"},
        ))
        assert res["status"] == "success"
        assert res["source"] == "preview_simulation"
        assert res["is_mock_fallback"] is True
        assert "FAL_KEY" in res["note"]
        assert res["image_url"].startswith("data:image/png;base64,")
