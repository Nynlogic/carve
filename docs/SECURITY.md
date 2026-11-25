# Cloud security — zero-trust mapping (HIPAA-*conscious*, not "HIPAA compliant")

No BAA exists for a student account and only synthetic data is used, so **no compliance claim is made**.

## Zero-trust principle → control → status
| Principle | Control in this project | Status | Evidence |
|---|---|---|---|
| Verify explicitly | JWT (HS256, signing key in Secrets Manager, 24 h expiry), bcrypt hashes, role + **object-level** checks (patient A ≠ patient B), self-registration limited to patients | Verified | `e2e_cloud_test.txt` (IDOR checks), `tests/test_security.py` |
| Verify explicitly | Cognito pool, groups patients/doctors/admins, optional TOTP MFA | Implemented-not-tested (app uses JWT mode) | Console shot 14 |
| Least privilege | DB accepts 5432 **only from the app security group**; web SG exposes only 80/443; **no SSH** (SSM Session Manager); S3 presigned URLs expire in 15 min; bucket denies non-TLS | Verified | `aws_verification.txt`, `host_checks.txt` |
| Least privilege | IAM: host uses `LabInstanceProfile` (broad lab role) | **Gap** — custom least-privilege roles are impossible in the Learner Lab (Terraform in `terraform/modules/iam` shows the intended roles — Designed-only) | — |
| Assume breach | Private DB subnets with **no internet route**; encryption at rest with KMS CMK (RDS, S3, Secrets, EBS, SNS, CloudTrail) + rotation; TLS in transit (Let's Encrypt, RDS `force_ssl`, S3 TLS-only policy) | Verified | `aws_verification.txt`, `host_checks.txt` (non-TLS DB connection refused) |
| Assume breach | Audit trail for PHI access (actor, action, resource, IP, UA, time); no update/delete API; CloudTrail (multi-region, log validation); S3 access logs | Verified | e2e: login/upload/download/prescription logged; DELETE → 404/405 |
| Assume breach | Secrets only in Secrets Manager, read by the app at start; container env has no password/secret (0 matches) | Verified | `host_checks.txt` |
| Assume breach | Non-root containers (uid 1001), IMDSv2 only, immutable ECR tags + scan-on-push, Trivy in CI | Verified / CI-Implemented-not-run | `host_checks.txt` |
| Assume breach | WAF managed rules + rate limit, GuardDuty, Config, Security Hub | **Designed-only** (cost) | `terraform/modules/waf` |

## Data classification
PHI (SOAP notes, prescriptions, records, allergies, DOB, insurance) → encrypted DB + KMS bucket, audited, role-scoped. Non-PHI: doctor directory, slot availability.

## Threat model (STRIDE-lite)
| Threat | Mitigation | Residual risk |
|---|---|---|
| Spoofing | bcrypt, JWT signature, rate limit on `/auth/*` (20/min/IP/worker) | no MFA in app mode; no account lockout |
| Tampering | RBAC + ownership checks; versioned S3; signed e-prescriptions (existing feature) | JWT secret is single point (rotate via Secrets Manager) |
| Repudiation | immutable-by-API audit trail, CloudTrail | audit rows live in the same DB (DB admin could edit) → ship to S3 Object Lock in production |
| Info disclosure | private DB, KMS, TLS, no public bucket, presigned URLs, generic 500s | shared lab role is broad; presigned URL = bearer for 15 min |
| DoS | Caddy + 2 workers only; auto-restart | no WAF/CDN; single instance (see SLA) |
| Elevation | admin creation gated; clean-slate disabled | — |

## Tests run (all against the live deployment) — `docs/evidence/e2e_cloud_test.txt`
30/30 pass, including: unauthenticated rejected, admin self-registration refused (403), patient blocked from audit and patient directory, cross-patient record/prescription access denied, unsigned S3 URL denied (403), local-upload disabled, DB unreachable from the internet, TLS enforced.

## Accepted gaps
Learner-Lab role is broad; single AZ; no WAF; Cognito not wired; WebRTC media not tested; Let's Encrypt on a `nip.io` host name (rate-limited, third-party DNS); basic scanner is not anti-malware; Trivy/CI run only after the repository is pushed.
