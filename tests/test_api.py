import pytest
from api.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Arbitron API"}

def test_start_bot():
    response = client.post("/api/v1/bot/start")
    assert response.status_code == 200
    assert response.json() == {"status": "running", "mode": "real"}

def test_pause_bot():
    # Start bot first to be able to pause it
    client.post("/api/v1/bot/start")
    response = client.post("/api/v1/bot/pause")
    assert response.status_code == 200
    assert response.json() == {"status": "paused", "mode": "real"}

def test_stop_bot():
    # Start bot first to be able to stop it
    client.post("/api/v1/bot/start")
    response = client.post("/api/v1/bot/stop")
    assert response.status_code == 200
    assert response.json() == {"status": "stopped", "mode": "real"}

def test_toggle_mode():
    response = client.post("/api/v1/bot/toggle-mode")
    assert response.status_code == 200
    assert "mode" in response.json()

def test_scan_arbitrage_no_opportunities():
    response = client.post("/api/v1/arbitrage/scan", json={
        "pair": "BTC/USDT",
        "exchanges": ["binance", "kraken"]
    })
    assert response.status_code == 500
    assert response.json() == {"detail": "404: Nenhuma oportunidade encontrada"}


