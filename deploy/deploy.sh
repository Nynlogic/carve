#!/usr/bin/env bash
# Deploy a release: pull images -> DB migration -> swap containers -> health check -> auto-rollback.
# Usage: deploy.sh <backend-image> <frontend-image>
set -uo pipefail
cd /opt/carevia
NEW_BACKEND="$1"; NEW_FRONTEND="$2"
STATE=/opt/carevia/state; mkdir -p "$STATE"; HIST="$STATE/history.log"
log(){ echo "$(date -u +%FT%TZ) $*" | tee -a "$HIST"; }
set -a; source /opt/carevia/deploy.env; set +a
export AWS_REGION

PREV_BACKEND=$(cat "$STATE/current.backend" 2>/dev/null || true)
PREV_FRONTEND=$(cat "$STATE/current.frontend" 2>/dev/null || true)

registry_login(){
  case "$1" in *.dkr.ecr.*) aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "${1%%/*}" >/dev/null ;; esac
}
rollback(){
  log "ROLLBACK reason=$1"
  if [ -n "$PREV_BACKEND" ]; then
    BACKEND_IMAGE="$PREV_BACKEND" FRONTEND_IMAGE="$PREV_FRONTEND" docker compose -f docker-compose.prod.yml up -d backend frontend caddy
    log "rolled back to $PREV_BACKEND"
  else
    log "no previous release to roll back to"
  fi
  exit 1
}

log "DEPLOY start backend=$NEW_BACKEND frontend=$NEW_FRONTEND"
registry_login "$NEW_BACKEND"
docker pull "$NEW_BACKEND" >/dev/null && docker pull "$NEW_FRONTEND" >/dev/null || { log "pull failed"; exit 1; }

# Migrations run BEFORE the swap with the NEW image (forward-only; keep them backward compatible).
export BACKEND_IMAGE="$NEW_BACKEND" FRONTEND_IMAGE="$NEW_FRONTEND"
docker compose -f docker-compose.prod.yml run --rm --no-deps backend alembic upgrade head || { log "migration failed - not swapping"; exit 1; }

if [ -f "$STATE/seed.pending" ]; then
  docker compose -f docker-compose.prod.yml run --rm --no-deps -e SEED_SECRET_ID="${SEED_SECRET_ID:-}" backend python -m app.seed >/dev/null && rm -f "$STATE/seed.pending" && log "demo data seeded (synthetic)"
fi

docker compose -f docker-compose.prod.yml up -d backend frontend caddy || rollback "compose up failed"

ok=0
for i in $(seq 1 30); do
  if docker compose -f docker-compose.prod.yml exec -T backend curl -fsS http://127.0.0.1:8000/health/ready >/dev/null 2>&1 \
     && docker compose -f docker-compose.prod.yml exec -T frontend wget -qO- http://127.0.0.1:3000 >/dev/null 2>&1; then ok=1; break; fi
  sleep 5
done
[ "$ok" = 1 ] || rollback "health check failed"

echo "$NEW_BACKEND" > "$STATE/current.backend"; echo "$NEW_FRONTEND" > "$STATE/current.frontend"
log "DEPLOY ok backend=$NEW_BACKEND frontend=$NEW_FRONTEND"
