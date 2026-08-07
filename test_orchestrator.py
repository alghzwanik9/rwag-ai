# اختبارات المنظم (Orchestrator)

import pytest
from orchestrator import BlenderOrchestrator

def test_validate_state_valid():
    payload = {"objects": [{"id": "obj_1", "transform": {"t_y": 0}}]}
    orchestrator = BlenderOrchestrator(payload)
    orchestrator.state = payload
    assert orchestrator.validate_state() is True

def test_validate_state_invalid():
    payload = {"objects": [{"id": "obj_1", "transform": {"t_y": 1.5}}]}
    orchestrator = BlenderOrchestrator(payload)
    orchestrator.state = payload
    with pytest.raises(ValueError, match="Geometry constraint violated: t_y MUST be 0"):
        orchestrator.validate_state()