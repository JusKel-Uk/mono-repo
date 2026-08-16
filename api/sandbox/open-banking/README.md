# Open Banking sandbox

UK Open Banking uses OAuth 2.0 + FAPI headers. Provider URLs differ (TrueLayer, Monzo, etc.).

Docs hub: https://standards.openbanking.org.uk/

## Typical flow (Account Information — AIS)

1. **Client credentials** or **authorization code** → access token
2. **GET** `/accounts` with `Authorization: Bearer {token}`
3. **GET** `/accounts/{accountId}/transactions`

Set your aggregator/provider base URL in `secrets.env`.

## Files

- `requests/token-client-credentials.json` — token request shape (adjust to your provider)
- `requests/get-accounts.json` — accounts list notes
- `responses/` — paste token + accounts JSON after tests

## Test

```bash
cp secrets.env.example secrets.env
# fill OPEN_BANKING_* vars from your sandbox dashboard
./test.sh token        # if your provider supports client_credentials in sandbox
./test.sh accounts     # requires OPEN_BANKING_ACCESS_TOKEN in secrets.env
```
