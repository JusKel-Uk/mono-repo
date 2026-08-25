#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
if [[ ! -f "$ROOT/secrets.env" ]]; then
  echo "Missing secrets.env — copy secrets.env.example and fill in Yapily keys."
  exit 1
fi
# shellcheck source=/dev/null
source "$ROOT/secrets.env"

: "${YAPILY_APPLICATION_ID:?Set YAPILY_APPLICATION_ID in secrets.env}"
: "${YAPILY_APPLICATION_SECRET:?Set YAPILY_APPLICATION_SECRET in secrets.env}"

export YAPILY_APPLICATION_ID YAPILY_APPLICATION_SECRET
export YAPILY_API_BASE_URL="${YAPILY_API_BASE_URL:-https://api.yapily.com}"
export YAPILY_INSTITUTION_ID="${YAPILY_INSTITUTION_ID:-modelo-sandbox}"
export YAPILY_CALLBACK_URL="${YAPILY_CALLBACK_URL:-http://127.0.0.1:8768/callback}"
export YAPILY_TRANSACTIONS_DAYS="${YAPILY_TRANSACTIONS_DAYS:-90}"

run_py() {
  cd "$ROOT"
  PYTHONPATH="$ROOT" python3 -c "
import json, sys
from yapily_client import load_secrets, call_endpoint
env = load_secrets()
ok, result = call_endpoint(env, sys.argv[1], json.loads(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2] else {})
print(json.dumps(result, indent=2))
sys.exit(0 if ok else 1)
" "$@"
}

cmd="${1:-institutions}"

case "$cmd" in
  institutions)
    run_py institutions '{}'
    ;;
  connect)
    run_py connect '{}'
    echo
    echo "Open authorisationUrl → Modelo login (${YAPILY_SANDBOX_USERNAME:-mits}/${YAPILY_SANDBOX_PASSWORD:-mits})"
    echo "Callback: ${YAPILY_CALLBACK_URL} — run ./ui/run-ui.sh to capture consent token"
    ;;
  accounts)
    run_py accounts '{}'
    ;;
  transactions)
    run_py transactions '{}'
    ;;
  all)
    : "${YAPILY_CONSENT_TOKEN:?Set YAPILY_CONSENT_TOKEN (complete connect flow first)}"
    echo "=== accounts ==="
    "$0" accounts
    echo
    echo "=== transactions ==="
    "$0" transactions
    ;;
  *)
    echo "Usage: ./test.sh [institutions|connect|accounts|transactions|all]"
    exit 1
    ;;
esac

echo
