#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
PORT="${QUICKBOOKS_UI_PORT:-8769}"

if lsof -i ":${PORT}" -t >/dev/null 2>&1; then
  echo "Port ${PORT} already in use — stopping existing QuickBooks UI server…"
  lsof -i ":${PORT}" -t | xargs kill 2>/dev/null || true
  sleep 0.5
fi

export QUICKBOOKS_UI_PORT="$PORT"
# Optional: QUICKBOOKS_REDIRECT_URI=https://….ngrok-free.app/callback ./run-ui.sh
exec python3 server.py
