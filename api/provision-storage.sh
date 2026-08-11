#!/usr/bin/env bash
# Provision Azure Blob Storage for juskel email images.
# Usage: ./provision-storage.sh

set -euo pipefail

API_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$API_DIR"

ENV_FILE="${DEPLOY_AZURE_ENV:-$API_DIR/deploy-azure.env}"

load_env_file() {
  local file="$1"
  local line key value
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" =~ ^[[:space:]]*$ ]] && continue
    [[ "$line" != *"="* ]] && continue
    key="${line%%=*}"
    value="${line#*=}"
    key="${key%"${key##*[![:space:]]}"}"
    key="${key#"${key%%[![:space:]]*}"}"
    if [[ "$value" =~ ^\'(.*)\'$ ]]; then
      value="${BASH_REMATCH[1]}"
    elif [[ "$value" =~ ^\"(.*)\"$ ]]; then
      value="${BASH_REMATCH[1]}"
    fi
    export "$key=$value"
  done < "$file"
}

if [[ -f "$ENV_FILE" ]]; then
  load_env_file "$ENV_FILE"
fi

: "${AZURE_RESOURCE_GROUP:=DevTest}"
: "${AZURE_LOCATION:=uksouth}"
: "${AZURE_STORAGE_ACCOUNT:=juskeldevstore}"
: "${AZURE_STORAGE_CONTAINER:=email}"
ASSETS_SOURCE="${ASSETS_SOURCE:-$API_DIR/src/Infrastructure/juskel.Email/Templates/assets}"

if ! command -v az >/dev/null 2>&1; then
  echo "Azure CLI not found. Install with: brew install azure-cli"
  exit 1
fi

if ! az account show >/dev/null 2>&1; then
  echo "Not logged in. Run: az login"
  exit 1
fi

if [[ ! -d "$ASSETS_SOURCE" ]]; then
  echo "Assets folder not found: $ASSETS_SOURCE"
  exit 1
fi

echo "Registering Microsoft.Storage provider (if needed)..."
az provider register -n Microsoft.Storage --wait -o none

if ! az storage account show --name "$AZURE_STORAGE_ACCOUNT" --resource-group "$AZURE_RESOURCE_GROUP" >/dev/null 2>&1; then
  echo "Creating storage account $AZURE_STORAGE_ACCOUNT..."
  az storage account create \
    --name "$AZURE_STORAGE_ACCOUNT" \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --location "$AZURE_LOCATION" \
    --sku Standard_LRS \
    --kind StorageV2 \
    --access-tier Hot \
    --allow-blob-public-access true \
    -o none
else
  echo "Storage account $AZURE_STORAGE_ACCOUNT already exists."
fi

echo "Ensuring blob container '$AZURE_STORAGE_CONTAINER'..."
STORAGE_KEY="$(az storage account keys list \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --account-name "$AZURE_STORAGE_ACCOUNT" \
  --query "[0].value" -o tsv)"

if az storage container exists \
  --account-name "$AZURE_STORAGE_ACCOUNT" \
  --name "$AZURE_STORAGE_CONTAINER" \
  --account-key "$STORAGE_KEY" \
  --query exists -o tsv | grep -q true; then
  echo "Container already exists."
else
  az storage container create \
    --account-name "$AZURE_STORAGE_ACCOUNT" \
    --name "$AZURE_STORAGE_CONTAINER" \
    --public-access blob \
    --account-key "$STORAGE_KEY" \
    -o none
fi

echo "Uploading email assets from $ASSETS_SOURCE..."
az storage blob upload-batch \
  --account-name "$AZURE_STORAGE_ACCOUNT" \
  --destination "$AZURE_STORAGE_CONTAINER" \
  --source "$ASSETS_SOURCE" \
  --pattern "*.png" \
  --overwrite \
  --account-key "$STORAGE_KEY" \
  -o none

ASSETS_BASE_URL="https://${AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/${AZURE_STORAGE_CONTAINER}"
BLOB_HOST="${AZURE_STORAGE_ACCOUNT}.blob.core.windows.net"

echo
echo "Storage provisioned."
echo "Assets base URL: $ASSETS_BASE_URL"
echo "Test: ${ASSETS_BASE_URL}/header-banner.png"
echo
echo "Update deploy-azure.env:"
echo "  EMAIL__ASSETSBASEURL=${ASSETS_BASE_URL}"
