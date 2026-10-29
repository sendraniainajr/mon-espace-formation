from fastapi.testclient import TestClient

from app import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_ticket():
    response = client.post(
        "/tickets",
        json={
            "title": "Serveur DNS",
            "description": "Le serveur ne répond plus aux requêtes.",
            "priority": "Haute",
            "category": "Réseau",
            "status": "Ouvert",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Serveur DNS"
    assert data["status"] == "Ouvert"


def test_list_and_close_ticket():
    response = client.get("/tickets", params={"query": "DNS"})
    assert response.status_code == 200
    tickets = response.json()
    assert len(tickets) >= 1

    ticket_id = tickets[0]["ticket_id"]
    close_response = client.post(f"/tickets/{ticket_id}/close")
    assert close_response.status_code == 200
    assert close_response.json()["ticket"]["status"] == "Fermé"


def test_invalid_ticket_rejected():
    response = client.post(
        "/tickets",
        json={
            "title": "",
            "description": "",
            "priority": "Moyenne",
            "category": "Réseau",
            "status": "Mystère",
        },
    )
    assert response.status_code in {400, 422}
