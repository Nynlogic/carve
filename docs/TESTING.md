# Testing and performance (synthetic data only)

| Test | Result | Evidence |
|---|---|---|
| Backend unit/integration (pytest) | 21 passed (11 original + 10 security), coverage 70 % | local run |
| flake8 (errors) / Bandit (medium+) | 0 / 0 findings | local run |
| Postgres run of production image: Alembic migrate, seed, login | pass | local run |
| **Live end-to-end on AWS** (30 checks: 3 roles, booking, 409 conflict, SOAP note, e-prescription, S3 upload/download, audit, zero-trust negatives) | **30/30 pass** | `evidence/e2e_cloud_test.txt` |
| DB reachable from internet | no (timeout); non-TLS DB connection refused | `aws_verification.txt`, `host_checks.txt` |
| **Concurrency**: 25 simultaneous bookings of one slot | **1 × 201, 24 × 409** (first run); later run 25 × 409 (slot taken) → **no double-booking** | `load_test.txt` |
| Load, read mix (doctors, appointments, records, slots), 5 requests/user | see below | `load_test.txt` |

## Load results (client = a laptop in India → us-east-1 over the internet; target = 1 × t4g.small, 2 uvicorn workers, db.t4g.micro)
| Virtual users | Requests | Errors | Req/s | p50 | p95 | p99 |
|---|---|---|---|---|---|---|
| 50 | 250 | 0 | 76.6 | 351 ms | 1.55 s | 1.81 s |
| 100 | 500 | 0 | 32.8 | 1.35 s | 6.6 s | 7.0 s |

Single-worker baseline (before v2): 50 users p95 2.1 s; 100 users p95 7.7 s.
**Interpretation/limits:** includes WAN latency and TLS handshakes from the test machine; the t4g.small is CPU-bound at ~100 concurrent users — acceptable for a clinic demo, not a hospital. Login is excluded (API rate limit 20/min/IP), tokens were shared across virtual users. Host CPU/memory and RDS metrics were not captured per run (see CloudWatch dashboard). Not tested: WebRTC media, file-upload load, long soak, failure injection (other than the rollback test).
