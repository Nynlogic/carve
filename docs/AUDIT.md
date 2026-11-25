# Audit — Zero-Trust Multi-Tier Healthcare Records and Tele-Consultation Portal (CAREvia / CareFlow)

Status tags: **Verified** (evidence in `docs/evidence/`), **Implemented-not-tested**, **Designed-only**, **Not done**.
All data in this project is **synthetic**. No real patient data exists anywhere.

## 1. Account type and service availability (probed with the supplied credentials)
Account `211125469458`, role `voclabs` → **AWS Academy Learner Lab** (restricted, temporary credentials, ~USD 50 credit).

| Service | Result | Evidence / error |
|---|---|---|
| EC2, VPC, RDS, ECR, S3, KMS, Secrets Manager, SSM, SQS, SNS, Lambda, Cognito, CloudWatch, CloudTrail, CloudFormation, ACM, Route 53, WAFv2 (list) | **Allowed** | list/describe calls and real creates succeeded |
| CloudFront | **Blocked** | `AccessDenied … not authorized to perform: cloudfront:ListDistributions` |
| S3 `GetBucketObjectLockConfiguration` | **Blocked by SCP** | `explicit deny in a service control policy` → Terraform `aws_s3_bucket` fails; buckets are created through CloudFormation instead |
| Custom IAM roles / OIDC provider / Budgets | **Not used** | lab role `LabRole` / `LabInstanceProfile` reused (documented gap); GitHub OIDC impossible → pull-based CD |
| WAF, ALB, NAT, Multi-AZ RDS | Allowed but **not built** | cost (see COSTING.md) → *Designed-only* |

## 2. Local project vs GitHub
`git status` clean at start; `main` = `0e320ba`. The remote `origin` was added (`Nynlogic/carve`) but **push needs the owner's GitHub token** — not performed. All work is on branch `aws/cloud-deploy`.

## 3. Findings (before changes) and status
| # | Sev | Where | Finding | Fix |
|---|---|---|---|---|
| 1 | **Critical** | `auth.py register` | Anyone could self-register with `role=admin` | admin/doctor creation now requires an authenticated admin — **Verified** (live: 403) |
| 2 | **Critical** | `users.py clean-slate` | Unauthenticated endpoint deleting all patients/doctors/records | needs admin **and** `ENABLE_DEMO_ENDPOINTS` (forced off in production) — **Verified** (live: 404) |
| 3 | High | `users.py patients-list` | any logged-in user (incl. patients) could list every patient's PHI | doctor/admin only — **Verified** |
| 4 | High | `prescriptions.py` | prescriptions by appointment id readable by anyone logged in (IDOR) | participant/ownership check — **Verified** (patient B → 403) |
| 5 | High | `security.py` | Cognito mode accepted **unsigned** tokens if the key fetch failed | fail closed — Implemented (unit-level) |
| 6 | High | `medical_records.py confirm` | patient could attach records to any `patient_id` / arbitrary `file_key` | patient id forced to own; key prefix validated — **Verified** |
| 7 | High | `medical_records.py local-*` | unauthenticated file read/write endpoints | disabled unless `STORAGE_MODE=local`; path checks — **Verified** (404 live) |
| 8 | High | `config.py`, compose | default JWT secret in repo, `CORS "*"`, `DEBUG=True` default | production refuses to start with unsafe config (tested); secrets only from Secrets Manager — **Verified** |
| 9 | Med | `main.py` | `create_all` at startup in prod (bypasses Alembic); DB error text leaked on `/health/ready` | `create_all` off in production; generic error — Verified |
| 10 | Med | `s3_service.py` | presigned PUT forced an SSE header the browser never sent; filename not sanitised | bucket default SSE-KMS; filename sanitised — **Verified** (browser-style PUT 200) |
| 11 | Med | frontend `MedicalRecordsView` | upload called endpoints that do not exist (`/medical-records/`, `/{id}/presigned-upload`) → upload broken even locally | rewritten to `upload-request → PUT → confirm` — **Verified** (API flow); UI path built, not clicked in a browser |
| 12 | Med | `requirements.txt` | **no PostgreSQL driver** (backend could not talk to Postgres); SQLAlchemy 2.1 defaults to psycopg3 | `psycopg2-binary` + URL normalisation — **Verified** |
| 13 | Med | `Dockerfile` (frontend) | `COPY public` fails on a clean clone; `NEXT_PUBLIC_API_URL` could never be set at build | `public/.gitkeep`, `ARG NEXT_PUBLIC_API_URL=/api/v1` — Verified |
| 14 | Low | `lambda/document_scanner` | tagged every object `HIPAACompliant=true`; "malware scan" is only an `MZ`/`<script>` check | tag renamed `ScanType=basic-signature-check`; documented as **not** an anti-malware engine |
| 15 | Low | `alembic/001` vs models | migration drift: no indexes on FK columns, enums stored as VARCHAR (works) | **Not fixed** — performance only; recommended follow-up migration |
| 16 | Low | `available-slots`, `/doctors/` | readable without login (doctor directory, non-PHI) | accepted, documented |
| 17 | Info | `main.py` rate limiter | in-memory per process (resets on restart; 2 workers ⇒ 2× limit) | accepted; WAF rate rule is *Designed-only* |
| 18 | Info | docs/UI | README/UI banner shows demo passwords; "HIPAA Ready" claims | production uses random passwords from Secrets Manager; wording changed to *HIPAA-conscious* |

Secret scan: `git grep` over history found only the **dev-only** compose password/JWT default and the README demo passwords (not used in AWS). `gitleaks` runs in CI.

## 4. Other inconsistencies checked
1. **Naming**: CAREvia (Terraform), CareFlow (app/README), repo `carve`. AWS resources use `carevia-*`; GHCR images `carve-*`.
2. **Frontend hosting**: Next.js is a Node server (`next start`), so the original S3+CloudFront plan cannot serve it (and CloudFront is blocked). Decision: run it as a container behind Caddy on the same host (**D7**).
3. **`deploy.yml` false-green** (`continue-on-error: true` on AWS login): replaced; the new release workflow has no `continue-on-error` and promotes `:release` only after CI succeeded.
4. **WebRTC**: `ConsultationRoom.tsx` is a UI with a room id; it contains no signalling server or TURN. Browsers need HTTPS for camera/microphone — HTTPS is provided (Let's Encrypt). Real peer-to-peer media between two browsers was **not tested**.
5. **Cognito mode**: pool + groups + optional TOTP MFA **provisioned**; the app runs in local-JWT mode (`USE_AWS_COGNITO=false`). End-to-end Cognito login was **not verified**.
