# CI/CD design and evidence

## Why pull-based CD
Learner-Lab credentials expire every few hours and OIDC providers/custom IAM roles cannot be created, so GitHub **cannot** deploy into this account. Instead: GitHub Actions = **CI + image publishing**; the **server pulls** its own release and deploys it. No cloud credential is stored in GitHub; the host has only its instance role.

```
 push ─► CI (ci.yml): lint · pytest+coverage(≥60%) · Bandit · pip-audit · npm build/audit · gitleaks ·
          terraform fmt/validate · arm64 image build · Trivy (CRITICAL fails) · non-root check
              │ success on main only
              ▼
 Release (deploy.yml): build SHA-tagged images → GHCR → LAST step moves the :release tag
              ▼
 EC2 systemd timer (2 min): poll-release.sh → new digest? → deploy.sh
     pull → alembic upgrade head (new image, BEFORE swap) → compose up → health check (150 s)
          └─ unhealthy ⇒ automatic rollback to previous release, history.log entry, exit 1
```
Fail-closed: `:release` is moved only by the Release workflow, which runs only when CI concluded `success` for that commit. The old `continue-on-error: true` (false green) is removed.

## Evidence
| Claim | Status | Evidence |
|---|---|---|
| `deploy.sh`: pull → migrate → swap → health → deploy v1 | **Verified** | `evidence/host_checks.txt` (history log) |
| Unhealthy release auto-rolled-back (bad image → `ROLLBACK reason=health check failed`, v1 restored, site healthy) | **Verified** | `evidence/rollback_demo.txt` |
| Subsequent release v2 (2 uvicorn workers) deployed through same path, 0 downtime errors | **Verified** | `evidence/deploy_v2.txt` |
| CI workflows (YAML parses; commands run locally: flake8, pytest 21/21 70 % coverage, Bandit) | Verified locally | — |
| CI/Release **running on GitHub**, failed-test-not-deployed, GHCR poll | **Not done** — repository not pushed yet (needs the owner's GitHub token) | — |
| Server-side `poll-release.sh` | Implemented-not-tested (needs `release_registry` + public GHCR packages) | — |

## To finish the live proof (owner)
1. `git push -u origin main`, push `aws/cloud-deploy`, open PR.
2. After first Release run: GitHub → Packages → make `carve-backend`/`carve-frontend` **public** (no secrets inside images).
3. `terraform apply -var release_registry=ghcr.io/nynlogic …` (or edit `RELEASE_REGISTRY` in `/opt/carevia/deploy.env`).
4. Commit a trivial change → CI green → Release → host log shows `DEPLOY ok` within ~2 min; commit a failing test → Release does not run.

## Limits
Migrations are forward-only (rollback restores code, not schema → keep migrations backward compatible); ~10–20 s of brief unavailability during the container swap; `terraform apply` is manual (never auto-applied); branch protection should require the CI checks on `main`.
