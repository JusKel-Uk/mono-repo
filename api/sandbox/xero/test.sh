#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
if [[ ! -f "$ROOT/secrets.env" ]]; then
  echo "Missing secrets.env — copy secrets.env.example and fill in your Xero credentials."
  exit 1
fi
# shellcheck source=/dev/null
source "$ROOT/secrets.env"

: "${XERO_TENANT_ID:?Set XERO_TENANT_ID in secrets.env}"

cmd="${1:-organisation}"

if [[ "$cmd" != "refresh" ]]; then
  : "${XERO_ACCESS_TOKEN:?Set XERO_ACCESS_TOKEN in secrets.env}"
fi

BASE="${XERO_API_BASE_URL:-https://api.xero.com/api.xro/2.0}"
FROM="${XERO_REPORT_FROM_DATE:-2024-01-01}"
TO="${XERO_REPORT_TO_DATE:-2024-12-31}"
BS_DATE="${XERO_BALANCE_SHEET_DATE:-2024-12-31}"

xero_get() {
  curl -sS \
    -H "Accept: application/json" \
    -H "Authorization: Bearer ${XERO_ACCESS_TOKEN}" \
    -H "xero-tenant-id: ${XERO_TENANT_ID}" \
    "${BASE}${1}"
}

case "$cmd" in
  organisation|org)
    xero_get "/Organisation"
    ;;
  accounts)
    xero_get "/Accounts"
    ;;
  profit-and-loss|pnl)
    xero_get "/Reports/ProfitAndLoss?fromDate=${FROM}&toDate=${TO}"
    ;;
  balance-sheet|balancesheet)
    xero_get "/Reports/BalanceSheet?date=${BS_DATE}"
    ;;
  refresh)
    : "${XERO_CLIENT_ID:?Set XERO_CLIENT_ID in secrets.env}"
    : "${XERO_CLIENT_SECRET:?Set XERO_CLIENT_SECRET in secrets.env}"
    : "${XERO_REFRESH_TOKEN:?Set XERO_REFRESH_TOKEN in secrets.env}"
    basic="$(printf '%s:%s' "$XERO_CLIENT_ID" "$XERO_CLIENT_SECRET" | base64 | tr -d '\n')"
    curl -sS -X POST "https://identity.xero.com/connect/token" \
      -H "Accept: application/json" \
      -H "Authorization: Basic ${basic}" \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "grant_type=refresh_token&refresh_token=${XERO_REFRESH_TOKEN}"
    ;;
  all)
    echo "=== organisation ==="
    "$0" organisation
    echo
    echo "=== accounts ==="
    "$0" accounts
    echo
    echo "=== profit-and-loss (${FROM} → ${TO}) ==="
    "$0" profit-and-loss
    echo
    echo "=== balance-sheet (${BS_DATE}) ==="
    "$0" balance-sheet
    ;;
  *)
    echo "Usage: ./test.sh [organisation|accounts|profit-and-loss|balance-sheet|refresh|all]"
    exit 1
    ;;
esac

echo
