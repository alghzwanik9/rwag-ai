# اختبارات نقاط اتصال الـ API

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_get_server_ip():
    response = client.get("/api/server-ip")
    assert response.status_code == 200
    data = response.json()
    assert "ip" in data
    assert isinstance(data["ip"], str)

def test_get_ikea_catalog():
    response = client.get("/api/v1/ikea-catalog?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
