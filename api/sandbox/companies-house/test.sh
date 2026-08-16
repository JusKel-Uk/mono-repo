#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=/dev/null
source "$ROOT/secrets.env"

: "${COMPANIES_HOUSE_API_KEY:?Set COMPANIES_HOUSE_API_KEY in secrets.env}"
BASE_URL="${COMPANIES_HOUSE_BASE_URL:-https://api.company-information.service.gov.uk}"

cmd="${1:-get-company}"
query="${2:-}"

case "$cmd" in
  get-company)
    number="${query:-${COMPANIES_HOUSE_TEST_COMPANY_NUMBER:-00000006}}"
    curl -sS -u "${COMPANIES_HOUSE_API_KEY}:" \
      -H "Accept: application/json" \
      "${BASE_URL}/company/${number}"
    ;;
  search)
    term="${query:-juskel}"
    encoded=$(python3 -c "import urllib.parse; print(urllib.parse.quote('${term}'))")
    curl -sS -u "${COMPANIES_HOUSE_API_KEY}:" \
      -H "Accept: application/json" \
      "${BASE_URL}/search/companies?q=${encoded}&items_per_page=5"
    ;;
  officers)
    number="${query:-${COMPANIES_HOUSE_TEST_COMPANY_NUMBER:-00000006}}"
    curl -sS -u "${COMPANIES_HOUSE_API_KEY}:" \
      -H "Accept: application/json" \
      "${BASE_URL}/company/${number}/officers"
    ;;
  psc)
    number="${query:-${COMPANIES_HOUSE_TEST_COMPANY_NUMBER:-00000006}}"
    curl -sS -u "${COMPANIES_HOUSE_API_KEY}:" \
      -H "Accept: application/json" \
      "${BASE_URL}/company/${number}/persons-with-significant-control"
    ;;
  filing-history)
    number="${query:-${COMPANIES_HOUSE_TEST_COMPANY_NUMBER:-00000006}}"
    curl -sS -u "${COMPANIES_HOUSE_API_KEY}:" \
      -H "Accept: application/json" \
      "${BASE_URL}/company/${number}/filing-history?items_per_page=5"
    ;;
  explore)
    exec "$ROOT/explore-spec.sh" "${query:-}"
    ;;
  *)
    echo "Usage: ./test.sh [get-company|search|officers|psc|filing-history|explore] [arg]"
    exit 1
    ;;
esac

echo
