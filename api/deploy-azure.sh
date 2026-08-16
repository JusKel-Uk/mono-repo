#!/usr/bin/env bash
# Deploy juskel API to Azure Container Apps (scale-to-zero).
#
# First-time setup:
#   1. cp deploy-azure.env.example deploy-azure.env
#   2. Fill in deploy-azure.env (never commit it)
#   3. az login
#   4. ./deploy-azure.sh bootstrap   # once: register providers + ACR + env
#   5. ./deploy-azure.sh deploy     # build image + deploy / update app
#
# Usage:
#   ./deploy-azure.sh bootstrap
#   ./deploy-azure.sh deploy
#   ./deploy-azure.sh status

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
: "${AZURE_ACR_NAME:=juskeldevacr}"
: "${AZURE_CONTAINERAPPS_ENV:=juskel-dev-env}"
: "${AZURE_CONTAINER_APP:=juskel-api}"
: "${AZURE_LOG_ANALYTICS:=juskel-dev-logs}"
: "${AZURE_IMAGE_NAME:=juskel-api}"
: "${AZURE_IMAGE_TAG:=latest}"
: "${ASPNETCORE_ENVIRONMENT:=Development}"

require_az() {
  if ! command -v az >/dev/null 2>&1; then
    echo "Azure CLI not found. Install with: brew install azure-cli"
    exit 1
  fi
  if ! az account show >/dev/null 2>&1; then
    echo "Not logged in. Run: az login"
    exit 1
  fi
}

