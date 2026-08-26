# Yapily sandbox (Open Banking)

UK open banking via [Yapily](https://docs.yapily.com/) — Modelo Sandbox institutions, connect flow, accounts, transactions.

## Prerequisites (Console)

1. [Yapily Console](https://console.yapily.com/) → create application → download Application ID + Secret.
2. **Connected Institutions** → add `modelo-sandbox` → Register → **Yes, Preconfigured Credentials**.
3. Allow callback URL: `http://127.0.0.1:8768/callback` (for local UI).

## Keys

```bash
cd api/sandbox/yapily
cp secrets.env.example secrets.env
```

| Variable | Source |
|----------|--------|
| `YAPILY_APPLICATION_ID` | Console application UUID |
| `YAPILY_APPLICATION_SECRET` | Downloaded with application |

Modelo sandbox login: `mits` / `mits`.

## CLI quick start

```bash
./test.sh institutions
./test.sh connect          # prints authorisationUrl — open in browser
# Complete login → if using UI, callback saves YAPILY_CONSENT_TOKEN
./test.sh all
```

| Command | Purpose |
|---------|---------|
| `institutions` | `GET /institutions` |
| `connect` | `POST /account-auth-requests` for modelo-sandbox |
| `accounts` | Accounts for consent token |
| `transactions` | Transactions (90-day window) |
| `all` | accounts + transactions |

## Local explorer UI

```bash
cd ui && ./run-ui.sh
# → http://127.0.0.1:8768
```

**Connect flow:** Click **Start connect** → open bank link → login `mits/mits` → redirect saves consent to `secrets.env`.

Port: `YAPILY_UI_PORT=8772 ./run-ui.sh`

## Files

| Path | Purpose |
|------|---------|
| `yapily_client.py` | Shared API client + consent persist |
| `test.sh` | CLI probes |
| `ui/` | Explorer + `/callback` handler |
| `requests/` | Body templates |
| `responses/` | Live captures |
