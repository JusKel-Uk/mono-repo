# Xero sandbox

Xero accounting API (OAuth 2.0). Docs: https://developer.xero.com/

**Note:** Folder is `xero` (accounting software), not Xerox document services.

## Where to place your keys

**File:** `api/sandbox/xero/secrets.env` (gitignored)

```bash
cd api/sandbox/xero
cp secrets.env.example secrets.env
```

| Variable | Where to get it |
|----------|-----------------|
| `XERO_CLIENT_ID` | [Xero Developer](https://developer.xero.com/) → My Apps → your app → **Client id** |
| `XERO_CLIENT_SECRET` | Same app → **Client secret** |
| `XERO_ACCESS_TOKEN` | [OAuth 2.0 playground](https://developer.xero.com/documentation/guides/oauth2/overview) or your auth flow (~30 min lifetime) |
| `XERO_REFRESH_TOKEN` | Same — keep in `secrets.env` for `./test.sh refresh` |
| `XERO_TENANT_ID` | OAuth response / playground → **tenant id** (organisation connected) |

Use a **demo company** in the Xero developer portal for sandbox-style testing.

## juskel fields (Data.html financial health)

| You need | Command |
|----------|---------|
| Organisation profile | `./test.sh organisation` |
| Chart of accounts | `./test.sh accounts` |
| Turnover, profit | `./test.sh profit-and-loss` |
| Cash, liabilities | `./test.sh balance-sheet` |

## Run tests

```bash
./test.sh organisation
./test.sh accounts
./test.sh profit-and-loss
./test.sh balance-sheet
./test.sh all

# When access token expires:
./test.sh refresh
# → copy access_token into XERO_ACCESS_TOKEN in secrets.env
```

Paste JSON into `responses/*.live.json`.

## Files

| Path | Purpose |
|------|---------|
| `secrets.env` | **Your credentials** (local only) |
| `requests/` | Request shape reference |
| `responses/` | Live captures (gitignored) |
| `test.sh` | curl smoke tests |
