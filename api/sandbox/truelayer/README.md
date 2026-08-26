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

Add redirect URI in Console (sandbox app):

```
https://console.truelayer-sandbox.com/redirect-page
```

**Not** `console.truelayer.com` — sandbox and live redirect URIs differ.

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
