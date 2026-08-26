#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
if [[ ! -f "$ROOT/secrets.env" ]]; then
  echo "Missing secrets.env — copy secrets.env.example and fill in TrueLayer sandbox keys."
  exit 1
fi
# shellcheck source=/dev/null
source "$ROOT/secrets.env"

: "${TRUELAYER_CLIENT_ID:?Set TRUELAYER_CLIENT_ID in secrets.env}"
: "${TRUELAYER_CLIENT_SECRET:?Set TRUELAYER_CLIENT_SECRET in secrets.env}"

export TRUELAYER_CLIENT_ID TRUELAYER_CLIENT_SECRET
export TRUELAYER_API_BASE_URL="${TRUELAYER_API_BASE_URL:-https://api.truelayer-sandbox.com}"
export TRUELAYER_AUTH_BASE_URL="${TRUELAYER_AUTH_BASE_URL:-https://auth.truelayer-sandbox.com}"
export TRUELAYER_REDIRECT_URI="${TRUELAYER_REDIRECT_URI:-https://console.truelayer.com/redirect-page}"
export TRUELAYER_SCOPES="${TRUELAYER_SCOPES:-info accounts balance transactions offline_access}"
export TRUELAYER_SANDBOX_PROVIDER="${TRUELAYER_SANDBOX_PROVIDER:-uk-cs-mock}"
export TRUELAYER_TRANSACTIONS_DAYS="${TRUELAYER_TRANSACTIONS_DAYS:-90}"

run_py() {
  cd "$ROOT"
  PYTHONPATH="$ROOT" python3 -c "
import json, sys
from truelayer_client import load_secrets, call_endpoint
env = load_secrets()
ok, result = call_endpoint(env, sys.argv[1], json.loads(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2] else {})
print(json.dumps(result, indent=2))
sys.exit(0 if ok else 1)
" "$@"
}

cmd="${1:-auth-link}"

case "$cmd" in
  auth-link|link)
    run_py auth-link '{}'
    echo
    echo "Open auth_link above → Mock Bank (${TRUELAYER_MOCK_USERNAME:-john}/${TRUELAYER_MOCK_PASSWORD:-doe}) → copy code → ./test.sh exchange"
    ;;
  exchange)
  : "${TRUELAYER_AUTH_CODE:?Set TRUELAYER_AUTH_CODE in secrets.env (code from redirect page)}"
    run_py exchange "{\"code\":\"${TRUELAYER_AUTH_CODE}\"}"
    ;;
  accounts)
    run_py accounts '{}'
    ;;
  balances|balance)
    run_py balances '{}'
    ;;
  transactions)
    run_py transactions '{}'
    ;;
  all)
    : "${TRUELAYER_ACCESS_TOKEN:?Set TRUELAYER_ACCESS_TOKEN (run ./test.sh exchange first)}"
    echo "=== accounts ==="
    "$0" accounts
    echo
    echo "=== balances ==="
    "$0" balances
    echo
    echo "=== transactions ==="
    "$0" transactions
    ;;
  *)
    echo "Usage: ./test.sh [auth-link|exchange|accounts|balances|transactions|all]"
    exit 1
    ;;
esac

echo