require_secrets() {
  local missing=()
  [[ -n "${CONNECTIONSTRINGS__IDENTITY:-}" ]] || missing+=("CONNECTIONSTRINGS__IDENTITY")
  [[ -n "${JWT__SECRET:-}" ]] || missing+=("JWT__SECRET")
  [[ -n "${ENCRYPTION__FIELDKEY:-}" ]] || missing+=("ENCRYPTION__FIELDKEY")
  [[ -n "${ENCRYPTION__EMAILLOOKUPKEY:-}" ]] || missing+=("ENCRYPTION__EMAILLOOKUPKEY")
  [[ -n "${EMAIL__RESEND__APIKEY:-}" ]] || missing+=("EMAIL__RESEND__APIKEY")

  if ((${#missing[@]} > 0)); then
    echo "Missing required values in $ENV_FILE:"
    printf '  - %s\n' "${missing[@]}"
    echo "Copy deploy-azure.env.example to deploy-azure.env and fill them in."
    exit 1
  fi
}

register_providers() {
  echo "Registering Azure resource providers (first run can take a few minutes)..."
  az provider register -n Microsoft.App --wait
  az provider register -n Microsoft.OperationalInsights --wait
  az provider register -n Microsoft.ContainerRegistry --wait
  az provider register -n Microsoft.Insights --wait
}

bootstrap() {
  require_az
  register_providers

  echo "Ensuring resource group $AZURE_RESOURCE_GROUP..."
  az group create --name "$AZURE_RESOURCE_GROUP" --location "$AZURE_LOCATION" -o none

  if ! az acr show --name "$AZURE_ACR_NAME" --resource-group "$AZURE_RESOURCE_GROUP" >/dev/null 2>&1; then
    echo "Creating Azure Container Registry $AZURE_ACR_NAME (Basic)..."
    az acr create \
      --resource-group "$AZURE_RESOURCE_GROUP" \
      --name "$AZURE_ACR_NAME" \
      --sku Basic \
      --admin-enabled false \
      -o none
  else
    echo "ACR $AZURE_ACR_NAME already exists."
  fi

  if ! az monitor log-analytics workspace show \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --workspace-name "$AZURE_LOG_ANALYTICS" >/dev/null 2>&1; then
    echo "Creating Log Analytics workspace $AZURE_LOG_ANALYTICS..."
    az monitor log-analytics workspace create \
      --resource-group "$AZURE_RESOURCE_GROUP" \
      --workspace-name "$AZURE_LOG_ANALYTICS" \
      -o none
  else
    echo "Log Analytics workspace $AZURE_LOG_ANALYTICS already exists."
  fi

  local log_id log_key
  log_id="$(az monitor log-analytics workspace show \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --workspace-name "$AZURE_LOG_ANALYTICS" \
    --query customerId -o tsv)"
  log_key="$(az monitor log-analytics workspace get-shared-keys \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --workspace-name "$AZURE_LOG_ANALYTICS" \
    --query primarySharedKey -o tsv)"

  if ! az containerapp env show \
    --name "$AZURE_CONTAINERAPPS_ENV" \
    --resource-group "$AZURE_RESOURCE_GROUP" >/dev/null 2>&1; then
    echo "Creating Container Apps environment $AZURE_CONTAINERAPPS_ENV..."
    az containerapp env create \
      --name "$AZURE_CONTAINERAPPS_ENV" \
      --resource-group "$AZURE_RESOURCE_GROUP" \
      --location "$AZURE_LOCATION" \
      --logs-workspace-id "$log_id" \
      --logs-workspace-key "$log_key" \
      -o none
  else
    echo "Container Apps environment $AZURE_CONTAINERAPPS_ENV already exists."
  fi

  echo "Bootstrap complete."
}

build_and_push_image() {
  echo "Building and pushing image in ACR (no local Docker required)..."
  az acr build \
    --registry "$AZURE_ACR_NAME" \
    --image "${AZURE_IMAGE_NAME}:${AZURE_IMAGE_TAG}" \
    --file Dockerfile \
    .
}

deploy_app() {
  require_az
  require_secrets

  local acr_login_server image
  acr_login_server="$(az acr show --name "$AZURE_ACR_NAME" --resource-group "$AZURE_RESOURCE_GROUP" --query loginServer -o tsv)"
  image="${acr_login_server}/${AZURE_IMAGE_NAME}:${AZURE_IMAGE_TAG}"

  build_and_push_image

  local env_vars=(
    "ASPNETCORE_ENVIRONMENT=${ASPNETCORE_ENVIRONMENT}"
    "Email__Provider=${EMAIL__PROVIDER:-Resend}"
    "Email__DefaultFrom=${EMAIL__DEFAULTFROM:-juskel <hello@juskel.co.uk>}"
    "Email__AssetsBaseUrl=${EMAIL__ASSETSBASEURL:-https://cdn.juskel.com/email}"
    "Cors__AllowedOrigins__0=http://localhost:3000"
    "Cors__AllowedOrigins__1=https://mono-repo-n96q.vercel.app"
    "Encryption__FieldKey=secretref:field-encryption-key"
    "Encryption__EmailLookupKey=secretref:email-lookup-key"
    "ConnectionStrings__Identity=secretref:sql-connection-string"
    "Jwt__Secret=secretref:jwt-secret"
    "Email__Resend__ApiKey=secretref:resend-api-key"
  )

  if az containerapp show --name "$AZURE_CONTAINER_APP" --resource-group "$AZURE_RESOURCE_GROUP" >/dev/null 2>&1; then
    echo "Updating container app $AZURE_CONTAINER_APP..."
    az containerapp secret set \
      --name "$AZURE_CONTAINER_APP" \
      --resource-group "$AZURE_RESOURCE_GROUP" \
      --secrets \
        "sql-connection-string=${CONNECTIONSTRINGS__IDENTITY}" \
        "jwt-secret=${JWT__SECRET}" \
        "field-encryption-key=${ENCRYPTION__FIELDKEY}" \
        "email-lookup-key=${ENCRYPTION__EMAILLOOKUPKEY}" \
        "resend-api-key=${EMAIL__RESEND__APIKEY}" \
      -o none

    az containerapp update \
      --name "$AZURE_CONTAINER_APP" \
      --resource-group "$AZURE_RESOURCE_GROUP" \
      --image "$image" \
      --revision-suffix "${AZURE_REVISION_SUFFIX:-$(date +%Y%m%d%H%M%S)}" \
      --replace-env-vars "${env_vars[@]}" \
      -o none
  else
    echo "Creating container app $AZURE_CONTAINER_APP..."
    az containerapp create \
      --name "$AZURE_CONTAINER_APP" \
      --resource-group "$AZURE_RESOURCE_GROUP" \
      --environment "$AZURE_CONTAINERAPPS_ENV" \
      --image "$image" \
      --target-port 8080 \
      --ingress external \
      --registry-server "$acr_login_server" \
      --registry-identity system \
      --system-assigned \
      --min-replicas 0 \
      --max-replicas 2 \
      --cpu 0.25 \
      --memory 0.5Gi \
      --secrets \
        "sql-connection-string=${CONNECTIONSTRINGS__IDENTITY}" \
        "jwt-secret=${JWT__SECRET}" \
        "field-encryption-key=${ENCRYPTION__FIELDKEY}" \
        "email-lookup-key=${ENCRYPTION__EMAILLOOKUPKEY}" \
        "resend-api-key=${EMAIL__RESEND__APIKEY}" \
      --env-vars "${env_vars[@]}" \
      -o none

    echo "Granting ACR pull permission to container app identity..."
    local principal_id acr_id
    principal_id="$(az containerapp show \
      --name "$AZURE_CONTAINER_APP" \
      --resource-group "$AZURE_RESOURCE_GROUP" \
      --query identity.principalId -o tsv)"
    acr_id="$(az acr show --name "$AZURE_ACR_NAME" --resource-group "$AZURE_RESOURCE_GROUP" --query id -o tsv)"
    az role assignment create \
      --assignee "$principal_id" \
      --role AcrPull \
      --scope "$acr_id" \
      -o none 2>/dev/null || true
  fi

  local fqdn
  fqdn="$(az containerapp show \
    --name "$AZURE_CONTAINER_APP" \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --query properties.configuration.ingress.fqdn -o tsv)"

  echo
  echo "Deployed."
  echo "URL: https://${fqdn}"
  echo "Health: https://${fqdn}/health"
}

status() {
  require_az
  az containerapp show \
    --name "$AZURE_CONTAINER_APP" \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --query "{name:name, fqdn:properties.configuration.ingress.fqdn, provisioning:properties.provisioningState, replicas:properties.template.scale}" \
    -o jsonc 2>/dev/null || echo "Container app not found. Run ./deploy-azure.sh bootstrap then deploy."
}

case "${1:-}" in
  bootstrap) bootstrap ;;
  deploy) deploy_app ;;
  status) status ;;
  *)
    echo "Usage: ./deploy-azure.sh {bootstrap|deploy|status}"
    exit 1
    ;;
esac
