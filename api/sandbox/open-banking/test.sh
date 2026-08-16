#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=/dev/null
source "$ROOT/secrets.env"

: "${OPEN_BANKING_BASE_URL:?Set OPEN_BANKING_BASE_URL in secrets.env}"

cmd="${1:-accounts}"

case "$cmd" in
  token)
    : "${OPEN_BANKING_TOKEN_URL:?Set OPEN_BANKING_TOKEN_URL}"
    : "${OPEN_BANKING_CLIENT_ID:?Set OPEN_BANKING_CLIENT_ID}"
    : "${OPEN_BANKING_CLIENT_SECRET:?Set OPEN_BANKING_CLIENT_SECRET}"
    curl -sS -X POST "$OPEN_BANKING_TOKEN_URL" \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -H "Accept: application/json" \
      -d "grant_type=client_credentials" \
      -d "client_id=${OPEN_BANKING_CLIENT_ID}" \
      -d "client_secret=${OPEN_BANKING_CLIENT_SECRET}" \
      -d "scope=accounts"
    ;;
  accounts)
    : "${OPEN_BANKING_ACCESS_TOKEN:?Set OPEN_BANKING_ACCESS_TOKEN (run token flow first)}"
    headers=(-H "Accept: application/json" -H "Authorization: Bearer ${OPEN_BANKING_ACCESS_TOKEN}")
    if [[ -n "${OPEN_BANKING_FINANCIAL_ID:-}" ]]; then
      headers+=(-H "x-fapi-financial-id: ${OPEN_BANKING_FINANCIAL_ID}")
    fi
    curl -sS "${headers[@]}" "${OPEN_BANKING_BASE_URL}/accounts"
    ;;
  *)
    echo "Usage: ./test.sh [token|accounts]"
    exit 1
    ;;
esac

echo
