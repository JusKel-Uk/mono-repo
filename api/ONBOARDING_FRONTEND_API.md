# Onboarding API — Frontend integration guide

Maps each onboarding Figma screen to the exact REST endpoints the frontend should call.

**Figma assets:** `discovery/figma_images/onboarding-flows/`  
**OpenAPI (dev):** `http://localhost:5242/swagger` or `https://juskel-api.livelydune-575d8971.uksouth.azurecontainerapps.io/swagger`  
**Auth:** All onboarding/funding/scoring routes require `Authorization: Bearer <accessToken>` from login.

---

## Base URLs

| Environment | Base URL |
|-------------|----------|
| Local | `http://localhost:5242` |
| Azure dev | `https://juskel-api.livelydune-575d8971.uksouth.azurecontainerapps.io` |

---

## Conventions every page uses

| Rule | Detail |
|------|--------|
| **Enums** | Send and receive **integers** (not strings). Load labels from `GET /onboarding/lookups` (or `/funding/lookups`, `/scoring/lookups`). See [Dropdown options](#dropdown-options-sector-region-bands-etc). |
| **Empty step** | `GET` a step resource → **404** means show an empty form. |
| **After submit** | Step `GET`s resolve the user's **latest** application (draft or submitted) so saved answers and `evidence[]` remain available for review. Writes (`PUT`, evidence upload/delete) still require a **draft** application. |
| **Save step** | `PUT` with JSON body → **200** with saved data. |
| **No-body POSTs** | `POST /onboarding/applications`, `POST .../submit`, `POST .../authorize` — user comes from JWT; draft application is resolved server-side. |
| **Progress** | `GET /onboarding/applications/current` drives the dashboard sidebar, step ticks, and “Ready for submission”. |
| **Money** | `requestedAmount` is `decimal` (e.g. `150000.00`) — use two decimal places in UI. |

---

## Flow overview

```
Register → Verify OTP → Login → Create application (once)
    → Step 1 Company Setup
    → Step 2 Business Profile
    → Step 3 Financial Profile (+ optional integrations & evidence)
    → Step 4 Sustainability Profile (+ optional evidence)
    → Step 5 Funding Profile
    → Submit
```

---

## 0. Sign-up & login (before dashboard)

Not in the onboarding Figma folder, but required before any wizard call.

| User action | Method | Endpoint | Notes |
|-------------|--------|----------|-------|
| Register | `POST` | `/identity/users` | Body: `firstName`, `lastName`, `email`, `password` |
| Verify email | `POST` | `/identity/verification` | Body: `email`, `otpCode` |
| Resend OTP | `POST` | `/identity/verification/resend` | Body: `email` |
| Login | `POST` | `/identity/sessions` | Body: `email`, `password` → returns `accessToken`, `firstName`, `lastName` |
| Dashboard greeting | `GET` | `/identity/me` | Returns `id`, `email`, `firstName`, `lastName` — use for “Hello, {firstName}” |

Store `accessToken` and attach to all subsequent requests.

---

## 1. Onboarding dashboard (shell)

**Purpose:** Step list, active step highlight, completion count, submit CTA enablement.

| Figma screens (representative) |
|--------------------------------|
| `Onboarding Dashboard (Desktop).png` |
| `Onboarding Dashboard (Mobile).png` |
| `Onboarding Dashboard Side Navigation Bar for Mobile.png` |
| `Onboarding Dashboard (Desktop) - Active State (Company SetUp).png` |
| `Onboarding Dashboard (Desktop) - Active State (Business Profile).png` |
| `Onboarding Dashboard (Desktop) - Active State (Financial Profile).png` |
| `Onboarding Dashboard (Desktop) - Active State (Sustainability Profile).png` |
| `Onboarding Dashboard (Desktop) - Active State (Funding Profile).png` |
| `Onboarding Dashboard (Mobile) - Active State (Company SetUp - Manual Entry).png` |
| `Onboarding Dashboard (Mobile) - Active State (Sustainability Profile).png` |
| `Onboarding Dashboard (Mobile) - Active State (Funding Profile).png` |

| When | Method | Endpoint | Response highlights |
|------|--------|----------|---------------------|
| First visit after login | `POST` | `/onboarding/applications` | **No body.** Creates draft if missing. **201** `{ applicationId }` |
| Every dashboard load | `GET` | `/onboarding/applications/current` | `completedCount`, `totalSteps` (5), `canSubmit`, `steps[]` with `step` + `status` |
| After submit | `GET` | `/onboarding/applications/current` | `status: 1` (Submitted), `submittedAt` set |

**`steps[].step` values:** `1` Company · `2` Business · `3` Financial · `4` Sustainability · `5` Funding  
**`steps[].status` values:** `0` NotStarted · `1` InProgress · `2` Complete

---

## 2. Step 1 — Company setup

**Purpose:** Legal identity, Companies House number, registered address, size bands.

| Figma screens |
|---------------|
| `Onboarding Dashboard (Desktop) - Company SetUp.png` |
| `Onboarding Dashboard (Mobile) - Company SetUp.png` |
| `Onboarding Dashboard (Desktop) - Company SetUp (Companies House number being entered).png` |
| `Onboarding Dashboard (Mobile) - Company SetUp (Companies House number being entered).png` |
| `Onboarding Dashboard (Desktop) - Company SetUp (Companies House number entered).png` |
| `Onboarding Dashboard (Mobile) - Company SetUp (Companies House number entered).png` |
| `Onboarding Dashboard (Desktop) - Company SetUp (Companies House number entered & not verified).png` |
| `Onboarding Dashboard (Mobile) - Company SetUp (Companies House number entered & not verified).png` |
| `Onboarding Dashboard (Desktop) - Company SetUp (Companies House number entered & verified).png` |
| `Onboarding Dashboard (Mobile) - Company SetUp (Companies House number entered & verified).png` |
| `Onboarding Dashboard (Desktop) - Company SetUp (Filled State).png` |
| `Onboarding Dashboard (Mobile) - Company SetUp (Filled State).png` |
| `Onboarding Dashboard (Desktop) - Active State (Company SetUp - Manual Entry).png` |
| `Onboarding Dashboard (Desktop) - Filled State (Company SetUp - Manual Entry).png` |
| `Onboarding Dashboard (Mobile) - Filled State (Company SetUp - Manual Entry).png` |
| `Onboarding Dashboard (Desktop) - Error State (Company SetUp - Manual Entry).png` |
| `Onboarding Dashboard (Mobile) - Error State (Company SetUp - Manual Entry).png` |
| `Onboarding Dashboard - Company SetUp (Dropdowns active).png` |
| `Onboarding Dashboard - Company SetUp (Dropdowns active)-1.png` |
| `Onboarding Dashboard - Company SetUp (Dropdowns active)-2.png` |
| `Onboarding Dashboard (Desktop) - Filled State (Save and Exit CTA Clicked after filling Company Setup).png` |
| `Onboarding Dashboard (Mobile) - Filled State (Save and Exit CTA Clicked after filling Company Setup).png` |

| When | Method | Endpoint | Body / notes |
|------|--------|----------|--------------|
| Open step | `GET` | `/onboarding/applications/current/company-setup` | **404** = empty form |
| Save / Continue | `PUT` | `/onboarding/applications/current/company-setup` | See request shape below |
| Verify CH number | `POST` | `/onboarding/applications/current/company-setup/verify-companies-house` | `{ "companyNumber": "12345678" }` — rate limit 5/min |
| Save and exit | `PUT` | Same as Save | Then navigate away; progress updated on dashboard `GET` |

**PUT body (`UpsertCompanySetupRequest`):**

```json
{
  "legalName": "Acme Ltd",
  "companiesHouseNumber": "12345678",
  "relationship": 2,
  "region": 1,
  "registeredAddress": "1 High Street",
  "city": "London",
  "postcode": "EC1A 1BB",
  "employeeSizeBand": 2,
  "annualTurnoverBand": 2,
  "yearsInOperationBand": 3
}
```

**Verify response:** `isCompaniesHouseVerified`, `companyName`, `status`, `registeredOfficeAddress` — use to show verified vs not-verified UI states.

---

## 3. Step 2 — Business profile

**Purpose:** Sector, description, operational location (overlaps some company fields by design).

| Figma screens |
|---------------|
| `Onboarding Dashboard (Desktop) - Business Profile.png` |
| `Onboarding Dashboard (Mobile) - Business Profile.png` |
| `Onboarding Dashboard (Desktop) - Filled State (Business Profile).png` |
| `Onboarding Dashboard (Mobile) - Filled State (Business Profile).png` |
| `Onboarding Dashboard (Desktop) - Error State (Business Profile).png` |
| `Onboarding Dashboard (Mobile) - Error State (Business Profile).png` |
| `Onboarding Dashboard - Business Profile (Dropdowns active).png` |

| When | Method | Endpoint |
|------|--------|----------|
| Open step | `GET` | `/onboarding/applications/current/business-profile` |
| Save | `PUT` | `/onboarding/applications/current/business-profile` |

**PUT body:**

```json
{
  "sector": 1,
  "subSector": "Software development",
  "region": 1,
  "employeeSizeBand": 2,
  "annualTurnoverBand": 2,
  "yearsInOperationBand": 3,
  "city": "Manchester",
  "postcode": "M1 1AA",
  "description": "What the business does..."
}
```

---

## 4. Step 3 — Financial profile

**Purpose:** Revenue/EBITDA/debt bands, connect Open Banking / Xero / QuickBooks, upload financial evidence.

| Figma screens |
|---------------|
| `Onboarding Dashboard (Desktop) - Financial Profile.png` |
| `Onboarding Dashboard (Mobile) - Financial Profile.png` |
| `Onboarding Dashboard (Desktop) - Financial Profile-1.png` |
| `Onboarding Dashboard (Mobile) - Financial Profile-1.png` |
| `Onboarding Dashboard (Desktop) - Active State (Financial Profile).png` |
| `Onboarding Dashboard (Mobile) - Filled State (Financial Profile).png` |
| `Onboarding Dashboard - Financial Profile (Dropdowns active).png` |
| `Onboarding Dashboard - Financial Profile (Dropdowns active)-1.png` |
| `Onboarding Dashboard - Financial Profile (Dropdowns active)-2.png` |
| `Onboarding Dashboard (Desktop) - Financial Profile (SME User clicks on the Connect CTA for Open Banking).png` |
| `Onboarding Dashboard (Mobile) - Financial Profile (SME User clicks on the Connect CTA for Open Banking).png` |
| `Onboarding Dashboard (Desktop) - Financial Profile (SME User authorizes Open Banking).png` |
| `Onboarding Dashboard (Mobile) - Financial Profile (SME User authorizes Open Banking).png` |
| `Onboarding Dashboard (Desktop) - Financial Profile (Open Banking is connected & auto-populates the SME User's information).png` |
| `Onboarding Dashboard (Mobile) - Financial Profile (Open Banking is connected & auto-populates the SME User's information).png` |
| `Onboarding Dashboard (Desktop) - Financial Profile (Open Banking rejects consent).png` |
| `Onboarding Dashboard (Mobile) - Financial Profile (Open Banking rejects consent).png` |
| `Onboarding Dashboard (Desktop) - Financial Profile (SME User tries to connect Open Banking again).png` |
| `Onboarding Dashboard (Mobile) - Financial Profile (SME User tries to connect Open Banking again).png` |
| `Onboarding Dashboard (Desktop) - Financial Profile (SME User clicks on the Connect CTA for Xero).png` |
| `Onboarding Dashboard (Mobile) - Financial Profile (SME User clicks on the Connect CTA for Xero).png` |
| `Onboarding Dashboard (Desktop) - Financial Profile (SME User clicks on the Connect CTA for QuickBooks).png` |
| `Onboarding Dashboard (Mobile) - Financial Profile (SME User clicks on the Connect CTA for QuickBooks).png` |
| `Onboarding Dashboard (Mobile) - Error State (Financial Profile).png` |

| When | Method | Endpoint | Notes |
|------|--------|----------|-------|
| Open step | `GET` | `/funding/applications/current/financial-profile` | Check `bandsLockedByIntegration`, `integrations[]`, `evidence[]` |
| Save manual bands | `PUT` | `/funding/applications/current/financial-profile` | Skip locked fields when `bandsLockedByIntegration: true` |
| Connect Open Banking | `POST` | `/funding/integrations/open-banking/authorize` | No body → `{ authorizationUrl, state }` — redirect user |
| OAuth return | Browser | `GET` | `/funding/integrations/open-banking/callback?code=...&state=...` | Backend handles; then refresh financial profile |
| Disconnect OB | `DELETE` | `/funding/integrations/open-banking` | |
| Connect Xero | `POST` | `/funding/integrations/xero/authorize` | Same pattern |
| Xero callback | `GET` | `/funding/integrations/xero/callback` | |
| Disconnect Xero | `DELETE` | `/funding/integrations/xero` | |
| Connect QuickBooks | `POST` | `/funding/integrations/quickbooks/authorize` | Returns `{ authorizationUrl, state }` — open URL in browser |
| QB callback | `GET` | `/funding/integrations/quickbooks/callback?code=...&state=...&realmId=...` | Backend syncs QB reports (P&amp;L, balance sheet, AR/AP, cash flow, accounts), persists **integration metrics** + 5 bands + `bandsLockedByIntegration: true`; refresh financial profile |
| Disconnect QB | `DELETE` | `/funding/integrations/quickbooks` | Unlocks bands (same as Open Banking) |
| Upload file | `POST` | `/funding/evidence` | `multipart/form-data`, field `file` |
| Preview / download file | `GET` | `/funding/evidence/{evidenceId}/download` | Optional query `download=true` for attachment |
| Remove file | `DELETE` | `/funding/evidence/{evidenceId}` | Draft only |

**Download / preview:** Requires `Authorization: Bearer <token>`. Returns the file bytes with the stored `Content-Type`. Use `evidenceId` from profile `GET` → `evidence[]`.

| Query | `Content-Disposition` | Use |
|-------|----------------------|-----|
| (default) | `inline` | Preview in browser |
| `?download=true` | `attachment` | Force save |

The browser cannot use a plain `<a href>` — there is no public blob URL. Fetch with the JWT, then use `URL.createObjectURL(blob)` (frontend developer).

**GET response** includes `evidence[]` (empty array when none uploaded) and optional `integrationMetrics` (populated after QuickBooks connect; `null` when no accounting sync). Each evidence item:

```json
{
  "evidenceId": "22222222-2222-2222-2222-222222222222",
  "applicationId": "11111111-1111-1111-1111-111111111111",
  "fileName": "bank-statement.pdf",
  "contentType": "application/pdf",
  "fileSizeBytes": 512000,
  "uploadedAt": "2026-01-15T10:00:00Z"
}
```

**`integrationMetrics`** (read-only; QuickBooks today) — Layer-2 accounting amounts from QBO reports. All money fields are `decimal` in API JSON (not bands). `null` when user has not connected QuickBooks or metrics were cleared on disconnect.

| Field | Type | Source |
|-------|------|--------|
| `provider` | int | `3` = QuickBooks |
| `currency` | string | QBO report header |
| `periodStart` / `periodEnd` | date | Configured report window (`Integrations:QuickBooks:ReportStartDate/EndDate`) |
| `priorPeriodEnd` | date? | Prior-year P&amp;L window end |
| `balanceSheetAsOf` | date | Balance sheet as-of date |
| `syncedAt` | datetime | Last successful QB sync |
| `annualRevenue` | decimal? | P&amp;L total income |
| `priorAnnualRevenue` | decimal? | Prior-year revenue |
| `grossProfit` | decimal? | P&amp;L |
| `operatingProfit` | decimal? | P&amp;L net operating income |
| `netIncome` | decimal? | P&amp;L net income |
| `priorNetIncome` | decimal? | Prior-year net income |
| `ebitda` | decimal? | Derived when D&amp;A/interest/tax lines exist |
| `cashBalance` | decimal? | Bank accounts |
| `accountsReceivable` | decimal? | Aged AR / A/R accounts |
| `accountsPayable` | decimal? | Aged AP / A/P accounts |
| `currentAssets` / `currentLiabilities` | decimal? | Balance sheet |
| `workingCapital` | decimal? | Derived |
| `totalAssets` / `totalLiabilities` / `totalEquity` | decimal? | Balance sheet |
| `outstandingDebt` | decimal? | Loan/LOC account types (not trade payables) |
| `operatingCashFlow` | decimal? | Cash flow statement |
| `currentRatio` / `debtToAssets` / `profitMargin` | decimal? | Derived ratios |
| `revenueGrowthYoY` / `netIncomeGrowthYoY` | decimal? | YoY trends (null if prior year empty) |
| `accountCount` | int | Chart of accounts fetched |
| `hasReportData` / `priorPeriodHasReportData` | bool | QBO `NoReportData` flags |

Example snippet:

```json
{
  "integrationMetrics": {
    "provider": 3,
    "currency": "USD",
    "periodStart": "2026-01-01",
    "periodEnd": "2026-12-31",
    "annualRevenue": 10200.77,
    "netIncome": 1642.46,
    "cashBalance": 2001.00,
    "workingCapital": 3809.96,
    "currentRatio": 1.62,
    "syncedAt": "2026-09-02T16:00:00Z"
  }
}
```

**PUT body (`UpsertFinancialProfileRequest`):**

```json
{
  "annualRevenueBand": 2,
  "ebitdaBand": 3,
  "existingDebtBand": 1,
  "cashReserves": 3,
  "avgMonthlyRevenue": 3
}
```

---

## 5. Step 4 — Sustainability profile

**Purpose:** Nine ESG questions; optional certificate uploads per question.

| Figma screens |
|---------------|
| `Onboarding Dashboard (Desktop) - Sustainability Profile.png` |
| `Onboarding Dashboard (Mobile) - Sustainability Profile.png` |
| `Onboarding Dashboard (Desktop) - Active State (Sustainability Profile).png` |
| `Onboarding Dashboard (Mobile) - Active State (Sustainability Profile).png` |
| `Onboarding Dashboard (Desktop) - Filled State (Sustainability Profile).png` |
| `Onboarding Dashboard (Mobile) - Filled State (Sustainability Profile).png` |
| `Onboarding Dashboard (Desktop) - Error State (Sustainability Profile).png` |

| When | Method | Endpoint |
|------|--------|----------|
| Open step | `GET` | `/scoring/applications/current/sustainability-profile` |
| Save answers | `PUT` | `/scoring/applications/current/sustainability-profile` |
| Upload certificate | `POST` | `/scoring/evidence` | `multipart/form-data`: `file`, `questionKey` (1–9) |
| Preview / download certificate | `GET` | `/scoring/evidence/{evidenceId}/download` | Optional query `download=true` for attachment |
| Remove certificate | `DELETE` | `/scoring/evidence/{evidenceId}` | Draft only |

**Download / preview:** Same as financial evidence — JWT required, `evidenceId` from `evidence[]` on sustainability profile `GET`. See financial step for `download` query behaviour.

**GET response** includes `evidence[]` (empty array when none uploaded). Each item includes `questionKey` (1–9):

```json
{
  "evidenceId": "33333333-3333-3333-3333-333333333333",
  "applicationId": "11111111-1111-1111-1111-111111111111",
  "questionKey": 1,
  "fileName": "iso14001-certificate.pdf",
  "contentType": "application/pdf",
  "fileSizeBytes": 256000,
  "uploadedAt": "2026-01-15T10:00:00Z"
}
```

**PUT body (all fields are `SustainabilityAnswer` 0–5):**

```json
{
  "ghgEmissions": 1,
  "sustainabilityPolicy": 1,
  "resourceTracking": 2,
  "wellbeing": 1,
  "training": 2,
  "dei": 1,
  "continuity": 3,
  "governancePolicies": 1,
  "riskReview": 2
}
```

**`questionKey` for evidence uploads** maps to `SustainabilityQuestionKey`: 1 GhgEmissions · 2 SustainabilityPolicy · 3 ResourceTracking · 4 Wellbeing · 5 Training · 6 Dei · 7 Continuity · 8 GovernancePolicies · 9 RiskReview.

---

## 6. Step 5 — Funding profile

**Purpose:** Loan amount, purpose, term, urgency.

| Figma screens |
|---------------|
| `Onboarding Dashboard (Desktop) - Funding Profile.png` |
| `Onboarding Dashboard (Mobile) - Funding Profile.png` |
| `Onboarding Dashboard (Desktop) - Active State (Funding Profile).png` |
| `Onboarding Dashboard (Mobile) - Active State (Funding Profile).png` |
| `Onboarding Dashboard (Desktop) - Filled State (Funding Profile).png` |
| `Onboarding Dashboard (Mobile) - Filled State (Funding Profile).png` |
| `Onboarding Dashboard (Mobile) - Error State (Funding Profile).png` |
| `Onboarding Dashboard - Funding Profile (Dropdowns active).png` |
| `Onboarding Dashboard - Funding Profile (Dropdowns active)-1.png` |

| When | Method | Endpoint |
|------|--------|----------|
| Open step | `GET` | `/funding/applications/current/funding-profile` |
| Save | `PUT` | `/funding/applications/current/funding-profile` |

**PUT body:**

```json
{
  "requestedAmount": 150000.00,
  "purpose": 1,
  "termMonths": 60,
  "urgency": 2
}
```

---

## 7. Submit for review

| Figma screens |
|---------------|
| `Onboarding Dashboard (Desktop) - Filled State (All Steps have been filled & Ready for Submission).png` |
| `Onboarding Dashboard (Mobile) - Filled State (All Steps have been filled & Ready for Submission).png` |
| `Onboarding Dashboard (Desktop) - After submitting the application for review.png` |

| When | Method | Endpoint | Notes |
|------|--------|----------|-------|
| User clicks Submit | `POST` | `/onboarding/applications/current/submit` | **No body.** Requires `canSubmit: true` on dashboard |
| Incomplete submit | same | same | **409** if steps missing |
| After success | `GET` | `/onboarding/applications/current` | `status: 1` (Submitted) |

---

## Dropdown options (sector, region, bands, etc.)

Form dropdowns are served from the API (backed by `api/onboarding-lookups.json` on the server — not stored in the database).

| When | Method | Endpoint | Use for |
|------|--------|----------|---------|
| App init / cache all | `GET` | `/lookups` | Every dropdown in one call |
| Company + business steps | `GET` | `/onboarding/lookups` | `companyRelationship`, `ukRegion`, `employeeSizeBand`, `annualTurnoverBand`, `yearsInOperationBand`, `businessSector` |
| Financial + funding steps | `GET` | `/funding/lookups` | `annualRevenueBand`, `ebitdaBand`, `existingDebtBand`, `cashReserves`, `avgMonthlyRevenue`, `fundingPurpose`, `fundingUrgency` |
| Sustainability step | `GET` | `/scoring/lookups` | `sustainabilityAnswer` |

**No auth required** — public reference data.

**Response shape:**

```json
{
  "options": {
    "businessSector": [
      { "value": 1, "label": "Technology" },
      { "value": 2, "label": "Manufacturing" }
    ],
    "ukRegion": [
      { "value": 1, "label": "England" }
    ]
  }
}
```

### Business profile form example

| Form field | Key in `options` |
|------------|------------------|
| `sector` | `businessSector` |
| `subSector` | free text (no lookup) |
| `region` | `ukRegion` |
| `employeeSizeBand` | `employeeSizeBand` |
| `annualTurnoverBand` | `annualTurnoverBand` |
| `yearsInOperationBand` | `yearsInOperationBand` |

**TypeScript pattern:**

```ts
const { options } = await fetch(`${API}/onboarding/lookups`).then((r) => r.json());

// Render <select>
options.businessSector.map((opt) => (
  <option key={opt.value} value={opt.value}>{opt.label}</option>
));

// Display saved value from GET (sector: 1 → "Technology")
const label = options.businessSector.find((o) => o.value === data.sector)?.label;
```

**On save:** send the selected `value` (integer) in the PUT body — not the label string.

**On load:** `GET .../business-profile` returns integers; map each field to its label using the same lookups response.

### Company setup uses the same lookups

| Form field | Key in `options` |
|------------|------------------|
| `relationship` | `companyRelationship` |
| `region` | `ukRegion` |
| `employeeSizeBand` | `employeeSizeBand` |
| `annualTurnoverBand` | `annualTurnoverBand` |
| `yearsInOperationBand` | `yearsInOperationBand` |

**Source file (backend):** [`api/onboarding-lookups.json`](./onboarding-lookups.json) — edit this file to change labels; redeploy API to update endpoints.

### Updating enums (backend checklist)

| Change | `*Enums.cs` | `onboarding-lookups.json` | Redeploy |
|--------|-------------|---------------------------|----------|
| Label text only | — | ✓ | ✓ |
| New option | ✓ (next free integer) | ✓ (same `value`) | ✓ |
| Remove option | deprecate in UI; keep integer | hide label | — |

**Never reuse or renumber integer values after release** — existing applications store the raw `int` in the database. Comments in `CompanyEnums.cs`, `FundingEnums.cs`, `ScoringEnums.cs`, and `LookupCatalogService.cs` document this rule.

**Adding a new option:** assign the next unused integer in the C# enum, add `{ "value": N, "label": "..." }` to the matching key in `onboarding-lookups.json`, run `dotnet build`, redeploy. No EF migration needed for value-only changes.

**Adding a new dropdown category:** new enum + JSON key + register the key in `LookupCatalogService.cs` (`OnboardingKeys` / `FundingKeys` / `ScoringKeys`), then wire DTOs and endpoints.

**Not served via lookups:** `OnboardingStep`, `StepStatus`, `SubmissionStatus`, `SustainabilityQuestionKey`, `IntegrationProvider` — C# only.

---

## Enum reference

Source of truth for **valid integers**: `api/src/Modules/*/*.Contracts/*Enums.cs`. Source of truth for **display labels**: `api/onboarding-lookups.json`. Swagger lists allowed integers per field.

### Company & business (`CompanyEnums.cs`)

| Enum | Values |
|------|--------|
| **CompanyRelationship** | 1 SoleTrader · 2 Director · 3 Shareholder · 4 Partner · 5 Other |
| **UkRegion** | 1 England · 2 Wales · 3 Scotland · 4 NorthernIreland |
| **EmployeeSizeBand** | 1 Micro1To9 · 2 Small10To49 · 3 Medium50To249 · 4 Large250Plus |
| **AnnualTurnoverBand** | 1 Under250K · 2 From250KTo1M · 3 From1MTo5M · 4 From5MTo25M · 5 Over25M |
| **YearsInOperationBand** | 1 Under1Year · 2 From1To3Years · 3 From3To5Years · 4 From5To10Years · 5 Over10Years |
| **BusinessSector** | 1 Technology · 2 Manufacturing · 3 Retail · 4 ProfessionalServices · 5 Hospitality · 6 Construction · 7 Agriculture · 8 Healthcare · 99 Other |

### Financial & funding (`FundingEnums.cs`)

| Enum | Values |
|------|--------|
| **AnnualRevenueBand** | 1 Under250K · 2 From250KTo1M · 3 From1MTo5M · 4 From5MTo25M · 5 Over25M |
| **EbitdaMarginBand** (`ebitdaBand` in JSON) | 1 LossMaking · 2 Margin0To5 · 3 Margin5To15 · 4 Margin15To30 · 5 Over30Margin |
| **ExistingDebtBand** | 1 NoDebt · 2 Under50K · 3 From50KTo250K · 4 From250KTo1M · 5 Over1M |
| **CashReservesMonthsBand** (`cashReserves` in JSON) | 1 Under1Month · 2 From1To3Months · 3 From3To6Months · 4 From6To12Months · 5 Over12Months |
| **AvgMonthlyRevenueBand** (`avgMonthlyRevenue` in JSON) | 1 Under20K · 2 From20KTo80K · 3 From80KTo400K · 4 From400KTo1M · 5 Over1M |
| **FundingPurpose** | 1 WorkingCapital · 2 Equipment · 3 Expansion · 4 Refinance · 99 Other |
| **FundingUrgency** | 1 Immediate · 2 Within30Days · 3 Within90Days · 4 Flexible |
| **IntegrationProvider** | 1 OpenBanking · 2 Xero · 3 QuickBooks |

### Sustainability (`ScoringEnums.cs`)

| Enum | Values |
|------|--------|
| **SustainabilityAnswer** | 0 NotAnswered · 1 Yes · 2 No · 3 InProgress · 4 Partially · 5 Occasionally |
| **SustainabilityQuestionKey** | 1 GhgEmissions · 2 SustainabilityPolicy · 3 ResourceTracking · 4 Wellbeing · 5 Training · 6 Dei · 7 Continuity · 8 GovernancePolicies · 9 RiskReview |

### Progress (`OnboardingEnums.cs`)

| Enum | Values |
|------|--------|
| **OnboardingStep** | 1 Company · 2 Business · 3 Financial · 4 Sustainability · 5 Funding |
| **StepStatus** | 0 NotStarted · 1 InProgress · 2 Complete |
| **SubmissionStatus** | 0 Draft · 1 Submitted |

---

## Quick endpoint index (copy-paste)

```
# Auth
POST   /identity/users
POST   /identity/verification
POST   /identity/verification/resend
POST   /identity/sessions
GET    /identity/me

# Lookups (no auth — dropdown labels)
GET    /lookups
GET    /onboarding/lookups
GET    /funding/lookups
GET    /scoring/lookups

# Dashboard & wizard
POST   /onboarding/applications
GET    /onboarding/applications/current
GET    /onboarding/applications/current/company-setup
PUT    /onboarding/applications/current/company-setup
POST   /onboarding/applications/current/company-setup/verify-companies-house
GET    /onboarding/applications/current/business-profile
PUT    /onboarding/applications/current/business-profile
GET    /funding/applications/current/financial-profile
PUT    /funding/applications/current/financial-profile
POST   /funding/integrations/open-banking/authorize
GET    /funding/integrations/open-banking/callback
DELETE /funding/integrations/open-banking
POST   /funding/integrations/xero/authorize
GET    /funding/integrations/xero/callback
DELETE /funding/integrations/xero
POST   /funding/integrations/quickbooks/authorize
GET    /funding/integrations/quickbooks/callback
DELETE /funding/integrations/quickbooks
POST   /funding/evidence
GET    /funding/evidence/{evidenceId}/download
DELETE /funding/evidence/{evidenceId}
GET    /scoring/applications/current/sustainability-profile
PUT    /scoring/applications/current/sustainability-profile
POST   /scoring/evidence
GET    /scoring/evidence/{evidenceId}/download
DELETE /scoring/evidence/{evidenceId}
GET    /funding/applications/current/funding-profile
PUT    /funding/applications/current/funding-profile
POST   /onboarding/applications/current/submit
```

---

## Screens without dedicated endpoints

These Figma frames are **UI states only** (same endpoints as their parent step):

- Dropdown-active variants (`*Dropdowns active*.png`)
- `Frame 160.png` … `Frame 166.png` — layout components
- Error states — handle **400** validation, **409** submit conflict, **404** empty step, **429** CH verify rate limit
- “Review answers” modals — read from the same `GET` for that step; no separate review endpoint

---

## Testing

Full HTTP E2E against local or Azure:

```bash
cd api
# Local (spawns API)
E2E_SPAWN_API=1 node scripts/e2e-onboarding-api.mjs

# Azure dev
BASE_URL=https://juskel-api.livelydune-575d8971.uksouth.azurecontainerapps.io \
  node scripts/e2e-onboarding-api.mjs
```
