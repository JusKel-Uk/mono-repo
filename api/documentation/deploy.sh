#!/usr/bin/env bash
# Deploy juskel technology docs to Netlify.
# Usage:
#   ./deploy.sh          # draft / preview URL
#   ./deploy.sh --prod   # production

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v netlify >/dev/null 2>&1; then
  echo "Netlify CLI not found. Install with:"
  echo "  brew install netlify-cli"
  echo "  # or: npm install -g netlify-cli"
  exit 1
fi

if [[ ! -d ".netlify" ]]; then
  echo "This folder is not linked to a Netlify site yet."
  echo "Run once:"
  echo "  cd api/documentation"
  echo "  netlify login"
  echo "  netlify link    # pick existing site: juskel"
  exit 1
fi

if [[ "${1:-}" == "--prod" ]]; then
  echo "Deploying to production..."
  netlify deploy --prod --dir .
else
  echo "Deploying draft (preview)..."
  netlify deploy --dir .
fi
