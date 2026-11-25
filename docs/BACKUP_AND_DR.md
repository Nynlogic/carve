# Backup and disaster recovery

| Layer | Mechanism | Status |
|---|---|---|
| RDS | automated backups 7 days (point-in-time, 5-minute granularity), KMS-encrypted, deletion protection on | Verified (`aws_verification.txt`) |
| RDS | **manual snapshot** `carevia-manual-20261125-235454` (taken before the restore rehearsal) | Verified (`dr_rehearsal.txt`) |
| Off-AWS copy | `pg_dump` (gzip, 7 KB, synthetic data) created on the host, stored in S3 `carevia-artifacts-…/backups/` **and downloaded to the owner's Mac** (`backups/`, git-ignored) | Verified (`pgdump.txt`) |
| S3 records | versioning (non-current versions kept 90 days), KMS | Verified |
| Infrastructure | Terraform (`terraform/lab`) recreates everything except data | Verified (applied) |
| Images | ECR (immutable tags, last 10 kept) | Verified |

## Restore rehearsal (into a NEW instance) — see `evidence/dr_rehearsal.txt`
Procedure (`scripts/dr_rehearsal.py`): snapshot → restore as `carevia-db-restore-test` in the same private subnets/SG → compare row counts of all 10 tables from the app host → delete **only** the temporary instance.
Measured: snapshot time and restore time (RTO) are recorded in the evidence file and in the report.
**RPO**: ≤ 5 minutes with point-in-time restore (automated backups); up to the snapshot/dump time for manual copies. **RTO** (measured restore-from-snapshot) is in the evidence; add ~5 min to repoint the app (`carevia/db` secret host + `docker compose up -d --force-recreate backend`).

## Procedures
* **App down**: SSM into host → `docker compose -f /opt/carevia/docker-compose.prod.yml ps/logs`; `up -d`; if the host is dead, `terraform apply` recreates it (user-data redeploys the last image).
* **Bad deploy**: automatic rollback; manual: `deploy.sh <previous images>`.
* **DB corruption / bad data**: restore a snapshot or point-in-time to a new instance, validate row counts, update the `carevia/db` secret host, recreate backend; keep the broken instance until the incident is closed.
* **Region/lab loss**: lab reset deletes resources → `terraform apply` + restore the off-AWS `pg_dump` (`gunzip -c file | psql`), re-upload documents from the owner's copies (documents are *not* backed up off AWS — **gap**).
* **Key/secret loss**: KMS keys are retained 7 days after a delete request (`aws kms cancel-key-deletion`); secrets have a recovery window; JWT key loss only logs users out.
