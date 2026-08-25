#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
if [[ ! -f "$ROOT/secrets.env" ]]; then
  echo "Missing secrets.env — copy secrets.env.example and fill in Plaid sandbox keys."
  exit 1
fi
# shellcheck source=/dev/null
source "$ROOT/secrets.env"

: "${PLAID_CLIENT_ID:?Set PLAID_CLIENT_ID in secrets.env}"
: "${PLAID_SECRET:?Set PLAID_SECRET in secrets.env}"

BASE="${PLAID_API_BASE_URL:-https://sandbox.plaid.com}"
INST="${PLAID_SANDBOX_INSTITUTION_ID:-ins_116834}"
COUNTRY="${PLAID_COUNTRY_CODES:-GB}"
DAYS="${PLAID_TRANSACTIONS_DAYS:-90}"
PRODUCTS="${PLAID_PRODUCTS:-transactions,auth}"

products_json() {
  python3 -c "import json,sys; print(json.dumps([x.strip() for x in sys.argv[1].split(',') if x.strip()]))" "$PRODUCTS"
}

has_product() {
  echo "$PRODUCTS" | tr ',' '\n' | grep -qx "$1"
}

json_field() {
  python3 -c "import json,sys; d=json.load(sys.stdin); print(d$1)" 2>/dev/null || true
}

plaid_error_hint() {
  local resp="$1"
  local code msg
  code="$(echo "$resp" | json_field "['error_code']")"
  msg="$(echo "$resp" | json_field "['error_message']")"
  echo "Plaid error: ${code:-UNKNOWN} — ${msg:-see JSON above}"
  if [[ "$code" == "ITEM_LOGIN_REQUIRED" ]] || [[ "$INST" == ins_116834 ]] || [[ "$INST" == ins_117650 ]]; then
    echo "UK OAuth sandbox banks often need Link, or use the simple US sandbox:"
    echo "  ./test.sh setup-simple"
  fi
}

build_public_token_body() {
  local institution="$1"
  export PLAID_CLIENT_ID PLAID_SECRET PRODUCTS
  export PLAID_SANDBOX_USERNAME="${PLAID_SANDBOX_USERNAME:-user_good}"
  export PLAID_SANDBOX_PASSWORD="${PLAID_SANDBOX_PASSWORD:-pass_good}"
  python3 -c "
import json, os
print(json.dumps({
  'client_id': os.environ['PLAID_CLIENT_ID'],
  'secret': os.environ['PLAID_SECRET'],
  'institution_id': '$institution',
  'initial_products': [p.strip() for p in os.environ.get('PRODUCTS', 'transactions,auth').split(',') if p.strip()],
  'options': {
    'override_username': os.environ.get('PLAID_SANDBOX_USERNAME', 'user_good'),
    'override_password': os.environ.get('PLAID_SANDBOX_PASSWORD', 'pass_good'),
  },
}))
"
}

run_setup() {
  local institution="$1"
  echo "Creating sandbox public_token (institution ${institution}, products: ${PRODUCTS})…"
  public_resp="$(plaid_post "sandbox/public_token/create" "$(build_public_token_body "$institution")")"
  echo "$public_resp"
  public_token="$(echo "$public_resp" | json_field "['public_token']")"
  if [[ -z "$public_token" ]]; then
    plaid_error_hint "$public_resp"
    exit 1
  fi
  echo
  echo "Exchanging public_token for access_token…"
  exchange_resp="$(plaid_post "item/public_token/exchange" "$(cat <<EOF
{
  "client_id": "${PLAID_CLIENT_ID}",
  "secret": "${PLAID_SECRET}",
  "public_token": "${public_token}"
}
EOF
)")"
  echo "$exchange_resp"
  access="$(echo "$exchange_resp" | json_field "['access_token']")"
  if [[ -z "$access" ]]; then
    plaid_error_hint "$exchange_resp"
    exit 1
  fi
  echo
  echo "Paste into secrets.env:"
  echo "PLAID_ACCESS_TOKEN=${access}"
}

plaid_post() {
  local endpoint="$1"
  local body="$2"
  curl -sS -X POST "${BASE}/${endpoint}" \
    -H "Content-Type: application/json" \
    -d "$body"
}

require_access_token() {
  : "${PLAID_ACCESS_TOKEN:?Set PLAID_ACCESS_TOKEN in secrets.env (run: ./test.sh setup)}"
}

cmd="${1:-accounts}"

case "$cmd" in
  setup)
    run_setup "$INST"
    ;;
  setup-simple|simple)
  # Non-OAuth US sandbox bank — reliable API-only setup (no Link UI)
    run_setup "ins_109508"
    ;;
  exchange)
    : "${PLAID_PUBLIC_TOKEN:?Set PLAID_PUBLIC_TOKEN in secrets.env}"
    plaid_post "item/public_token/exchange" "$(cat <<EOF
{
  "client_id": "${PLAID_CLIENT_ID}",
  "secret": "${PLAID_SECRET}",
  "public_token": "${PLAID_PUBLIC_TOKEN}"
}
EOF
)"
    ;;
  institutions)
    plaid_post "institutions/get" "$(cat <<EOF
{
  "client_id": "${PLAID_CLIENT_ID}",
  "secret": "${PLAID_SECRET}",
  "country_codes": ["${COUNTRY}"],
  "count": 10,
  "offset": 0
}
EOF
)"
    ;;
  accounts)
    require_access_token
    plaid_post "accounts/get" "$(cat <<EOF
{
  "client_id": "${PLAID_CLIENT_ID}",
  "secret": "${PLAID_SECRET}",
  "access_token": "${PLAID_ACCESS_TOKEN}"
}
EOF
)"
    ;;
  balances|auth)
    require_access_token
    plaid_post "auth/get" "$(cat <<EOF
{
  "client_id": "${PLAID_CLIENT_ID}",
  "secret": "${PLAID_SECRET}",
  "access_token": "${PLAID_ACCESS_TOKEN}"
}
EOF
)"
    ;;
  transactions)
    require_access_token
    start_date="$(python3 -c "from datetime import date, timedelta; print((date.today()-timedelta(days=int('${DAYS}'))).isoformat())")"
    end_date="$(python3 -c "from datetime import date; print(date.today().isoformat())")"
    plaid_post "transactions/get" "$(cat <<EOF
{
  "client_id": "${PLAID_CLIENT_ID}",
  "secret": "${PLAID_SECRET}",
  "access_token": "${PLAID_ACCESS_TOKEN}",
  "start_date": "${start_date}",
  "end_date": "${end_date}"
}
EOF
)"
    ;;
  identity)
    if ! has_product identity; then
      echo "identity not in PLAID_PRODUCTS — add it only if your institution supports it."
      exit 1
    fi
    require_access_token
    plaid_post "identity/get" "$(cat <<EOF
{
  "client_id": "${PLAID_CLIENT_ID}",
  "secret": "${PLAID_SECRET}",
  "access_token": "${PLAID_ACCESS_TOKEN}"
}
EOF
)"
    ;;
  all)
    require_access_token
    echo "=== accounts ==="
    "$0" accounts
    echo
    echo "=== balances (auth) ==="
    "$0" balances
    echo
    echo "=== transactions (last ${DAYS} days) ==="
    "$0" transactions
    if has_product identity; then
      echo
      echo "=== identity ==="
      "$0" identity
    fi
    ;;
  *)
    echo "Usage: ./test.sh [setup|setup-simple|exchange|institutions|accounts|balances|transactions|identity|all]"
    exit 1
    ;;
esac

echo
