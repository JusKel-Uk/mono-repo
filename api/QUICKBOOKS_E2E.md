# QuickBooks Online — end-to-end integration guide

Connect juskel’s funding module to **Intuit QuickBooks Online (sandbox)** with OAuth, financial sync, and persisted bands in `funding.FinancialProfiles` + `funding.IntegrationConnections`.

## What gets persisted

| Store | Table / column | Content |
|-------|----------------|---------|
| OAuth tokens | `funding.IntegrationConnections` | Encrypted access + refresh tokens, `ExternalRealmId`, `ExpiresAt` |
| QB snapshot metadata | `funding.IntegrationConnections.ProviderMetadataJson` | Company name, currency, period, summary totals, `syncedAt` |
| Layer-2 accounting metrics | `funding.FinancialIntegrationMetrics` | Full QBO-derived amounts (revenue, balance sheet, ratios) — exposed as `integrationMetrics` on GET financial-profile |
| Onboarding bands | `funding.FinancialProfiles` | `annualRevenueBand`, `ebitdaBand`, `existingDebtBand`, `cashReserves`, `avgMonthlyRevenue`, `bandsLockedByIntegration: true` |

After a successful callback, `GET /funding/applications/current/financial-profile` returns locked bands plus `integrationMetrics` (Layer-2 amounts from QBO reports).

## Prerequisites

1. **Intuit Developer app** with **QuickBooks Online Accounting** scope (`com.intuit.quickbooks.accounting`).
2. **Sandbox company** — created automatically when you connect via OAuth in the Intuit sandbox.
3. Same **Client ID / Client Secret** you use in `api/sandbox/quickbooks/secrets.env` (Development keys).

### Intuit redirect URIs (Keys & OAuth → Development)

Add **every** URL your API will use:

| Environment | Redirect URI |
|-------------|--------------|
| Local API | `http://localhost:5242/funding/integrations/quickbooks/callback` |
| Staging API | `https://juskel-api.livelydune-575d8971.uksouth.azurecontainerapps.io/funding/integrations/quickbooks/callback` |

> Intuit rejects IP literals (`127.0.0.1`). Use `localhost` for local API callbacks. The Python sandbox UI may still need ngrok — that is separate from the .NET API flow.

## Configuration

### Local (`appsettings.Development.json`)

Copy from `api/sandbox/quickbooks/secrets.env` into `Integrations:QuickBooks`:

```json
"QuickBooks": {
  "ClientId": "<from QUICKBOOKS_CLIENT_ID>",
  "ClientSecret": "<from QUICKBOOKS_CLIENT_SECRET>",
  "RedirectUri": "http://localhost:5242/funding/integrations/quickbooks/callback",
  "ApiBaseUrl": "https://sandbox-quickbooks.api.intuit.com/v3/company",
  "MinorVersion": "65",
  "ReportStartDate": "2026-01-01",
  "ReportEndDate": "2026-12-31"
}
```

**Report dates:** If your sandbox company started in 2026 (common for new sandboxes), use 2026 dates. Using 2024 returns `NoReportData` and bands fall back to account balances only.

### Staging (Azure Container Apps)

In `deploy-azure.env` (from `deploy-azure.env.example`):

```bash
INTEGRATIONS__QUICKBOOKS__CLIENTID='your-intuit-sandbox-client-id'
INTEGRATIONS__QUICKBOOKS__CLIENTSECRET='your-intuit-sandbox-client-secret'
INTEGRATIONS__QUICKBOOKS__APIBASEURL=https://sandbox-quickbooks.api.intuit.com/v3/company
INTEGRATIONS__QUICKBOOKS__REPORTSTARTDATE=2026-01-01
INTEGRATIONS__QUICKBOOKS__REPORTENDDATE=2026-12-31
```

`deploy-azure.sh` sets `Integrations__QuickBooks__RedirectUri` to `{AZURE_API_BASE_URL}/funding/integrations/quickbooks/callback` automatically.

Redeploy after updating secrets:

```bash
cd api && ./deploy-azure.sh deploy
```

## Stub mode (no Intuit credentials)

If `ClientId` or `ClientSecret` is empty, the API runs in **stub mode**:

- OAuth authorize still returns a URL (stub token exchange on callback).
- Callback persists stub financial data (e.g. £750k revenue bands) and locks bands — useful for e2e and frontend without Intuit.

