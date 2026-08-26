# Open Banking sandbox (Plaid)

UK/EU **open banking–style** bank data via [Plaid](https://plaid.com/docs/) sandbox — accounts, balances, transactions, identity.

Maps to juskel **Open Banking** data points in Data.html: cash inflows/outflows, runway, revenue patterns.

Docs: https://plaid.com/docs/sandbox/

## Where to place your keys

**File:** `api/sandbox/open-banking/secrets.env` (gitignored)

```bash
cd api/sandbox/open-banking
cp secrets.env.example secrets.env
```

| Variable | Where to get it |
|----------|-----------------|
| `PLAID_CLIENT_ID` | [Plaid Dashboard](https://dashboard.plaid.com/) → **Team Settings → Keys** → Sandbox **client_id** |
| `PLAID_SECRET` | Same page → Sandbox **secret** (not production) |
| `PLAID_ACCESS_TOKEN` | Run `./test.sh setup` once → paste printed `access_token` here |

Optional:

| Variable | Purpose |
|----------|---------|
| `PLAID_SANDBOX_INSTITUTION_ID` | Default `ins_116834` (UK: Flexible Platypus Open Banking) |
| `PLAID_PUBLIC_TOKEN` | Only if using `./test.sh exchange` after Plaid Link |
| `PLAID_TRANSACTIONS_DAYS` | Window for `./test.sh transactions` (default 90) |

Keep:

```env
PLAID_API_BASE_URL=https://sandbox.plaid.com
```

**Do not** put Plaid keys in `deploy-azure.env` or `appsettings.json` — local sandbox only.

## First-time setup

```bash
# 1. Fill PLAID_CLIENT_ID and PLAID_SECRET in secrets.env
./test.sh setup-simple   # easiest — US sandbox bank (ins_109508), no Link UI
# OR for UK institution ins_116834:
./test.sh setup
# 2. Copy PLAID_ACCESS_TOKEN=... into secrets.env (UI setup buttons do this automatically)
./test.sh all
```

## Local explorer UI

Same idea as Companies House `ui/` — browser talks to localhost; Plaid keys stay server-side.

```bash
cd api/sandbox/open-banking/ui
./run-ui.sh
# → http://127.0.0.1:8766
```

Sidebar: **Connect sandbox (simple)**, UK connect, accounts, balances, transactions, institutions. Friendly summaries + collapsible raw JSON. **Connect** saves `PLAID_ACCESS_TOKEN` into `../secrets.env` automatically.

Port override: `PLAID_UI_PORT=8770 ./run-ui.sh`

`setup-simple` is the most reliable way to get an access token without Plaid Link. UK OAuth banks (`ins_116834`) may still require Link in some cases — use `setup-simple` first to learn response shapes.

## Commands

| Command | Plaid endpoint | juskel use |
|---------|----------------|------------|
| `./test.sh setup` | sandbox token + exchange | Get `PLAID_ACCESS_TOKEN` |
| `./test.sh institutions` | List UK institutions | Find other sandbox banks |
| `./test.sh accounts` | `accounts/get` | Linked accounts |
| `./test.sh balances` | `auth/get` | Cash balances |
| `./test.sh transactions` | `transactions/get` | Inflows / outflows / volatility |
| `./test.sh identity` | `identity/get` | Account holder names |
| `./test.sh all` | All of the above | Full shape probe |

## UK sandbox institutions (examples)

| Name | ID |
|------|-----|
| Flexible Platypus Open Banking | `ins_116834` (default) |
| Royal Bank of Plaid | `ins_117650` |

`ins_116834` supports **transactions** and **auth** only — not **identity**. In `secrets.env`:

```env
PLAID_PRODUCTS=transactions,auth
```

Sandbox test credentials: username `user_good`, password `pass_good` (when using Link).

## Files

| Path | Purpose |
|------|---------|
| `secrets.env` | **Your Plaid sandbox keys** |
| `requests/` | JSON body templates |
| `responses/` | Paste live captures |
| `test.sh` | One-command probes |
| `ui/` | Local explorer (port 8766) — `./ui/run-ui.sh` |

## Notes

- Plaid sandbox is **not** raw UK Open Banking (PSD2) — it’s an **aggregator** with a unified API (as requested).
- Production uses `https://production.plaid.com` and production keys after Plaid approval.
- Access tokens can be long-lived; create a new Item with `setup` if revoked.
