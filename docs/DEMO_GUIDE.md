# Demo guide (professor presentation, ~15 min)

1. **Open the site** `https://35-172-149-226.nip.io` (padlock = real Let's Encrypt certificate; needed for camera/mic in the video room).
2. **Three browsers/profiles** — admin, doctor (`dr.iyer@…`), patient (`patient.aarav@…`); passwords from Secrets Manager (see RUNBOOK).
3. **Patient**: book a telemedicine appointment; show the 409 when booking the same slot again; open the consultation room (UI; media not tested); upload a PDF to *Health Vault*; download it (point at the `https://…s3…` presigned URL, 15-minute expiry).
4. **Doctor**: write a SOAP note with ICD-10, issue an e-prescription.
5. **Admin**: Security Center / audit log — show LOGIN, UPLOAD, DOWNLOAD, ISSUE_PRESCRIPTION entries.
6. **AWS console tour (one sentence each)**: VPC/subnets/SGs (DB accepts only the app SG) → EC2 + SSM (no SSH) → ECR (immutable, scan-on-push) → RDS (private, KMS, TLS, 7-day backups, snapshot) → S3 (SSE-KMS, versioning, block public, TLS-only) → KMS (rotation) → Secrets Manager → Cognito → SQS+DLQ / SNS / Lambda (document scanner tagged the uploaded file) → CloudWatch dashboard + alarms + logs → CloudTrail.
7. **Failure demo**: show `docs/evidence/rollback_demo.txt` — a deliberately broken release was refused and the previous version restored automatically.
8. **Talking points**: zero-trust table in SECURITY.md; cost ≈ USD 0.05/h vs ≈ 200/month for the full design (COSTING.md); SLA targets and honest limits (SLA PDF).

## Likely questions
* *Why not CloudFront/ALB/WAF/Multi-AZ?* Blocked or too costly for the lab; they are designed in `terraform/` and priced. Caddy gives HTTPS, RDS single-AZ with backups gives recovery.
* *Is it HIPAA compliant?* No — HIPAA-**conscious** design, synthetic data, no BAA.
* *Where are secrets?* Secrets Manager (KMS), read by the app at start; none in Git, images, or container env.
* *How does CI/CD work without AWS keys in GitHub?* Pull-based: CI publishes images; the server polls and deploys itself, with automatic rollback.
* *What is not verified?* Cognito login, WebRTC media between two browsers, CI on GitHub (repo not yet pushed), alarm e-mail delivery.
