# Runbook (operator: the student team)

All commands need Learner-Lab credentials in the **current shell only** (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AWS_DEFAULT_REGION=us-east-1`). Never write them to a file. Replace `$IID` with the instance id (`terraform output instance_id`).

| Task | How |
|---|---|
| Find URL / IP | `cd terraform/lab && terraform output site_url public_ip` (Elastic IP — stable across stop/start) |
| Open a shell (no SSH) | `aws ssm start-session --target $IID` or Console → Systems Manager → Session Manager |
| Deploy a specific release now | on the host: `sudo /opt/carevia/deploy.sh <backend-image> <frontend-image>` (auto-rollback on failure) |
| Pause automatic deploys | `sudo touch /opt/carevia/state/paused` (remove file to resume) |
| Deployment history | `cat /opt/carevia/state/history.log` |
| App logs | CloudWatch → log group `/carevia/app` (streams: backend, frontend, caddy) |
| Stop to save credit | `aws ec2 stop-instances --instance-ids $IID` and `aws rds stop-db-instance --db-instance-identifier carevia-db` (RDS auto-restarts after 7 days) |
| Start | `aws rds start-db-instance …` (wait available) then `aws ec2 start-instances …`; containers restart automatically (`restart: unless-stopped`) |
| Demo passwords (synthetic) | `aws secretsmanager get-secret-value --secret-id carevia/demo-users --query SecretString --output text` — keys `SEED_ADMIN_PASSWORD`, `SEED_DOCTOR_PASSWORD`, `SEED_PATIENT_PASSWORD`; users `admin@careflow.health`, `dr.iyer@careflow.health`, `patient.aarav@example.com` |
| Reset a user's password | on the host: `docker exec -i carevia-backend-1 python - <<'PY'` using `app.core.security.get_password_hash` to update `users.hashed_password` for that e-mail (never print the hash/password in shared logs) |
| Rotate JWT key / DB password | update the secret (`aws secretsmanager put-secret-value`), then `docker compose -f /opt/carevia/docker-compose.prod.yml up -d --force-recreate backend` (all sessions end) |
| Restore | see `BACKUP_AND_DR.md` |
| Confirm alarm e-mails | `terraform apply -var alert_email=<address>`, then click the AWS confirmation link in that mailbox |
| Re-apply infrastructure | `terraform apply` in `terraform/lab` (review the plan — stop if it shows destroy/replace) |
| Clean-up (owner only, never automated) | `terraform apply -var deletion_protection=false` then `terraform destroy`; empty the S3 buckets first; KMS key deletes after 7 days |

Gotchas learned: reverse proxies cache container IPs → `docker compose up -d` recreates caddy with the backend; Docker bakes env at creation → use `--force-recreate`; `NEXT_PUBLIC_*` is compiled at build time (image uses `/api/v1`, same-origin, so no rebuild per host).
