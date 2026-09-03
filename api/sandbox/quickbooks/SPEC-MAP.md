# QuickBooks Online ↔ juskel MVP spec mapping

Captured from **Intuit sandbox** probing (Sep 2026). Use this when wiring `juskel.Integrations.QuickBooks` financial fetch + band mapping later.

**Status:** OAuth connect works (local explorer + ngrok). `companyinfo` and `accounts` return usable data. `ProfitAndLoss` for default 2024 dates returns **structure only** (`NoReportData: true`) — see [Known gaps](#known-gaps).

Sources: [Data.html](../../../discovery/raw_ideations_drafts/Copy%20of%20Copy%20of%20JusKel_MVP_Requirement_Catalogue/Data.html) financial health fields.

---

## Sandbox tooling (current)

| Piece | Location / URL |
|-------|----------------|
| CLI smoke tests | `./test.sh` |
| Local explorer UI | `ui/run-ui.sh` → `http://127.0.0.1:8769` |
| OAuth callback (local) | `http://127.0.0.1:8769/callback` — **Intuit rejects IP literals**; use ngrok HTTPS URL in portal |
| ngrok pattern | `ngrok http 8769` → whitelist `https://{subdomain}.ngrok-free.app/callback` |
| Secrets | `secrets.env` (gitignored) — client id/secret, realm id, access + refresh tokens |
| Shared client | `quickbooks_client.py` (used by `test.sh` + `ui/server.py`) |

**Not built yet:** production juskel API financial pull from QuickBooks (only OAuth stubs in `QuickBooksClient`).

**Sandbox accounting probe:** run `./test.sh accounting-assessment` or UI → *Accounting profile assessment* — see [ACCOUNTING_PROBE.md](./ACCOUNTING_PROBE.md).

---

## Endpoints probed

Base: `https://sandbox-quickbooks.api.intuit.com/v3/company/{realmId}`

| Sandbox command / UI | HTTP | Path (after base) |
|----------------------|------|-------------------|
| `companyinfo` | GET | `/companyinfo/{realmId}?minorversion=65` |
| `profit-and-loss` | GET | `/reports/ProfitAndLoss?start_date={start}&end_date={end}&minorversion=65` |
| `balance-sheet` | GET | `/reports/BalanceSheet?date={end}&minorversion=65` |
| `accounts` | GET | `/query?query=select * from Account maxresults 25&minorversion=65` |
| `refresh` | POST | `https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer` |

Default report window in `secrets.env.example`: `2024-01-01` → `2024-12-31`.

---

## juskel field mapping (planned)

| Data.html / onboarding need | QuickBooks source | Status in sandbox |
|-----------------------------|-------------------|-------------------|
| Company / legal name | `CompanyInfo.CompanyName`, `LegalName` | ✅ Captured |
| Registered address | `CompanyInfo.CompanyAddr` (`Line1`, `City`, `CountrySubDivisionCode`, `PostalCode`) | ✅ Captured |
| Country | `CompanyInfo.Country` | ✅ `US` |
| Contact email | `CompanyInfo.Email.Address` | ✅ Captured |
| Fiscal year start | `CompanyInfo.FiscalYearStartMonth` | ✅ `January` |
| Company age (proxy) | `CompanyInfo.CompanyStartDate` | ✅ `2026-08-16` (sandbox company) |
| Turnover / revenue | P&L `Rows` → `group: "Income"` summary `ColData[1].value` | ⚠️ Empty for 2024 window |
| Gross profit | P&L `group: "GrossProfit"` summary row | ⚠️ Empty for 2024 window |
| Net profit | P&L `group: "NetIncome"` summary row | ⚠️ Empty for 2024 window |
| Cash balance | Balance sheet **or** `Account` where `AccountType: "Bank"` | ✅ `Checking` → `1201.00` USD via accounts |
| Borrowing / payables | `Account` where `Classification: "Liability"` | ✅ A/P `-1602.67`, tax payables |
| Chart of accounts | `QueryResponse.Account[]` | ✅ 25 rows per query (paginate for full chart) |
| EBITDA | Not a single QB field | ❌ Derive later from P&L expense lines |

---

## Response shapes (as captured)

### `companyinfo`

Top-level: `{ CompanyInfo: { ... }, time }`.

```json
{
  "CompanyInfo": {
    "CompanyName": "Sandbox Company US …",
    "LegalName": "Sandbox Company US …",
    "CompanyAddr": {
      "Line1": "123 Sierra Way",
      "City": "San Pablo",
      "CountrySubDivisionCode": "CA",
      "PostalCode": "87999"
    },
    "CustomerCommunicationAddr": { "...same shape..." },
    "LegalAddr": { "...same shape..." },
    "CompanyStartDate": "2026-08-16",
    "FiscalYearStartMonth": "January",
    "Country": "US",
    "Email": { "Address": "…@…" },
    "PrimaryPhone": {},
    "WebAddr": {},
    "NameValue": [
      { "Name": "CompanyType", "Value": "Other" },
      { "Name": "SubscriptionStatus", "Value": "SUBSCRIBED" }
    ],
    "Id": "1",
    "MetaData": { "CreateTime": "…", "LastUpdatedTime": "…" }
  }
}
```

### `profit-and-loss` (2024 window — no amounts)

Top-level: `{ Header, Columns, Rows }`.

- `Header.ReportName`: `ProfitAndLoss`
- `Header.StartPeriod` / `EndPeriod`: report range
- `Header.Currency`: e.g. `USD`
- **Empty-data flag:** `Header.Option[]` includes `{ "Name": "NoReportData", "Value": "true" }`
- `Rows.Row[]`: section shells with labels only when no data — e.g. `Income`, `Gross Profit`, `Total Expenses`, `Net Income`
- Each section: `type: "Section"`, optional `group` (`Income`, `GrossProfit`, `Expenses`, `NetOperatingIncome`, `NetIncome`)
- `Summary.ColData[]` / `Header.ColData[]`: `[{ "value": "label" }, { "value": "amount" }]` — **second column missing when `NoReportData`**

When data exists, expect numeric amounts in the last `ColData` entry per row.

### `accounts` (query)

Top-level: `{ QueryResponse: { Account: [...], startPosition, maxResults }, time }`.

Per account (sample fields observed):

| Field | Example | Notes |
|-------|---------|-------|
| `Name` | `Checking` | Display name |
| `FullyQualifiedName` | `Legal & Professional Fees:Accounting` | Hierarchy |
| `Classification` | `Asset`, `Liability`, `Expense`, `Revenue` | High-level bucket |
| `AccountType` | `Bank`, `Accounts Payable`, `Income`, … | QB type |
| `AccountSubType` | `Checking`, `AccountsPayable`, … | Finer type |
| `CurrentBalance` | `1201.0`, `-1602.67` | **Use `decimal` in .NET — never float** |
| `CurrencyRef.value` | `USD` | |
| `SubAccount` | `true` / `false` | |
| `ParentRef.value` | parent account id | |

**Useful balances from sandbox capture:**

| Account | `AccountType` | `CurrentBalance` |
|---------|---------------|------------------|
| Checking | Bank | 1201.00 |
| Accounts Receivable (A/R) | Accounts Receivable | 5281.52 |
| Accounts Payable (A/P) | Accounts Payable | -1602.67 |
| Board of Equalization Payable | Other Current Liability | -370.94 |

### `balance-sheet`

Same report envelope as P&L (`Header`, `Columns`, `Rows`). Not fully captured in this session — run after fixing report dates.

---

## Known gaps

1. **P&L empty for default dates** — sandbox company `CompanyStartDate` is `2026-08-16`; default `QUICKBOOKS_REPORT_*` is calendar **2024**. Intuit returns valid JSON with `NoReportData: true` and no amount columns. For a populated P&L, set dates to include 2026 (e.g. `2026-01-01` → `2026-12-31`) and re-run.
2. **Accounts capped at 25** — increase with QBO query pagination (`STARTPOSITION`) when mapping full chart.
3. **juskel API** — `POST /funding/integrations/quickbooks/authorize` + callback syncs company/P&L/accounts into `funding.FinancialProfiles` (see `api/QUICKBOOKS_E2E.md`).
4. **UK vs US sandbox** — current capture is US company (`Country: US`, `USD`). UK sandbox company may differ in address/report labels; re-probe if UK SMEs are primary.

---

## Where to paste live captures

```text
api/sandbox/quickbooks/responses/
├── companyinfo.live.json
├── profit-and-loss.live.json
├── balance-sheet.live.json
└── accounts.live.json
```

(`responses/` is gitignored except `.gitkeep`.)

---

## Related juskel API (OAuth only today)

| Method | Path |
|--------|------|
| POST | `/funding/integrations/quickbooks/authorize` |
| GET | `/funding/integrations/quickbooks/callback` |
| DELETE | `/funding/integrations/quickbooks` |

Config: `Integrations:QuickBooks` in `appsettings` / Azure secrets (separate from sandbox `secrets.env`).
