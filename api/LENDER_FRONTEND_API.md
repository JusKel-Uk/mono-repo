# Lender portal — frontend API contract

Backend module: `lender.Core` (`/lender/*` routes).  
Auth users live in `identity.Users`; lender org data lives in the `lender` SQL schema.

## Public onboarding

### POST `/lender/access-requests`

Request access (maps to `/lender/request-access`).

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "workEmail": "jane.smith@acmelending.co.uk",
  "organisation": "Acme Lending Ltd",
  "website": "https://acmelending.co.uk",
  "role": "Head of Partnerships",
  "message": "Optional reason"
}
```

**202** `{ "requestId": "uuid" }` — always returns success shape (dedupes pending requests for same email).

### GET `/lender/invites/preview?token={inviteToken}`

Preload create-account page. Token comes from approval email link:

`/lender/create-account?token=...`

**200**

```json
{
  "email": "jane.smith@acmelending.co.uk",
  "firstName": "Jane",
  "lastName": "Smith",
  "organisationName": "Acme Lending Ltd"
}
```

**404** — invalid or expired token.

### POST `/lender/accounts`

Create lender account after approval.

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@acmelending.co.uk",
  "password": "SecurePass123!@#",
  "inviteToken": "token-from-url"
}
```

Password: 12+ chars, upper, lower, number, symbol.

**201** `{ "userId": "uuid", "accessToken": "jwt" }` — store token like SME `login()`.

### POST `/lender/sessions`

Lender sign-in (`/lender/login`).

```json
{ "email": "...", "password": "..." }
```

**201** `{ "userId", "accessToken", "firstName", "lastName" }`  
**403** `errorCode: NOT_LENDER_ACCOUNT` — valid user but not a lender member.

JWT includes claim `portal=lender`.

## Authenticated lender

### GET `/lender/me`

Requires `Authorization: Bearer` with `portal=lender`.

**200**

```json
{
  "userId": "uuid",
  "email": "...",
  "firstName": "Jane",
  "lastName": "Smith",
  "organisation": { "id": "uuid", "name": "Acme Lending Ltd" }
}
```

## Password reset (identity — reuse)

Send header on all three calls when using lender UI:

`X-Juskel-Portal: lender`

| Step | Endpoint | Body |
|------|----------|------|
| Send code | `POST /identity/password-reset` | `{ "email" }` |
| Verify | `POST /identity/password-reset/verify` | `{ "email", "code" }` → `{ "token" }` |
| Confirm | `POST /identity/password-reset/confirm` | `{ "token", "password" }` |

Store `token` from verify (e.g. sessionStorage) and pass to confirm. Lender password rules apply on confirm when portal header is set.

## Admin (Swagger / internal tools)

Requires JWT for a user ID in `Lender:AdminUserIds` config.

| Method | Path |
|--------|------|
| GET | `/lender/admin/access-requests?status=pending` |
| GET | `/lender/admin/access-requests/{id}` |
| POST | `/lender/admin/access-requests/{id}/approve` |
| POST | `/lender/admin/access-requests/{id}/reject` `{ "reason"?: "..." }` |

Approval emails a link: `{JUSKEL_FRONTEND_URL}/lender/create-account?token=...`

## Frontend wiring checklist

1. Replace dummies in `client/lib/api/lender-auth.ts` with `request()` calls above.
2. Read `?token=` on create-account; remove hardcoded `APPROVED_EMAIL`.
3. Pass reset `token` from verify step into confirm.
4. Call `setToken(accessToken)` on sign-in and create-account.
5. Add `X-Juskel-Portal: lender` on password-reset calls.
6. Remove `LenderAuthSwitcher` when live.
