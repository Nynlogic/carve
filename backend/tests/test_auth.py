def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_user_registration_patient(client):
    payload = {
        "email": "newpatient@careflow.health",
        "password": "StrongPassword123!",
        "full_name": "Jane Miller",
        "role": "patient",
        "phone": "+15551234567"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newpatient@careflow.health"
    assert data["role"] == "patient"
    assert "hashed_password" not in data


def test_duplicate_registration_rejected(client):
    payload = {
        "email": "duplicate@careflow.health",
        "password": "Password123!",
        "full_name": "Duplicate User",
        "role": "patient"
    }
    r1 = client.post("/api/v1/auth/register", json=payload)
    assert r1.status_code == 201

    r2 = client.post("/api/v1/auth/register", json=payload)
    assert r2.status_code == 400
    assert "already exists" in r2.json()["detail"]


def test_user_login_success(client):
    # Register first
    payload = {
        "email": "loginuser@careflow.health",
        "password": "CorrectPassword123!",
        "full_name": "Login Test User",
        "role": "patient"
    }
    client.post("/api/v1/auth/register", json=payload)

    # Login
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "loginuser@careflow.health", "password": "CorrectPassword123!"}
    )
    assert login_resp.status_code == 200
    body = login_resp.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
    assert body["email"] == "loginuser@careflow.health"


def test_user_login_invalid_password(client):
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@careflow.health", "password": "WrongPassword"}
    )
    assert login_resp.status_code == 401


def test_get_current_user_profile(client, patient_token):
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "patient.test@careflow.health"
