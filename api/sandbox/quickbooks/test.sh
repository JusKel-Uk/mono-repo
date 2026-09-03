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

if [[ "$cmd" != "refresh" && "$cmd" != "accounting-assessment" && "$cmd" != "assessment" ]]; then
  : "${QUICKBOOKS_ACCESS_TOKEN:?Set QUICKBOOKS_ACCESS_TOKEN in secrets.env}"
fi

BASE="${QUICKBOOKS_API_BASE_URL:-https://sandbox-quickbooks.api.intuit.com/v3/company}"
MINOR="${QUICKBOOKS_MINOR_VERSION:-65}"
START="${QUICKBOOKS_REPORT_START_DATE:-2026-01-01}"
END="${QUICKBOOKS_REPORT_END_DATE:-2026-12-31}"
REALM="${QUICKBOOKS_REALM_ID}"

ensure_access_token() {
  python3 -c "
import sys
from quickbooks_client import load_secrets, bearer_get, refresh_access_token, minor_version

env = load_secrets()
realm = env.get('QUICKBOOKS_REALM_ID', '').strip()
token = env.get('QUICKBOOKS_ACCESS_TOKEN', '').strip()
if not realm or not token:
    print('Missing QUICKBOOKS_ACCESS_TOKEN or QUICKBOOKS_REALM_ID.', file=sys.stderr)
    print('Get tokens via browser: cd ui && ./run-ui.sh → Connect sandbox company', file=sys.stderr)
    raise SystemExit(1)

minor = minor_version(env)
probe = bearer_get(env, f'/{realm}/companyinfo/{realm}?minorversion={minor}')
needs_refresh = probe.get('status') in (401, 403) or probe.get('fault')
if not needs_refresh:
    raise SystemExit(0)

ok, data = refresh_access_token(env)
if ok:
    raise SystemExit(0)

print('QuickBooks token expired and refresh failed.', file=sys.stderr)
print(data, file=sys.stderr)
print('', file=sys.stderr)
print('Re-authenticate in the browser:', file=sys.stderr)
print('  cd api/sandbox/quickbooks/ui && ./run-ui.sh', file=sys.stderr)
print('  Open http://127.0.0.1:8769 → Connect sandbox company', file=sys.stderr)
print('  (Whitelist redirect URI in Intuit Developer if needed)', file=sys.stderr)
raise SystemExit(1)
" || exit 1
}

if [[ "$cmd" != "refresh" && "$cmd" != "accounting-assessment" && "$cmd" != "assessment" && "$cmd" != "all" ]]; then
  ensure_access_token
fi

auth_header() {
  curl -sS \
    -H "Accept: application/json" \
    -H "Authorization: Bearer ${QUICKBOOKS_ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    "$@"
}

case "$cmd" in
  companyinfo)
    auth_header "${BASE}/${REALM}/companyinfo/${REALM}?minorversion=${MINOR}"
    ;;
  profit-and-loss|pnl)
    auth_header \
      "${BASE}/${REALM}/reports/ProfitAndLoss?start_date=${START}&end_date=${END}&minorversion=${MINOR}"
    ;;
  profit-and-loss-prior|pnl-prior)
  PRIOR_START="$(python3 -c "from datetime import date; s=date.fromisoformat('${START}'); print(s.replace(year=s.year-1))")"
  PRIOR_END="$(python3 -c "from datetime import date; e=date.fromisoformat('${END}'); print(e.replace(year=e.year-1))")"
    auth_header \
      "${BASE}/${REALM}/reports/ProfitAndLoss?start_date=${PRIOR_START}&end_date=${PRIOR_END}&minorversion=${MINOR}"
    ;;
  balance-sheet|balancesheet)
    auth_header \
      "${BASE}/${REALM}/reports/BalanceSheet?date=${END}&minorversion=${MINOR}"
    ;;
  aged-receivables|aged-ar)
    auth_header \
      "${BASE}/${REALM}/reports/AgedReceivables?report_date=${END}&minorversion=${MINOR}"
    ;;
  aged-payables|aged-ap)
    auth_header \
      "${BASE}/${REALM}/reports/AgedPayables?report_date=${END}&minorversion=${MINOR}"
    ;;
  cash-flow|cashflow)
    auth_header \
      "${BASE}/${REALM}/reports/CashFlow?start_date=${START}&end_date=${END}&minorversion=${MINOR}"
    ;;
  accounts)
    auth_header \
      "${BASE}/${REALM}/query?query=select%20*%20from%20Account%20maxresults%2025&minorversion=${MINOR}"
    ;;
  accounting-assessment|assessment)
    python3 "$ROOT/accounting_probe.py" --json
    ;;
  refresh)
    python3 -c "
from quickbooks_client import load_secrets, refresh_access_token
import json, sys
ok, data = refresh_access_token(load_secrets())
print(json.dumps(data, indent=2))
sys.exit(0 if ok else 1)
"
    ;;
  all)
    echo "=== companyinfo ==="
    "$0" companyinfo
    echo
    echo "=== profit-and-loss (${START} → ${END}) ==="
    "$0" profit-and-loss
    echo
    echo "=== profit-and-loss-prior ==="
    "$0" profit-and-loss-prior
    echo
    echo "=== balance-sheet (as of ${END}) ==="
    "$0" balance-sheet
    echo
    echo "=== aged-receivables ==="
    "$0" aged-receivables
    echo
    echo "=== aged-payables ==="
    "$0" aged-payables
    echo
    echo "=== cash-flow ==="
    "$0" cash-flow
    echo
    echo "=== accounts (sample) ==="
    "$0" accounts
    echo
    echo "=== accounting-assessment (PDF map) ==="
    "$0" accounting-assessment
    ;;
  *)
    echo "Usage: ./test.sh [companyinfo|profit-and-loss|profit-and-loss-prior|balance-sheet|aged-receivables|aged-payables|cash-flow|accounts|accounting-assessment|refresh|all]"
    exit 1
    ;;
esac

echo
