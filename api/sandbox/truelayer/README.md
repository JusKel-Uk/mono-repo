# TrueLayer sandbox (Data API)

UK open banking via [TrueLayer](https://docs.truelayer.com/) — accounts, balances, transactions for juskel cash-flow scoring probes.

## Keys

**File:** `api/sandbox/truelayer/secrets.env` (gitignored)

```bash
cd api/sandbox/truelayer
cp secrets.env.example secrets.env
```

| Variable | Source |
|----------|--------|
| `TRUELAYER_CLIENT_ID` | [TrueLayer Console](https://console.truelayer.com/) → sandbox app |
| `TRUELAYER_CLIENT_SECRET` | Same app → download secret |

In Console, enable Data API scopes: `accounts`, `balance`, `transactions`, `info`, `offline_access`.

Add redirect URI in [TrueLayer Console](https://console.truelayer.com/) → sandbox app (exact match):

```
http://127.0.0.1:8767/callback
```

After Mock Bank login, the browser returns to the local explorer — same pattern as QuickBooks `http://127.0.0.1:8769/callback`. The hosted `console.truelayer-sandbox.com/redirect-page` URL often fails DNS; use the local callback instead.

### Frontend redirect (same as QuickBooks)

TrueLayer **never** redirects to Next.js directly. Flow:

1. User starts OAuth from the app → `POST /funding/integrations/open-banking/authorize`
2. TrueLayer redirects to the **API** callback (whitelist in Console — see below)
3. API saves the connection, then **302** to the financial profile page with query params

**Whitelist in TrueLayer Console** (OAuth redirect URI — API only):

```text
http://localhost:5242/funding/integrations/open-banking/callback
```

**Browser lands on frontend after success** (do **not** whitelist this in TrueLayer):

```text
{JUSKEL_FRONTEND_URL}/onboarding/financial-profile?integration=open-banking&status=connected
```

| Environment | `JUSKEL_FRONTEND_URL` | Example success URL |
|-------------|-------------------------|---------------------|
| Local | `http://localhost:3000` | `http://localhost:3000/onboarding/financial-profile?integration=open-banking&status=connected` |
| Azure / Vercel | your Next.js base URL | `https://mono-repo-n96q.vercel.app/onboarding/financial-profile?integration=open-banking&status=connected` |

On failure: `status=error` (same query pattern as QuickBooks with `integration=quickbooks`).

Set `JUSKEL_FRONTEND_URL` in `appsettings.Development.json` or env. If empty, the API returns JSON `{ status, provider }` instead of a 302 (Swagger / headless e2e).

Compare QuickBooks success URL: `...?integration=quickbooks&status=connected` — same page, different `integration` slug.

## API E2E (real sandbox + Mock Bank OAuth)

The stub script [`../../scripts/e2e-open-banking-multibank-api.mjs`](../../scripts/e2e-open-banking-multibank-api.mjs) fakes OAuth for CI. For **real TrueLayer** against juskel.Api:

1. Whitelist **both** redirect URIs in [TrueLayer Console](https://console.truelayer.com/) (sandbox app):

```
http://127.0.0.1:8767/callback
http://localhost:5242/funding/integrations/open-banking/callback
```

(`localhost` and `127.0.0.1` are different — add the exact URI the script prints.)

2. Install Playwright once:

```bash
cd api/scripts && npm install && npx playwright install chromium
```

3. Run (Playwright logs in as Mock Bank **john / doe**):

```bash
cd api
E2E_SPAWN_API=1 E2E_PORT=5242 node scripts/e2e-open-banking-sandbox-api.mjs
```

Optional: `E2E_HEADED=1` to watch the browser.

**Note:** Sandbox has one Mock Bank ASPSP — multi-bank in production means separate OAuth per real bank; the stub e2e simulates two institutions with fake codes.

## CLI quick start

```bash
./test.sh auth-link          # print Mock Bank auth URL
# Browser: Mock Bank login john / doe → copy code from redirect page
TRUELAYER_AUTH_CODE=abc123 ./test.sh exchange   # or paste code in secrets.env
./test.sh all
```

| Command | Purpose |
|---------|---------|
| `auth-link` | Build sandbox auth URL (`providers=uk-cs-mock`) |
| `exchange` | Code → `TRUELAYER_ACCESS_TOKEN` (saved to secrets.env) |
| `accounts` | `GET /data/v1/accounts` |
| `balances` | Balance for first account |
| `transactions` | Transactions (default 90 days) |
| `all` | accounts + balances + transactions |

## Local explorer UI

```bash
cd ui && ./run-ui.sh
# → http://127.0.0.1:8767
```

Sidebar: auth link, exchange (paste code), accounts, balances, transactions. Port: `TRUELAYER_UI_PORT=8771 ./run-ui.sh`

## Files

| Path | Purpose |
|------|---------|
| `truelayer_client.py` | Shared API client |
| `test.sh` | CLI probes |
| `ui/` | Local explorer |
| `requests/` | Body templates |
| `responses/` | Paste live captures |
