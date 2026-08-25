#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
PORT="${YAPILY_UI_PORT:-8768}"

if lsof -i ":${PORT}" -t >/dev/null 2>&1; then
  echo "Port ${PORT} already in use — stopping existing Yapily UI server…"
  lsof -i ":${PORT}" -t | xargs kill 2>/dev/null || true
  sleep 0.5
fi

export YAPILY_UI_PORT="$PORT"
exec python3 server.py
