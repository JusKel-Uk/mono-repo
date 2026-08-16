# Xero sandbox

Xero accounting API (OAuth 2.0). Docs: https://developer.xero.com/

**Note:** Folder is `xero` (accounting software), not Xerox document services.

## Flow

1. Authorize in Xero developer portal → get `access_token` + `tenant_id`
2. **GET** `https://api.xero.com/api.xro/2.0/Organisation`
3. **GET** `https://api.xero.com/api.xro/2.0/Accounts`

## Files

- `requests/get-organisation.json` — organisation profile
- `requests/get-accounts.json` — chart of accounts
- `responses/` — paste live captures

## Test

```bash
cp secrets.env.example secrets.env
# paste XERO_ACCESS_TOKEN and XERO_TENANT_ID from OAuth playground
./test.sh organisation
./test.sh accounts
```
