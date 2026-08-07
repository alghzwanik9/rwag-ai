# اختبارات نقاط اتصال الـ API

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_get_server_ip():
    response = client.get("/api/server-ip")
    assert response.status_code == 200
    data = response.json()
    assert "ip" in data
    assert isinstance(data["ip"], str)

def test_list_projects():
    response = client.get("/api/projects")
    assert response.status_code == 200
    data = response.json()
    assert "projects" in data