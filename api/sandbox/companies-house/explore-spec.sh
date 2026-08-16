#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if [[ ! -f secrets.env ]]; then
  echo "Create secrets.env first:"
  echo "  cp secrets.env.example secrets.env"
  echo "  # then set COMPANIES_HOUSE_API_KEY=your-key"
  exit 1
fi

python3 explore-spec.py ${1:+"$1"}
