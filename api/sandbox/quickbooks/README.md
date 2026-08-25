# QuickBooks Online sandbox

Intuit **sandbox** API for probing financial shapes before juskel integration (Phase 2 — Xero/QuickBooks in Data.html).

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

## juskel fields (Data.html financial health)

| You need | Sandbox call |
|----------|----------------|
| Company name / profile | `./test.sh companyinfo` |
| Turnover, gross/net profit | `./test.sh profit-and-loss` |
| Cash balance, borrowing | `./test.sh balance-sheet` |
| Chart of accounts | `./test.sh accounts` |

Paste JSON into `responses/*.live.json` after each run.

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

## Notes

- Unlike Companies House, QuickBooks requires **OAuth** — no single static API key.
- Sandbox companies have **sample data**; P&L numbers are for shape testing, not real SMEs.
- UK sandbox companies are supported; pick region when creating the sandbox company if needed.
