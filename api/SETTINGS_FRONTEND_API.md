# Settings API — Frontend integration guide

Maps the SME Settings page (`/sme/settings`) to Identity endpoints.

**OpenAPI (dev):** `http://localhost:5242/swagger`  
**Auth:** Bearer `accessToken` from `POST /identity/sessions` unless noted.  
**Out of scope:** Team tab (invites/roles), email change, MFA, billing, notification inbox.

After this API ships, **existing access tokens are rejected** until the user signs in again. Sign-in now records a server session (`jti`); revoked or missing sessions return 401.

---

## Tab → endpoint map

| Settings tab | UI action | Method | Path |
|--------------|-----------|--------|------|
| Profile | Load | `GET` | `/identity/me` |
| Profile | Save changes | `PATCH` | `/identity/me` |
| Notifications | Load toggles | `GET` | `/identity/me/notification-preferences` |
| Notifications | Toggle (no Save button) | `PUT` | `/identity/me/notification-preferences` |
| Security | Send password reset code | `POST` | `/identity/me/password-reset` |
| Security | Forgot-password screens | `POST` | `/identity/password-reset` → `/verify` → `/confirm` |
| Security | Active sessions | `GET` | `/identity/me/sessions` |
| Security | Sign out a device | `DELETE` | `/identity/me/sessions/{id}` |
| Security | Sign out this browser | `DELETE` | `/identity/me/sessions/current` |
| Privacy | Request organisation closure (Owner) | `POST` | `/identity/organisations/{organisationId}/closure` |

**Team** is not implemented. Do not call invite/role APIs; keep the tab mock or hide Invite until a later release.

---

## Profile

`GET /identity/me` (additive — extra fields, existing ones unchanged):

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "email": "ada@example.com",
  "firstName": "Ada",
  "lastName": "Lovelace",
  "jobTitle": "Founder & Managing Director",
  "phone": "+44 117 000 0000",
  "accountClosureRequestedAt": null
}
```

| Mock UI label | JSON field | Notes |
|---------------|------------|--------|
| Full name | `firstName` + `lastName` | Join with a space for display |
| Role | `jobTitle` | Job title, **not** Owner/Admin |
| Email | `email` | Read-only |
| Phone (Optional) | `phone` | Nullable |

`PATCH /identity/me` body (no `email` — changing email is not supported):

```json
{
  "firstName": "Ada",
  "lastName": "Lovelace",
  "jobTitle": "Founder & Managing Director",
  "phone": "+44 117 000 0000"
}
```

Response is the same as `GET /identity/me`. Empty `jobTitle` / `phone` store `null`.

`GET /identity/users/{id}` is unchanged (`id`, `email`, `firstName`, `lastName` only).

---

## Notifications (email preferences)

Six booleans. Missing row → all `true` (matches the mock defaults). `PUT` the full object on each toggle.

```json
{
  "assessmentProgress": true,
  "submissionsNeedAttention": true,
  "expertReviewUpdates": true,
  "integrationSyncEvents": true,
  "scoreUpdates": true,
  "newFundingMatches": true
}
```

| UI title | JSON key |
|----------|----------|
| Assessment progress | `assessmentProgress` |
| Submissions that need your attention | `submissionsNeedAttention` |
| Sustainability Expert review updates | `expertReviewUpdates` |
| Integration sync events | `integrationSyncEvents` |
| Sustainability Finance Score updates | `scoreUpdates` |
| New funding matches | `newFundingMatches` |

These flags are **stored only**. Assessment/funding emails do not read them yet.

The `/sme/notifications` inbox is a different surface and has no API here.

---

## Security — password reset

**Logged-in (Settings button):** `POST /identity/me/password-reset` (empty body).

**Logged-out (forgot-password screens):**

1. `POST /identity/password-reset` `{ "email": "ada@example.com" }` — always **200** (does not reveal whether the email exists).
2. `POST /identity/password-reset/verify` `{ "email": "...", "code": "847291" }` → `{ "token": "..." }` (short-lived reset token, not a session JWT).
3. `POST /identity/password-reset/confirm` `{ "token": "...", "password": "N3wP@ssw0rd!" }` → **204**. Revokes every session; user must sign in again.

OTP: 6 digits, 10 minutes, 5 attempts. Confirm password min 8 characters.

---

## Security — sessions

`GET /identity/me/sessions`:

```json
{
  "sessions": [
    {
      "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "deviceLabel": "Chrome on macOS",
      "createdAt": "2026-09-06T18:00:00Z",
      "expiresAt": "2026-09-06T19:00:00Z",
      "isCurrent": true
    }
  ]
}
```

No city/IP in the payload. Use `isCurrent` for “this browser / Now”; other rows can show `createdAt`. Do not show mock locations.

- `DELETE /identity/me/sessions/{id}` — 204 (404 if not yours).
- `DELETE /identity/me/sessions/current` — server logout for this token, then `clearToken()` on the client.

---

## Privacy

`POST /identity/organisations/{organisationId}/closure` (empty body), Owner only, idempotent:

```json
{ "status": "requested", "requestedAt": "2026-09-06T18:30:00Z" }
```

Requires org context when the user belongs to multiple organisations. The user **stays signed in**. Reload Team/Privacy from `GET /identity/me/organisations` — if `isClosed` is true for that org, show the success panel. This does not set `DeletedAt` or wipe data.

**Deprecated:** `POST /identity/me/account-closure` returns **410 Gone**. See [ORGANISATIONS_FRONTEND_API.md](./ORGANISATIONS_FRONTEND_API.md).

---

## Client stubs to replace

[`client/lib/api/auth.ts`](../client/lib/api/auth.ts) parked `requestPasswordReset` / `verifyResetCode` / `resetPassword` (501) should call the three public password-reset paths above. `logout()` should `DELETE /identity/me/sessions/current` then `clearToken()`. `MeResponse` should add `jobTitle`, `phone` (no user-level closure field).
