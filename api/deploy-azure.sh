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
: "${AZURE_STORAGE_ACCOUNT:=juskeldevstore}"
: "${INTEGRATIONS__BLOBSTORAGE__PROVIDER:=Azure}"
: "${INTEGRATIONS__BLOBSTORAGE__AZURECONTAINERNAME:=evidence}"

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

  # All modules share the same Azure SQL database (different schemas).
  : "${CONNECTIONSTRINGS__ONBOARDING:=${CONNECTIONSTRINGS__IDENTITY}}"
  : "${CONNECTIONSTRINGS__FUNDING:=${CONNECTIONSTRINGS__IDENTITY}}"
  : "${CONNECTIONSTRINGS__SCORING:=${CONNECTIONSTRINGS__IDENTITY}}"
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

ensure_evidence_blob_container() {
  local container_name="$INTEGRATIONS__BLOBSTORAGE__AZURECONTAINERNAME"
  echo "Ensuring blob container '$container_name' on $AZURE_STORAGE_ACCOUNT..."

  if ! az storage account show --name "$AZURE_STORAGE_ACCOUNT" --resource-group "$AZURE_RESOURCE_GROUP" >/dev/null 2>&1; then
    echo "Storage account $AZURE_STORAGE_ACCOUNT not found. Run ./provision-storage.sh first."
    exit 1
  fi

  local storage_key
  storage_key="$(az storage account keys list \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --account-name "$AZURE_STORAGE_ACCOUNT" \
    --query "[0].value" -o tsv)"

  if az storage container exists \
    --account-name "$AZURE_STORAGE_ACCOUNT" \
    --name "$container_name" \
    --account-key "$storage_key" \
    --query exists -o tsv | grep -q true; then
    echo "Blob container '$container_name' already exists."
  else
    az storage container create \
      --account-name "$AZURE_STORAGE_ACCOUNT" \
      --name "$container_name" \
      --public-access off \
      --account-key "$storage_key" \
      -o none
    echo "Created private blob container '$container_name'."
  fi
}

resolve_blob_connection_string() {
  if [[ -n "${INTEGRATIONS__BLOBSTORAGE__AZURECONNECTIONSTRING:-}" ]]; then
    printf '%s' "$INTEGRATIONS__BLOBSTORAGE__AZURECONNECTIONSTRING"
    return
  fi

  az storage account show-connection-string \
    --name "$AZURE_STORAGE_ACCOUNT" \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --query connectionString \
    -o tsv
}

