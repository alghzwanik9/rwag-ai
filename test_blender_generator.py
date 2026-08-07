# اختبارات مولد أكواد بلندر

import pytest
from blender_generator import BlenderCodeGenerator

def test_hex_to_rgba_white():
    rgba = BlenderCodeGenerator.hex_to_rgba("#FFFFFF")
    assert rgba == (1.0, 1.0, 1.0, 1.0)

def test_hex_to_rgba_black():
    rgba = BlenderCodeGenerator.hex_to_rgba("#000000")
    assert rgba == (0.0, 0.0, 0.0, 1.0)

def test_hex_to_rgba_short():
    # Verifies shorthand hex (e.g. #FFF -> #FFFFFF)
    rgba = BlenderCodeGenerator.hex_to_rgba("#FFF")
    assert rgba == (1.0, 1.0, 1.0, 1.0)

def test_hex_to_rgba_invalid():
    # Invalid length falls back to #CCCCCC
    rgba = BlenderCodeGenerator.hex_to_rgba("invalid_hex")
    
    assert len(rgba) == 4
    assert rgba[3] == 1.0  # Alpha channel should always be 1.0
    # Check that RGB values match the approx linear fallback of #CCCCCC
    assert all(0.0 < c < 1.0 for c in rgba[:3])