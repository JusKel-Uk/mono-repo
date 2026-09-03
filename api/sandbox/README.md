# External API sandboxes

Local-only scratch space to probe third-party APIs before wiring them into modules.

**Nothing in this folder is deployed.** Secrets and live captured responses stay on your machine.

## Layout

```text
sandbox/
├── companies-house/   # UK Companies House API
├── open-banking/      # Open Banking via Plaid sandbox
├── truelayer/         # UK Open Banking via TrueLayer sandbox
├── yapily/            # UK Open Banking via Yapily (Modelo sandbox)
├── quickbooks/        # QuickBooks Online sandbox (OAuth2)
└── xero/              # Xero accounting API (OAuth2)
```

Each provider folder has:

| File / folder | Purpose |
|---------------|---------|
| `secrets.env` | Your API keys — **gitignored**, copy from `secrets.env.example` |
| `requests/` | Request body / query templates you send |
| `responses/` | Paste live API responses here after a test run |
| `test.sh` | One-command curl smoke test (reads `secrets.env`) |

## Quick start (Companies House)

```bash
cd api/sandbox/companies-house
cp secrets.env.example secrets.env   # paste your API key
./test.sh
# paste output into responses/get-company.live.json
```

## Quick start (QuickBooks sandbox)

```bash
cd api/sandbox/quickbooks
cp secrets.env.example secrets.env   # paste Intuit Development keys + OAuth tokens
./test.sh all
```

See `quickbooks/README.md` and `quickbooks/SPEC-MAP.md` for where each key comes from in the Intuit portal.

```bash
cd api/sandbox/quickbooks/ui
./run-ui.sh
# open http://127.0.0.1:8769
```

## Quick start (Xero)

```bash
cd api/sandbox/xero
cp secrets.env.example secrets.env
./test.sh all
```

See `xero/README.md` for OAuth playground tokens.

## Quick start (Open Banking / Plaid)

```bash
cd api/sandbox/open-banking
cp secrets.env.example secrets.env   # Plaid Dashboard → Sandbox keys
./test.sh setup                      # prints PLAID_ACCESS_TOKEN — paste into secrets.env
./test.sh all
```

See `open-banking/README.md` for key placement.

## Quick start (TrueLayer)

```bash
cd api/sandbox/truelayer
cp secrets.env.example secrets.env   # TrueLayer Console → sandbox keys
./test.sh auth-link
# Mock Bank → copy code → TRUELAYER_AUTH_CODE=... ./test.sh exchange
./test.sh all
cd ui && ./run-ui.sh   # http://127.0.0.1:8767
```

See `truelayer/README.md`.

## Quick start (Yapily)

```bash
cd api/sandbox/yapily
cp secrets.env.example secrets.env
# Console: register modelo-sandbox + callback http://127.0.0.1:8768/callback
./test.sh connect
cd ui && ./run-ui.sh   # http://127.0.0.1:8768 — complete connect in browser
./test.sh all
```

See `yapily/README.md`.

## Git

Tracked: `README.md`, `secrets.env.example`, `requests/*.json`, `test.sh`.

Ignored: `secrets.env`, `.env`, and everything under `responses/` (live captures).
