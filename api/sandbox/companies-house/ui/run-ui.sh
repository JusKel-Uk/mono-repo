#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
PORT="${COMPANIES_HOUSE_UI_PORT:-8765}"

if lsof -i ":${PORT}" -t >/dev/null 2>&1; then
  echo "Port ${PORT} already in use — stopping existing Companies House UI server…"
  lsof -i ":${PORT}" -t | xargs kill 2>/dev/null || true
  sleep 0.5
  if lsof -i ":${PORT}" -t >/dev/null 2>&1; then
    echo "Could not free port ${PORT}. Run: lsof -i :${PORT}   then kill <pid>"
    exit 1
  fi
fi

export COMPANIES_HOUSE_UI_PORT="$PORT"
exec python3 server.py
