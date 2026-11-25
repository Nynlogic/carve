# Costing (us-east-1, USD, 730 h/month)

> **List-price estimates from AWS public pricing as known to the author — NOT re-verified against the AWS price-list files (tagged "unverified").** Real consumption must be read from the Learner Lab credit page / Billing console. *Owner: record actual credit used here: ________*

## Unit prices (unverified)
| Resource | Unit price | Built? |
|---|---|---|
| EC2 t4g.small (Graviton) | 0.0168 $/h | yes |
| RDS PostgreSQL db.t4g.micro single-AZ | 0.016 $/h | yes |
| RDS gp3 storage 20 GB | 0.115 $/GB-mo ≈ 2.30 $/mo | yes |
| EBS gp3 20 GB (root) | 0.08 $/GB-mo ≈ 1.60 $/mo | yes |
| Public IPv4 / Elastic IP | 0.005 $/h | yes |
| KMS customer key | 1.00 $/mo + 0.03/10k requests | yes |
| Secrets Manager | 0.40 $/secret/mo (×3) | yes |
| CloudWatch (logs ingest 0.50/GB, alarms 0.10/mo each ×8, dashboard 3.00/mo) | usage | yes |
| CloudTrail (1 management trail) | free first trail | yes |
| S3, SQS, SNS, Lambda, ECR, Cognito (≤50k MAU) | free tier / cents at this volume | yes |
| NAT gateway | 0.045 $/h each (+ data) | **no** |
| Application Load Balancer | 0.0225 $/h + LCU | **no** |
| RDS Multi-AZ | ×2 RDS instance + storage | **no** |
| WAF | 5 $/ACL/mo + 1 $/rule/mo + 0.60/M req | **no** |
| CloudFront | blocked in this account | **no** |

## Built stack
| | per hour | per month |
|---|---|---|
| EC2 + RDS + EIP | 0.0378 | 27.6 |
| EBS + RDS storage | 0.0053 | 3.9 |
| KMS + 3 secrets + alarms + dashboard | 0.0087 | 6.4 |
| **Total (≈)** | **0.052** | **≈ 38** |

## Full designed stack (Path A, `terraform/`) — why it was reduced
2 NAT (66) + ALB (≈20) + Multi-AZ RDS (≈25) + WAF (≈10) + Fargate (≈30) + CloudFront/ECR/KMS/Secrets/CloudWatch (≈25) ≈ **USD 175–250 / month**.

## Scenarios (built stack)
| Scenario | Approx. cost |
|---|---|
| 24/7 for a month | ≈ 38 |
| Demo weekend (3 days) | ≈ 3.8 |
| Office hours only (stop EC2+RDS nights/weekends) | ≈ 10–14 |
| Everything stopped | ≈ 8–10/mo (EBS, RDS storage, snapshots, KMS, secrets, EIP — **an unattached EIP still bills**) |
| Forgotten for a month | ≈ 38 → would exceed the ~50 credit within ~5 weeks |

## What still costs while "stopped"
EBS root volume, RDS storage + backups, manual snapshot, Elastic IP, KMS key, 3 secrets, CloudWatch logs/alarms/dashboard. **RDS auto-restarts after 7 days stopped.**

## Cost-control measures
All resources tagged `Project/Environment/Owner`; no NAT/ALB/Multi-AZ; Graviton sizes; log retention 30 days; ECR keeps 10 images; Budgets unavailable in the lab (documented). Auto-stop Lambda: *Designed-only*.
