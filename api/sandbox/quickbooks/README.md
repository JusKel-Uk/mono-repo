# QuickBooks Online sandbox

Intuit **sandbox** API for probing financial shapes before juskel integration (Phase 2 — Xero/QuickBooks in Data.html).

**Production API integration:** see [`api/QUICKBOOKS_E2E.md`](../../QUICKBOOKS_E2E.md) for OAuth, persistence, local + staging testing.

Docs: https://developer.intuit.com/app/developer/qbo/docs/get-started/start-developing-your-app

## Where to place your keys

**File:** `api/sandbox/quickbooks/secrets.env` (gitignored — never commit)

```bash
cd api/sandbox/quickbooks
cp secrets.env.example secrets.env
```

Edit **`secrets.env`** only:

| Variable | Where to get it |
|----------|-----------------|
| `QUICKBOOKS_CLIENT_ID` | [Intuit Developer](https://developer.intuit.com/) → your app → **Keys & OAuth** → **Development** → Client ID |
| `QUICKBOOKS_CLIENT_SECRET` | Same screen → Development → Client Secret |
| `QUICKBOOKS_REALM_ID` | OAuth Playground → **Realm ID** (sandbox company ID) after authorize |
| `QUICKBOOKS_ACCESS_TOKEN` | OAuth Playground → access token (expires ~1 hour) |
| `QUICKBOOKS_REFRESH_TOKEN` | OAuth Playground → refresh token (long-lived — keep in secrets.env) |

### One-time Intuit setup

1. Create app with **QuickBooks Online Accounting** scope (`com.intuit.quickbooks.accounting`).
2. Create a **sandbox company** in the developer portal (or use the default sample company).
3. App → Keys & OAuth → add redirect URI for playground:
   `https://developer.intuit.com/v2/OAuth2Playground/RedirectUrl`
4. Open [OAuth 2.0 Playground](https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0-playground):
   - Select your **sandbox** app
   - Scope: **Accounting**
   - Get authorization code → **Get tokens**
   - Copy **Realm ID**, **Access Token**, **Refresh Token** into `secrets.env`

**Use Development keys only** for sandbox — not Production keys.

### API base URL

Keep the default in `secrets.env`:

```env
QUICKBOOKS_API_BASE_URL=https://sandbox-quickbooks.api.intuit.com/v3/company
```

Production (after go-live) uses `https://quickbooks.api.intuit.com/v3/company` — do not mix.

## juskel fields (Data.html / Financial Profile.pdf)

| You need | Sandbox call |
|----------|----------------|
| **Full PDF accounting map** | `./test.sh accounting-assessment` or UI → *Accounting profile assessment* |
| Company name / profile | `./test.sh companyinfo` |
| Turnover, gross/net profit | `./test.sh profit-and-loss` |
| Prior-year P&L (trends) | `./test.sh profit-and-loss-prior` |
| Balance sheet (assets/liabilities/equity) | `./test.sh balance-sheet` |
| Debtors / creditors ageing | `./test.sh aged-receivables` / `aged-payables` |
| Cash flow statement | `./test.sh cash-flow` |
| Chart of accounts | `./test.sh accounts` |

See **[ACCOUNTING_PROBE.md](./ACCOUNTING_PROBE.md)** for the full PDF field matrix and how to read `status` / `feasibility`.

Paste JSON into `responses/*.live.json` after each run.

See **[SPEC-MAP.md](./SPEC-MAP.md)** for captured response shapes, juskel field mapping, and known gaps (`NoReportData`, date range, etc.).

## Local explorer UI

```bash
cd api/sandbox/quickbooks/ui
./run-ui.sh
# open http://127.0.0.1:8769
```

Whitelist this exact redirect URI in Intuit Developer → Keys & OAuth (Development):

`http://127.0.0.1:8769/callback`

Click **Connect sandbox company**, sign in to the Intuit sandbox, then fetch company info / P&L / balance sheet / accounts. Tokens are saved server-side into `secrets.env`.

Port: `QUICKBOOKS_UI_PORT=8773 ./run-ui.sh`

## Get tokens (browser — recommended)

`./test.sh` does **not** open a browser. It reads `QUICKBOOKS_ACCESS_TOKEN` from `secrets.env`.

**First-time connect (or when you see `Token expired` / 401):**

```bash
cd api/sandbox/quickbooks/ui
./run-ui.sh
# open http://127.0.0.1:8769
# → Connect sandbox company → sign in to Intuit sandbox → approve
# Callback saves access + refresh tokens and realm ID to ../secrets.env
```

Whitelist in Intuit Developer → Keys & OAuth → Development:

`http://127.0.0.1:8769/callback`

Then run probes:

```bash
cd ..
./test.sh companyinfo
./test.sh accounting-assessment
```

**If only the access token expired** (~1 hour) but refresh token is still valid:

```bash
./test.sh refresh   # auto-saves new access token to secrets.env
```

If refresh also fails, use the browser flow again.

## Run tests

```bash
./test.sh companyinfo
./test.sh profit-and-loss
./test.sh balance-sheet
./test.sh accounts
./test.sh all          # all of the above

# When access token expires (~1h):
./test.sh refresh
# Copy new access_token from JSON into QUICKBOOKS_ACCESS_TOKEN in secrets.env
```

## Files

| Path | Purpose |
|------|---------|
| `secrets.env` | **Your keys** (local only) |
| `secrets.env.example` | Template |
| `requests/*.json` | Request shape reference |
| `responses/` | Paste live API captures |
| `test.sh` | curl smoke tests |
| `quickbooks_client.py` | Shared OAuth + API client (CLI + UI) |
| `accounting_probe.py` | **Financial Profile.pdf accounting assessment** |
| `ACCOUNTING_PROBE.md` | How to run and read the assessment |
| `ui/` | Local explorer (`run-ui.sh`) |
| `SPEC-MAP.md` | **Captured data shapes + juskel mapping (read this for integration design)** |

## Notes

- Unlike Companies House, QuickBooks requires **OAuth** — no single static API key.
- Sandbox companies have **sample data**; P&L numbers are for shape testing, not real SMEs.
- UK sandbox companies are supported; pick region when creating the sandbox company if needed.
