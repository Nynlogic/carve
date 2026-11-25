"""Load + concurrency test against the deployed portal (synthetic data only). Logins are limited by the API's own
rate limiter (20/min/IP), so 3 demo accounts are logged in once and the tokens are shared by the virtual users."""
import asyncio, json, sys, time, statistics, datetime
import boto3, httpx
BASE = sys.argv[1].rstrip("/"); API = BASE + "/api/v1"
sec = json.loads(boto3.client("secretsmanager", region_name="us-east-1").get_secret_value(SecretId="carevia/demo-users")["SecretString"])

async def main():
    async with httpx.AsyncClient(timeout=60, limits=httpx.Limits(max_connections=200)) as c:
        async def login(e, p): return (await c.post(f"{API}/auth/login", json={"email": e, "password": p})).json()["access_token"]
        tp = await login("patient.aarav@example.com", sec["SEED_PATIENT_PASSWORD"])
        td = await login("dr.iyer@careflow.health", sec["SEED_DOCTOR_PASSWORD"])
        H = lambda t: {"Authorization": f"Bearer {t}"}
        docs = (await c.get(f"{API}/doctors/", headers=H(tp))).json()["items"]
        dr = next(d["id"] for d in docs if "iyer" in json.dumps(d).lower())
        out = {}
        for users in (50, 100):
            lat, errs = [], 0
            async def vu(i):
                nonlocal errs
                for path, tok in [("/doctors/", tp), ("/appointments/", tp), ("/medical-records/", tp), ("/appointments/", td), (f"/doctors/{dr}/available-slots?target_date={datetime.date.today()+datetime.timedelta(days=5)}", tp)]:
                    t = time.perf_counter()
                    try:
                        r = await c.get(API + path, headers=H(tok)); ok = r.status_code == 200
                    except Exception: ok = False
                    lat.append((time.perf_counter() - t) * 1000); errs += (not ok)
            t0 = time.perf_counter(); await asyncio.gather(*[vu(i) for i in range(users)]); dur = time.perf_counter() - t0
            q = statistics.quantiles(lat, n=100)
            out[users] = dict(requests=len(lat), errors=errs, seconds=round(dur, 1), rps=round(len(lat) / dur, 1), p50_ms=round(q[49]), p95_ms=round(q[94]), p99_ms=round(q[98]))
            print(f"{users} concurrent users:", out[users], flush=True)
        # race: 25 simultaneous bookings of the SAME slot
        day = str(datetime.date.today() + datetime.timedelta(days=9))
        body = {"doctor_id": dr, "appointment_date": day, "start_time": "11:00:00", "end_time": "11:30:00", "reason": "race test", "appointment_type": "TELEMEDICINE"}
        rs = await asyncio.gather(*[c.post(f"{API}/appointments/", json=body, headers=H(tp)) for _ in range(25)])
        codes = [r.status_code for r in rs]
        print("slot race (25 simultaneous bookings of one slot):", {k: codes.count(k) for k in set(codes)}, "-> double-booking:", "YES (BUG)" if codes.count(201) > 1 else "NO")
        out["race"] = {k: codes.count(k) for k in set(codes)}
        json.dump(out, open("docs/evidence/load_test.json", "w"), indent=1)
asyncio.run(main())
