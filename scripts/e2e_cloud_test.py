"""End-to-end test of the deployed portal. Reads demo passwords from AWS Secrets Manager (never printed).
Usage: python scripts/e2e_cloud_test.py https://<site-host>   (AWS credentials in the environment)"""
import json, sys, datetime, time
import boto3, httpx

BASE = sys.argv[1].rstrip("/")
API = BASE + "/api/v1"
sec = json.loads(boto3.client("secretsmanager", region_name="us-east-1").get_secret_value(SecretId="carevia/demo-users")["SecretString"])
results = []

def check(name, ok, extra=""):
    results.append((name, bool(ok)))
    print(("PASS" if ok else "FAIL"), name, extra)

c = httpx.Client(timeout=30)
def login(email, pw):
    r = c.post(f"{API}/auth/login", json={"email": email, "password": pw})
    return (r.json().get("access_token") if r.status_code == 200 else None), r.status_code
def H(t): return {"Authorization": f"Bearer {t}"}

admin, s = login("admin@careflow.health", sec["SEED_ADMIN_PASSWORD"]); check("admin login", admin, s)
doctor, s = login("dr.iyer@careflow.health", sec["SEED_DOCTOR_PASSWORD"]); check("doctor login", doctor, s)
patient, s = login("patient.aarav@example.com", sec["SEED_PATIENT_PASSWORD"]); check("patient login", patient, s)

# ---- full clinical flow ----
docs = c.get(f"{API}/doctors/", headers=H(patient)).json()["items"]
dr_id = None
for d in docs:
    if "iyer" in json.dumps(d).lower():
        dr_id = d["id"]; break
check("doctor directory", dr_id)
day = datetime.date.today() + datetime.timedelta(days=3)
hour = 9 + int(time.time()) % 7
body = {"doctor_id": dr_id, "appointment_date": str(day), "start_time": f"{hour:02d}:00:00", "end_time": f"{hour:02d}:30:00",
        "reason": "Cloud E2E test visit (synthetic)", "appointment_type": "TELEMEDICINE"}
r = c.post(f"{API}/appointments/", json=body, headers=H(patient)); check("patient books appointment", r.status_code == 201, r.status_code)
apt = r.json(); check("telemedicine room id issued", str(apt.get("telemedicine_room_id", "")).startswith("cf-telemed-"))
r = c.post(f"{API}/appointments/", json=body, headers=H(patient)); check("double-booking rejected (409)", r.status_code == 409, r.status_code)
r = c.post(f"{API}/consultations/notes", headers=H(doctor), json={"appointment_id": apt["id"], "subjective": "s", "objective": "o",
        "assessment": "a", "plan": "p", "icd_codes": "R00.0", "vitals": {"heart_rate_bpm": 72}}); check("doctor saves SOAP note", r.status_code == 201, r.status_code)
r = c.post(f"{API}/prescriptions/", headers=H(doctor), json={"appointment_id": apt["id"], "medications": [
        {"name": "Paracetamol 500mg", "dosage": "1 tab", "frequency": "TID", "duration": "3 days"}]}); check("doctor issues e-prescription", r.status_code == 201, r.status_code)
r = c.get(f"{API}/prescriptions/appointment/{apt['id']}", headers=H(patient)); check("patient reads own prescription", r.status_code == 200 and len(r.json()) == 1)

# ---- document upload straight to S3 (presigned) and download ----
payload = b"%PDF-1.4 synthetic test document - no real patient data\n"
r = c.post(f"{API}/medical-records/upload-request", headers=H(patient), json={"file_name": "cloud test.pdf", "mime_type": "application/pdf",
        "file_size_bytes": len(payload), "category": "LAB_REPORT", "title": "Cloud E2E document"}); check("presigned upload URL issued", r.status_code == 200, r.status_code)
t = r.json()
check("upload URL points to S3 over https", t["upload_url"].startswith("https://") and ".s3." in t["upload_url"])
r = c.put(t["upload_url"], content=payload, headers={"Content-Type": "application/pdf"}); check("browser-style PUT to S3 succeeds", r.status_code == 200, r.status_code)
r = c.post(f"{API}/medical-records/confirm", headers=H(patient), json={"title": "Cloud E2E document", "category": "LAB_REPORT", "file_key": t["file_key"],
        "file_name": "cloud test.pdf", "file_size_bytes": len(payload), "mime_type": "application/pdf"}); check("record metadata saved", r.status_code == 201, r.status_code)
rec = r.json()
r = c.get(f"{API}/medical-records/{rec['id']}/download-url", headers=H(patient)); check("presigned download URL issued", r.status_code == 200)
r2 = c.get(r.json()["download_url"]); check("download returns the same bytes", r2.status_code == 200 and r2.content == payload)
r3 = c.get(f"https://{t['upload_url'].split('/')[2]}/{t['file_key']}"); check("direct (unsigned) S3 URL denied", r3.status_code in (401, 403), r3.status_code)

# ---- zero-trust negative tests ----
check("unauthenticated API call rejected", c.get(f"{API}/appointments/").status_code == 401)
r = c.post(f"{API}/auth/register", json={"email": "evil@example.com", "password": "Password123!", "full_name": "E", "role": "admin"}); check("self-registration as admin refused", r.status_code == 403, r.status_code)
check("patient blocked from audit log", c.get(f"{API}/audit/", headers=H(patient)).status_code == 403)
check("patient blocked from patient directory", c.get(f"{API}/users/patients-list", headers=H(patient)).status_code == 403)
check("clean-slate endpoint disabled in production", c.post(f"{API}/users/clean-slate", headers=H(admin)).status_code == 404)
check("local-upload endpoint disabled (S3 mode)", c.put(f"{API}/medical-records/local-upload?file_key=x").status_code == 404)
check("Swagger UI not exposed through proxy", "swagger" not in c.get(BASE + "/docs").text.lower())
others = [p for p in c.get(f"{API}/users/patients-list", headers=H(admin)).json() if "aarav" not in p["email"]]
other, _ = login(others[0]["email"], sec["SEED_PATIENT_PASSWORD"]) if others else (None, 0)
if other:
    check("patient B cannot download patient A's record (IDOR)", c.get(f"{API}/medical-records/{rec['id']}/download-url", headers=H(other)).status_code == 403)
    check("patient B cannot read patient A's prescription (IDOR)", c.get(f"{API}/prescriptions/appointment/{apt['id']}", headers=H(other)).status_code == 403)

# ---- audit trail ----
logs = c.get(f"{API}/audit/?size=100", headers=H(admin)).json()["items"]
acts = {l["action"] for l in logs}
check("audit trail recorded login/upload/download", {"LOGIN_SUCCESS", "UPLOAD_MEDICAL_RECORD", "DOWNLOAD_MEDICAL_RECORD"} <= acts, sorted(acts))
check("audit API is read-only (no DELETE route)", c.delete(f"{API}/audit/1", headers=H(admin)).status_code in (404, 405))
h = c.get(BASE + "/health/ready").json(); check("readiness: DB connected, S3 storage", h["database"] == "connected" and h["storage_mode"] == "s3")
passed = sum(ok for _, ok in results); print(f"\n{passed}/{len(results)} checks passed")
sys.exit(0 if passed == len(results) else 1)
