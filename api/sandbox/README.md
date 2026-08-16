# External API sandboxes

Local-only scratch space to probe third-party APIs before wiring them into modules.

**Nothing in this folder is deployed.** Secrets and live captured responses stay on your machine.

## Layout

```text
sandbox/
├── companies-house/   # UK Companies House API
├── open-banking/      # UK Open Banking (OAuth + AIS)
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

## Git

Tracked: `README.md`, `secrets.env.example`, `requests/*.json`, `test.sh`.

Ignored: `secrets.env`, `.env`, and everything under `responses/` (live captures).
