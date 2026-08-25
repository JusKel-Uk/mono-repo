#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
if [[ ! -f "$ROOT/secrets.env" ]]; then
  echo "Missing secrets.env — copy secrets.env.example and fill in your Intuit sandbox credentials."
  exit 1
fi
# shellcheck source=/dev/null
source "$ROOT/secrets.env"

: "${QUICKBOOKS_REALM_ID:?Set QUICKBOOKS_REALM_ID in secrets.env}"

cmd="${1:-companyinfo}"

if [[ "$cmd" != "refresh" ]]; then
  : "${QUICKBOOKS_ACCESS_TOKEN:?Set QUICKBOOKS_ACCESS_TOKEN in secrets.env}"
fi

BASE="${QUICKBOOKS_API_BASE_URL:-https://sandbox-quickbooks.api.intuit.com/v3/company}"
MINOR="${QUICKBOOKS_MINOR_VERSION:-65}"
START="${QUICKBOOKS_REPORT_START_DATE:-2024-01-01}"
END="${QUICKBOOKS_REPORT_END_DATE:-2024-12-31}"
REALM="${QUICKBOOKS_REALM_ID}"

auth_header() {
  curl -sS \
    -H "Accept: application/json" \
    -H "Authorization: Bearer ${QUICKBOOKS_ACCESS_TOKEN}" \
    -H "Content-Type: application/json"
}

case "$cmd" in
  companyinfo)
    auth_header "${BASE}/${REALM}/companyinfo/${REALM}?minorversion=${MINOR}"
    ;;
  profit-and-loss|pnl)
    auth_header \
      "${BASE}/${REALM}/reports/ProfitAndLoss?start_date=${START}&end_date=${END}&minorversion=${MINOR}"
    ;;
  balance-sheet|balancesheet)
    auth_header \
      "${BASE}/${REALM}/reports/BalanceSheet?date=${END}&minorversion=${MINOR}"
    ;;
  accounts)
    auth_header \
      "${BASE}/${REALM}/query?query=select%20*%20from%20Account%20maxresults%2025&minorversion=${MINOR}"
    ;;
  refresh)
    : "${QUICKBOOKS_CLIENT_ID:?Set QUICKBOOKS_CLIENT_ID in secrets.env}"
    : "${QUICKBOOKS_CLIENT_SECRET:?Set QUICKBOOKS_CLIENT_SECRET in secrets.env}"
    : "${QUICKBOOKS_REFRESH_TOKEN:?Set QUICKBOOKS_REFRESH_TOKEN in secrets.env}"
    basic="$(printf '%s:%s' "$QUICKBOOKS_CLIENT_ID" "$QUICKBOOKS_CLIENT_SECRET" | base64 | tr -d '\n')"
    curl -sS -X POST "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer" \
      -H "Accept: application/json" \
      -H "Authorization: Basic ${basic}" \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "grant_type=refresh_token&refresh_token=${QUICKBOOKS_REFRESH_TOKEN}"
    ;;
  all)
    echo "=== companyinfo ==="
    "$0" companyinfo
    echo
    echo "=== profit-and-loss (${START} → ${END}) ==="
    "$0" profit-and-loss
    echo
    echo "=== balance-sheet (as of ${END}) ==="
    "$0" balance-sheet
    echo
    echo "=== accounts (sample) ==="
    "$0" accounts
    ;;
  *)
    echo "Usage: ./test.sh [companyinfo|profit-and-loss|balance-sheet|accounts|refresh|all]"
    exit 1
    ;;
esac

echo
