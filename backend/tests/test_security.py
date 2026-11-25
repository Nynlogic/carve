"""Security regression tests (zero-trust controls)."""
import pytest
from pydantic import ValidationError

from app.core.config import Settings
from app.core.security import create_access_token
from app.models.patient import PatientProfile
from app.models.user import User, UserRole


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def reg_payload(role):
    return {"email": f"x_{role}@example.com", "password": "Str0ng!Passw0rd", "full_name": "X Y", "role": role.lower()}


def test_unauthenticated_requests_rejected(client):
    for path in ["/api/v1/appointments/", "/api/v1/users/patients-list",
                 "/api/v1/audit/", "/api/v1/medical-records/", "/api/v1/auth/me"]:
        assert client.get(path).status_code == 401, path


def test_public_registration_cannot_create_admin_or_doctor(client):
    assert client.post("/api/v1/auth/register", json=reg_payload("ADMIN")).status_code == 403
    assert client.post("/api/v1/auth/register", json=reg_payload("DOCTOR")).status_code == 403
    assert client.post("/api/v1/auth/register", json=reg_payload("PATIENT")).status_code == 201


def test_admin_can_create_doctor(client, admin_token):
    r = client.post("/api/v1/auth/register", json=reg_payload("DOCTOR"), headers=auth(admin_token))
    assert r.status_code == 201


def test_patient_cannot_register_privileged_user(client, patient_token):
    assert client.post("/api/v1/auth/register", json=reg_payload("ADMIN"),
                       headers=auth(patient_token)).status_code == 403


def test_patients_list_is_staff_only(client, patient_token, doctor_token):
    assert client.get("/api/v1/users/patients-list", headers=auth(patient_token)).status_code == 403
    assert client.get("/api/v1/users/patients-list", headers=auth(doctor_token)).status_code == 200


def test_clean_slate_requires_admin_and_flag(client, patient_token, admin_token):
    assert client.post("/api/v1/users/clean-slate").status_code == 401
    assert client.post("/api/v1/users/clean-slate", headers=auth(patient_token)).status_code == 403
    # admin but demo endpoints disabled by default -> 404
    assert client.post("/api/v1/users/clean-slate", headers=auth(admin_token)).status_code == 404


def test_confirm_rejects_foreign_file_key(client, patient_token):
    body = {"title": "t", "category": "LAB_REPORT", "file_key": "patients/9999/records/x.pdf",
            "file_name": "x.pdf", "file_size_bytes": 10, "mime_type": "application/pdf"}
    r = client.post("/api/v1/medical-records/confirm", json=body, headers=auth(patient_token))
    assert r.status_code == 400


def test_patient_cannot_download_other_patients_record(client, db_session, patient_token):
    from app.models.medical_record import MedicalRecord, DocumentCategory
    u = User(email="o2@example.com", hashed_password="x", full_name="O2", role=UserRole.PATIENT, is_active=True)
    db_session.add(u); db_session.flush()
    other = PatientProfile(user_id=u.id); db_session.add(other); db_session.flush()
    rec = MedicalRecord(patient_id=other.id, title="t", category=DocumentCategory.LAB_REPORT,
                        file_key=f"patients/{other.id}/records/a.pdf", file_name="a.pdf",
                        file_size_bytes=1, mime_type="application/pdf", s3_bucket="b", is_archived=False)
    db_session.add(rec); db_session.commit()
    assert client.get(f"/api/v1/medical-records/{rec.id}/download-url", headers=auth(patient_token)).status_code == 403


def test_forged_and_expired_tokens_rejected(client, test_patient):
    forged = create_access_token(test_patient.id, "ADMIN", "a@b.c", "x")  # valid sig, but role claim is ignored
    assert client.get("/api/v1/audit/", headers=auth(forged)).status_code == 403
    assert client.get("/api/v1/auth/me", headers=auth("not.a.jwt")).status_code == 401


def test_production_refuses_unsafe_config():
    with pytest.raises(ValidationError):
        Settings(ENVIRONMENT="production", SECRET_KEY="careflow-change-in-prod-xxxxxxxxxxxxxxxxxxxxxxxxx",
                 BACKEND_CORS_ORIGINS=["https://x"], DEBUG=False)
    with pytest.raises(ValidationError):
        Settings(ENVIRONMENT="production", SECRET_KEY="a" * 48, BACKEND_CORS_ORIGINS=["*"], DEBUG=False)
    with pytest.raises(ValidationError):
        Settings(ENVIRONMENT="production", SECRET_KEY="a" * 48, BACKEND_CORS_ORIGINS=["https://x"], DEBUG=True)
    Settings(ENVIRONMENT="production", SECRET_KEY="a" * 48, BACKEND_CORS_ORIGINS=["https://x"], DEBUG=False)
