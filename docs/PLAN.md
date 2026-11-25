# Plan (as executed) — Path B "reduced but real"

**Decisions taken** (owner delegated: "do the best possible way"): D1 Path B (Learner Lab) · D2 pull-based CD (GitHub = CI + GHCR publish; server pulls) · D3 HTTPS via Caddy + `<ip>.nip.io` (CloudFront blocked) · D4 Elastic IP (stable URL) · D6 EC2 t4g.small, RDS db.t4g.micro 20 GB gp3, single-AZ · D7 frontend as a container behind Caddy (Next.js is a Node server; S3+CloudFront impossible/blocked) · D5 student details and alert e-mail **not yet supplied** → placeholders / no SNS subscriber.

## Built architecture (region us-east-1, 1 AZ for compute)
Internet → **Elastic IP** → EC2 (public subnet, SG 80/443 only, IMDSv2, no SSH) running Docker: **Caddy** (Let's Encrypt TLS, security headers) → **Next.js** frontend and **FastAPI** backend (2 workers) → **RDS PostgreSQL** in private-db subnets (no internet route; SG allows 5432 only from the app SG; KMS; TLS enforced) · browser uploads/downloads straight to **S3** (SSE-KMS, versioning, block public access, TLS-only) via 15-min presigned URLs · secrets in **Secrets Manager** (KMS) read at start · **SQS (+DLQ) → Lambda notifier → SNS** · S3 event → **Lambda scanner** · container logs → **CloudWatch**, 8 alarms, dashboard · **CloudTrail** · **ECR** (immutable, scan-on-push) · **Cognito** pool (provisioned) · **SSM** (Session Manager, Run Command).

## Designed-only (see `terraform/`): ALB + ACM, CloudFront + OAC, WAF, Multi-AZ RDS, 2× NAT, ECS Fargate, GitHub-OIDC deploy role, custom least-privilege IAM, GuardDuty/Config/Security Hub.

## Cost (unverified list prices; details in COSTING.md): ≈ USD 0.052/h ≈ 38/month if left running; full design ≈ 175–250/month.
## Risks / rollback: automatic container rollback (`deploy.sh`); infra via Terraform (no destroys planned: plan showed 82 add / 0 destroy); RDS deletion protection on; manual snapshot + off-AWS dump taken.
## Not feasible in this account: CloudFront, custom IAM/OIDC, Budgets, S3 object-lock reads via Terraform provider (workaround: CloudFormation-created buckets).
