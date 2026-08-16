#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

PORT=8765
HOST=127.0.0.1

echo ""
echo "  1) Leave this running."
echo "  2) In another terminal:  ngrok http ${PORT}"
echo "  3) Open the https://….ngrok-free.app URL ngrok prints."
echo ""
echo "  Local (no autofill): http://${HOST}:${PORT}/"
echo ""
echo "Press Ctrl+C to stop."
echo ""

exec python3 -m http.server "$PORT" --bind "$HOST"
