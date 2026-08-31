#!/usr/bin/env bash
set -euo pipefail

compose_file="${COMPOSE_FILE:-docker-compose.yml}"

docker compose -f "$compose_file" up -d --build

for attempt in $(seq 1 30); do
  if curl --fail --silent http://127.0.0.1:8000/health >/dev/null \
    && curl --fail --silent http://127.0.0.1:5173/ >/dev/null; then
    break
  fi
  if [ "$attempt" -eq 30 ]; then
    echo "Docker stack did not become reachable" >&2
    docker compose -f "$compose_file" ps
    exit 1
  fi
  sleep 2
done

pnpm --dir frontend test:e2e --grep "real Docker stack"