deploy_app() {
  require_az
  require_secrets

  local acr_login_server image fqdn api_base_url
  acr_login_server="$(az acr show --name "$AZURE_ACR_NAME" --resource-group "$AZURE_RESOURCE_GROUP" --query loginServer -o tsv)"
  image="${acr_login_server}/${AZURE_IMAGE_NAME}:${AZURE_IMAGE_TAG}"

  if az containerapp show --name "$AZURE_CONTAINER_APP" --resource-group "$AZURE_RESOURCE_GROUP" >/dev/null 2>&1; then
    fqdn="$(az containerapp show \
      --name "$AZURE_CONTAINER_APP" \
      --resource-group "$AZURE_RESOURCE_GROUP" \
      --query properties.configuration.ingress.fqdn -o tsv)"
  else
    fqdn="${AZURE_API_FQDN:-}"
  fi

  api_base_url="${AZURE_API_BASE_URL:-${fqdn:+https://${fqdn}}}"
  if [[ -z "$api_base_url" ]]; then
    echo "Set AZURE_API_BASE_URL or AZURE_API_FQDN in deploy-azure.env for first-time OAuth redirect URIs."
    exit 1
  fi

  build_and_push_image

  if [[ "${INTEGRATIONS__BLOBSTORAGE__PROVIDER}" == "Azure" ]]; then
    ensure_evidence_blob_container
  fi

  local blob_connection_string=""
  if [[ "${INTEGRATIONS__BLOBSTORAGE__PROVIDER}" == "Azure" ]]; then
    blob_connection_string="$(resolve_blob_connection_string)"
    if [[ -z "$blob_connection_string" ]]; then
      echo "Azure blob storage connection string could not be resolved."
      exit 1
    fi
  fi

  local ch_base_url="${INTEGRATIONS__COMPANIESHOUSE__BASEURL:-https://api.company-information.service.gov.uk}"
  local ch_api_key="${INTEGRATIONS__COMPANIESHOUSE__APIKEY:-}"
  local qb_client_id="${INTEGRATIONS__QUICKBOOKS__CLIENTID:-}"
  local qb_client_secret="${INTEGRATIONS__QUICKBOOKS__CLIENTSECRET:-}"
  local qb_api_base="${INTEGRATIONS__QUICKBOOKS__APIBASEURL:-https://sandbox-quickbooks.api.intuit.com/v3/company}"
  local qb_report_start="${INTEGRATIONS__QUICKBOOKS__REPORTSTARTDATE:-2026-01-01}"
  local qb_report_end="${INTEGRATIONS__QUICKBOOKS__REPORTENDDATE:-2026-12-31}"

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
    "ConnectionStrings__Onboarding=secretref:sql-connection-string"
    "ConnectionStrings__Funding=secretref:sql-connection-string"
    "ConnectionStrings__Scoring=secretref:sql-connection-string"
    "Jwt__Secret=secretref:jwt-secret"
    "Email__Resend__ApiKey=secretref:resend-api-key"
    "Integrations__CompaniesHouse__BaseUrl=${ch_base_url}"
    "Integrations__OpenBanking__RedirectUri=${api_base_url}/funding/integrations/open-banking/callback"
    "Integrations__Xero__RedirectUri=${api_base_url}/funding/integrations/xero/callback"
    "Integrations__QuickBooks__RedirectUri=${api_base_url}/funding/integrations/quickbooks/callback"
    "Integrations__QuickBooks__ApiBaseUrl=${qb_api_base}"
    "Integrations__QuickBooks__ReportStartDate=${qb_report_start}"
    "Integrations__QuickBooks__ReportEndDate=${qb_report_end}"
    "Integrations__BlobStorage__Provider=${INTEGRATIONS__BLOBSTORAGE__PROVIDER}"
    "Integrations__BlobStorage__AzureContainerName=${INTEGRATIONS__BLOBSTORAGE__AZURECONTAINERNAME}"
  )

  if [[ "${INTEGRATIONS__BLOBSTORAGE__PROVIDER}" == "Azure" ]]; then
    env_vars+=("Integrations__BlobStorage__AzureConnectionString=secretref:blob-storage-connection-string")
  fi

  if [[ -n "$ch_api_key" ]]; then
    env_vars+=("Integrations__CompaniesHouse__ApiKey=secretref:companies-house-api-key")
  else
    echo "Warning: INTEGRATIONS__COMPANIESHOUSE__APIKEY not set — Companies House verify will return 404."
  fi

  if [[ -n "$qb_client_id" && -n "$qb_client_secret" ]]; then
    env_vars+=("Integrations__QuickBooks__ClientId=secretref:quickbooks-client-id")
    env_vars+=("Integrations__QuickBooks__ClientSecret=secretref:quickbooks-client-secret")
  else
    echo "Warning: INTEGRATIONS__QUICKBOOKS__CLIENTID/CLIENTSECRET not set — QuickBooks OAuth uses stub mode."
  fi

  local app_secrets=(
    "sql-connection-string=${CONNECTIONSTRINGS__IDENTITY}"
    "jwt-secret=${JWT__SECRET}"
    "field-encryption-key=${ENCRYPTION__FIELDKEY}"
    "email-lookup-key=${ENCRYPTION__EMAILLOOKUPKEY}"
    "resend-api-key=${EMAIL__RESEND__APIKEY}"
  )
  if [[ -n "$ch_api_key" ]]; then
    app_secrets+=("companies-house-api-key=${ch_api_key}")
  fi
  if [[ -n "$qb_client_id" && -n "$qb_client_secret" ]]; then
    app_secrets+=("quickbooks-client-id=${qb_client_id}")
    app_secrets+=("quickbooks-client-secret=${qb_client_secret}")
  fi
  if [[ -n "$blob_connection_string" ]]; then
    app_secrets+=("blob-storage-connection-string=${blob_connection_string}")
  fi

  if az containerapp show --name "$AZURE_CONTAINER_APP" --resource-group "$AZURE_RESOURCE_GROUP" >/dev/null 2>&1; then
    echo "Updating container app $AZURE_CONTAINER_APP..."
    az containerapp secret set \
      --name "$AZURE_CONTAINER_APP" \
      --resource-group "$AZURE_RESOURCE_GROUP" \
      --secrets "${app_secrets[@]}" \
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
      --secrets "${app_secrets[@]}" \
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

  fqdn="$(az containerapp show \
    --name "$AZURE_CONTAINER_APP" \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --query properties.configuration.ingress.fqdn -o tsv)"

  echo
  echo "Deployed."
  echo "URL: https://${fqdn}"
  echo "Health: https://${fqdn}/health"
  if [[ -n "$ch_api_key" ]]; then
    echo
    echo "Companies House: same live API key as local (no new key required)."
    echo "Azure Container Apps use many dynamic outbound IPs — IP allowlisting is impractical."
    echo "In the CH developer portal, use a server key WITHOUT IP restrictions for Azure,"
    echo "or create a separate 'juskel-azure' application key for production calls."
  fi
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