Run: `node api/scripts/e2e-onboarding-api.mjs` — asserts `bandsLockedByIntegration: true` after QB callback.

## Swagger / manual test flow (local)

1. Start API: `cd api/src/Host/juskel.Api && dotnet run` → `http://localhost:5242/swagger`
2. **Register** → `POST /identity/register` → copy `accessToken`
3. **Authorize** in Swagger (Bearer token)
4. **Create application** → `POST /onboarding/applications`
5. **Start QB OAuth** → `POST /funding/integrations/quickbooks/authorize`
   - Response: `{ "authorizationUrl": "...", "state": "..." }`
6. Open `authorizationUrl` in a browser → sign in to Intuit sandbox → pick sandbox company → approve
7. Intuit redirects to your callback with `code`, `state`, `realmId` (or `realmID`)
8. API exchanges code, fetches company info + P&amp;L (current + prior) + balance sheet + aged AR/AP + cash flow + paginated accounts, maps bands + persists `FinancialIntegrationMetrics`, saves DB
9. **Verify** → `GET /funding/applications/current/financial-profile`
   - Expect: `bandsLockedByIntegration: true`, populated bands, `integrations` includes QuickBooks (`provider: 3`) connected
10. **Disconnect** (optional) → `DELETE /funding/integrations/quickbooks` unlocks bands

### Staging Swagger

Same steps at:

`https://juskel-api.livelydune-575d8971.uksouth.azurecontainerapps.io/swagger`

Ensure the staging redirect URI is whitelisted in Intuit **before** testing.

## Test credentials for frontend developer

There is **no shared static username/password** — each developer uses their own Intuit Developer account and sandbox company.

Share with frontend:

| Item | Value |
|------|--------|
| API base (local) | `http://localhost:5242` |
| API base (staging) | `https://juskel-api.livelydune-575d8971.uksouth.azurecontainerapps.io` |
| Authorize endpoint | `POST /funding/integrations/quickbooks/authorize` (JWT required) |
| Callback (browser redirect) | Handled by API — frontend opens `authorizationUrl` from authorize response |
| Financial profile GET | `GET /funding/applications/current/financial-profile` |
| Provider enum | `IntegrationProvider.QuickBooks = 3` |

**Intuit sandbox sign-in:** Use the Intuit Developer account that owns the app. On OAuth, select the **sandbox company** (not production). Realm ID is returned on callback and stored server-side — frontend does not need it.

For **stub testing without Intuit**, leave ClientId/Secret empty; callback with any `code` + valid `state` from authorize still persists stub bands.

## Database migration

On startup, `MigrateFundingAsync()` applies pending funding migrations, including:

- `20260901220000_AddQuickBooksConnectionMetadata` (`ExternalRealmId`, `ProviderMetadataJson`)
- `20260902173000_AddFinancialIntegrationMetrics` (`funding.FinancialIntegrationMetrics` — QB Layer-2 metrics)

Manual apply (if needed):

```bash
cd api/src/Host/juskel.Api
dotnet ef database update \
  --project ../../Modules/funding/funding.Core/funding.Core.csproj \
  --context FundingDbContext
```

Verify:

```sql
SELECT MigrationId FROM funding.__EFMigrationsHistory ORDER BY MigrationId;
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'funding' AND TABLE_NAME = 'FinancialIntegrationMetrics';
```

## API endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/funding/integrations/quickbooks/authorize` | JWT | Returns Intuit authorization URL |
| GET | `/funding/integrations/quickbooks/callback` | None | Intuit redirect; query: `code`, `state`, `realmId` |
| DELETE | `/funding/integrations/quickbooks` | JWT | Disconnect; unlocks bands |

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `redirect_uri mismatch` | Add exact callback URL in Intuit portal (local vs staging) |
| Bands empty / only cash mapped | Set `ReportStartDate`/`ReportEndDate` to include company start year |
| `401` from Intuit API | Token expired — reconnect; refresh handled on sync |
| Callback 400 | Missing `code` or `state` |
| PUT financial-profile 400 after connect | Expected — bands locked while QB connected |

## Related docs

- Sandbox probe UI: `api/sandbox/quickbooks/README.md`
- Field mapping notes: `api/sandbox/quickbooks/SPEC-MAP.md`
- Frontend contract: `api/ONBOARDING_FRONTEND_API.md`
