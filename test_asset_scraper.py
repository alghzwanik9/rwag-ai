# اختبارات وحدة استخراج الأصول والأبعاد

import pytest
from asset_scraper import _to_mm, parse_dimensions

def test_to_mm():
    assert _to_mm(10.0, "mm") == 10.0
    assert _to_mm(15.0, "cm") == 150.0
    assert _to_mm(2.5, "m") == 2500.0
    assert _to_mm(100.0, "unknown") == 100.0

def test_parse_dimensions_triplet():
    text = "82 cm × 50 cm × 40 cm"
    assert parse_dimensions(text) == (820.0, 500.0, 400.0)

def test_parse_dimensions_triplet_with_x():
    text = "Dimensions: 1.5 m x 80 cm x 400 mm"
    assert parse_dimensions(text) == (1500.0, 800.0, 400.0)

def test_parse_dimensions_labels():
    text = "Width: 820 mm, Height: 1000 mm, Depth: 960 mm"
    assert parse_dimensions(text) == (820.0, 1000.0, 960.0)

def test_parse_dimensions_labels_shorthand():
    # Covers cases like W: 2.2m, H: 0.83m
    text = "W: 2.2 m, H: 0.83 m, D: 95 cm"
    assert parse_dimensions(text) == (2200.0, 830.0, 950.0)

def test_parse_dimensions_invalid():
    # Verifies graceful failure on text that lacks dimension info
    text = "This product is very comfortable and has no dimensions."
    assert parse_dimensions(text) is None