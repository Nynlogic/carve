#!/usr/bin/env bash
# Pull-based CD: deploy the image that CI published as :release (only moved after ALL CI jobs pass).
# No credentials on this host other than its IAM role; nothing is pushed to the server.
set -uo pipefail
source /opt/carevia/deploy.env
[ -f /opt/carevia/state/paused ] && exit 0
[ -n "${RELEASE_REGISTRY:-}" ] || exit 0        # e.g. ghcr.io/nynlogic
B="$RELEASE_REGISTRY/carve-backend"; F="$RELEASE_REGISTRY/carve-frontend"
docker pull -q "$B:release" >/dev/null 2>&1 || exit 0
docker pull -q "$F:release" >/dev/null 2>&1 || exit 0
BD=$(docker image inspect --format '{{index .RepoDigests 0}}' "$B:release")
FD=$(docker image inspect --format '{{index .RepoDigests 0}}' "$F:release")
[ "$BD" = "$(cat /opt/carevia/state/current.backend 2>/dev/null)" ] && [ "$FD" = "$(cat /opt/carevia/state/current.frontend 2>/dev/null)" ] && exit 0
exec /opt/carevia/deploy.sh "$BD" "$FD"
