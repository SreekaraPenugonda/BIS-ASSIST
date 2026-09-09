"""Smoke tests for the BIS assistant backend.

Run from the `backend` folder:   pytest -q
Uses an isolated SQLite database and runs without a Gemini key (simulation mode).
"""
import os
from pathlib import Path

_TEST_DB = Path(__file__).resolve().parent / "_test_smoke.db"
if _TEST_DB.exists():
    _TEST_DB.unlink()

os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB.as_posix()}"
os.environ["JWT_SECRET"] = "test-secret"
os.environ["GEMINI_API_KEY"] = ""

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def _boot():
    with client:  # triggers lifespan (db init, seed, RAG index build)
        yield


def _auth_headers(email: str, password: str) -> dict:
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def test_health():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["services"]["database"] == "ok"
    assert data["services"]["ai_engine"] == "simulation"


def test_login_demo_users():
    for email in ("consumer@bis.ai", "msme@bis.ai", "admin@bis.ai"):
        resp = client.post("/api/auth/login", json={"email": email, "password": "demo-wrong"})
        assert resp.status_code == 401
    _auth_headers("consumer@bis.ai", "consumer123")
    _auth_headers("msme@bis.ai", "msme123")
    _auth_headers("admin@bis.ai", "admin123")


def test_register_login_flow():
    email = "new.msme@example.com"
    resp = client.post(
        "/api/auth/register",
        json={"name": "New MSME", "email": email, "password": "secret12", "role": "msme"},
    )
    assert resp.status_code == 201, resp.text
    token = resp.json()["access_token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == email


def test_standards_search_and_lookup():
    resp = client.get("/api/standards", params={"q": "kettle"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert data["items"][0]["is_number"].startswith("IS ")
    detail = client.get("/api/standards/IS 302 (Part 2-15):2018")
    assert detail.status_code == 200
    body = detail.json()
    assert "kettle" in (body["title"] + " " + body["scope"]).lower()


def test_multilingual_standards_search():
    hindi = client.get("/api/standards", params={"q": "पीने का पानी"})
    assert hindi.status_code == 200
    assert any(item["is_number"] == "IS 10500:2019" for item in hindi.json()["items"])

    telugu = client.get("/api/standards", params={"q": "సౌర నీటి హీటర్"})
    assert telugu.status_code == 200
    assert any(item["is_number"] == "IS 12933:2003" for item in telugu.json()["items"])


def test_recommend():
    resp = client.post("/api/standards/recommend", json={"product_name": "electric kettle"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["category"] == "Electrical & Electronics"
    assert any("302" in s["is_number"] for s in data["standards"])


def test_chat_mock_mode():
    resp = client.post("/api/chat", json={"message": "Which IS applies to an electric kettle?", "language": "en"})
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["response_mode"] in ("ai", "simulation")
    assert len(data["structured"]["answer"]) > 40
    assert data["structured"]["disclaimer"]
    assert len(data["structured"]["sources"]) >= 1


def test_chat_localized_simulation_answers():
    hindi = client.post("/api/chat", json={"message": "नमस्ते", "language": "hi"})
    assert hindi.status_code == 200
    assert "BIS AI Standards Assistant" in hindi.json()["structured"]["answer"]
    assert hindi.json()["language"] == "hi"

    telugu = client.post("/api/chat", json={"message": "నీటి ప్రమాణం ఏమిటి?", "language": "te"})
    assert telugu.status_code == 200
    assert any(char >= "\u0c00" and char <= "\u0c7f" for char in telugu.json()["structured"]["answer"])
    assert telugu.json()["language"] == "te"


def test_chat_stream_sse():
    with client.stream(
        "POST",
        "/api/chat/stream",
        json={"message": "How does BIS certification work?", "language": "en"},
    ) as resp:
        assert resp.status_code == 200
        assert resp.headers["content-type"].startswith("text/event-stream")
        body = "".join(resp.iter_text())
    assert "data:" in body
    assert '"type": "done"' in body or '"type": "meta"' in body
def test_scanner_analyze_simulation():
    try:
        from PIL import Image
    except Exception:
        pytest.skip("Pillow required for scanner test")
    from io import BytesIO

    buffer = BytesIO()
    Image.new("RGB", (240, 240), (200, 60, 40)).save(buffer, "PNG")
    data = buffer.getvalue()
    resp = client.post(
        "/api/scanner/analyze",
        files={"image": ("electric_kettle_label.png", data, "image/png")},
        data={"product_hint": ""},
    )
    assert resp.status_code == 200, resp.text
    result = resp.json()
    assert result["status"] == "VERIFICATION_REQUIRED"
    assert result["verified"] is False
    assert result["mode"] == "simulation"


def test_applications_flow():
    msme = _auth_headers("msme@bis.ai", "msme123")
    created = client.post(
        "/api/applications",
        headers=msme,
        json={
            "product_name": "Smart plug",
            "category": "Electrical & Electronics",
            "is_number": "IS 1293:2019",
        },
    )
    assert created.status_code == 201, created.text
    app_number = created.json()["application_number"]

    listing = client.get("/api/applications", headers=msme)
    assert listing.status_code == 200
    assert any(a["application_number"] == app_number for a in listing.json())

    # consumers cannot create applications
    consumer = _auth_headers("consumer@bis.ai", "consumer123")
    denied = client.post(
        "/api/applications",
        headers=consumer,
        json={"product_name": "Toaster", "category": "Electrical & Electronics"},
    )
    assert denied.status_code == 403

    # admin can advance the status
    admin = _auth_headers("admin@bis.ai", "admin123")
    app_id = created.json()["id"]
    updated = client.patch(f"/api/applications/{app_id}/status", headers=admin, json={"status": "Under Review"})
    assert updated.status_code == 200
    assert updated.json()["status"] == "Under Review"


def test_admin_permissions_and_stats():
    consumer = _auth_headers("consumer@bis.ai", "consumer123")
    assert client.get("/api/admin/stats", headers=consumer).status_code == 403
    admin = _auth_headers("admin@bis.ai", "admin123")
    resp = client.get("/api/admin/stats", headers=admin)
    assert resp.status_code == 200
    assert resp.json()["counts"]["standards"] >= 20
    assert resp.json()["rag"]["entries"] > 0
    reindex = client.post("/api/admin/reindex", headers=admin)
    assert reindex.status_code == 200
    assert reindex.json()["total_indexed"] > 0