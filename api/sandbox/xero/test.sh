#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=/dev/null
source "$ROOT/secrets.env"

: "${XERO_ACCESS_TOKEN:?Set XERO_ACCESS_TOKEN in secrets.env}"
: "${XERO_TENANT_ID:?Set XERO_TENANT_ID in secrets.env}"
BASE="${XERO_API_BASE_URL:-https://api.xero.com/api.xro/2.0}"

cmd="${1:-organisation}"

case "$cmd" in
  organisation)
    path="/Organisation"
    ;;
  accounts)
    path="/Accounts"
    ;;
  *)
    echo "Usage: ./test.sh [organisation|accounts]"
    exit 1
    ;;
esac

curl -sS \
  -H "Accept: application/json" \
  -H "Authorization: Bearer ${XERO_ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  "${BASE}${path}"

echo
