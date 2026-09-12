# Organisations & RBAC — Frontend API Contract

Backend scope for Team tab, org switcher, and multi-company access. All routes require JWT unless noted.

## Organisation context header

| Header | When required |
|--------|----------------|
| `X-Organisation-Id` | Required when the signed-in user belongs to **more than one** organisation and the route is org-scoped (onboarding, funding, scoring, team). |

Resolution order:

1. `X-Organisation-Id` header (if present and user is a member)
2. `User.LastOrganisationId` (set via `PUT /identity/me/organisations/current`)
3. If user has a single membership, that org is used automatically

Errors:

| Status | `type` | Meaning |
|--------|--------|---------|
| 400 | `organisation-context-required` | Multiple orgs; header or current org missing |
| 403 | `organisation-closed` | Organisation closure requested |
| 403 | — | Not a member or insufficient role |

## Roles

| Role | Value | Write onboarding/funding/scoring | Submit application | Manage team | Close org |
|------|-------|----------------------------------|--------------------|-------------|-----------|
| Owner | 0 | yes | yes | yes | yes |
| Admin | 1 | yes | yes | yes | no |
| Contributor | 2 | yes | no | no | no |
| Viewer | 3 | no (read only) | no | no | no |

## Endpoints

### List my organisations

`GET /identity/me/organisations`

```json
[
  {
    "id": "uuid",
    "name": "Acme Ltd",
    "role": 0,
    "isClosed": false,
    "isCurrent": true
  }
]
```

### Set current organisation

`PUT /identity/me/organisations/current`

```json
{ "organisationId": "uuid" }
```

### Team members

`GET /identity/organisations/{organisationId}/members`

Requires org context (header or current org when multiple).

### List pending invites

`GET /identity/organisations/{organisationId}/invites`

Owner / Admin. Returns pending invites (`acceptedAt` is null), including expired rows so the Team tab can offer Resend.

```json
[
  {
    "id": "uuid",
    "email": "teammate@company.co.uk",
    "role": 2,
    "expiresAt": "2026-09-14T12:00:00Z",
    "createdAt": "2026-09-07T12:00:00Z"
  }
]
```

### Invite member

`POST /identity/organisations/{organisationId}/invites`

```json
{ "email": "teammate@company.co.uk", "role": 2 }
```

Invitee email must:

- Be a **business email** (personal providers like Gmail are rejected)
- Use the **same domain** as the organisation (set from the Owner’s email at registration), e.g. if the org domain is `acme.co.uk`, only `*@acme.co.uk` addresses are allowed

`acceptToken` is a **6-digit code** (Development responses include it for E2E). The invite email shows the same code plus a button to `{JUSKEL_FRONTEND_URL}/accept-invite` (**no code in the URL**).

### Preview invite (anonymous)

`POST /identity/invites/preview`

No JWT. Rate-limited (**429** after 5 requests/minute/IP). Body:

```json
{ "code": "123456" }
```

Spaces in the code are ignored. `200`:

```json
{
  "email": "teammate@company.co.uk",
  "organisationName": "Acme Ltd",
  "role": 2,
  "expiresAt": "2026-09-14T12:00:00Z"
}
```

`404` if the code is invalid, expired, or already used (same as accept — do not distinguish). Use this to lock the signup email and show “You’re joining {org} as {role}” before the user has an account.

### Resend invite

`POST /identity/organisations/{organisationId}/invites/{inviteId}/resend`

Owner / Admin. Empty body. Rotates the accept token, resets expiry to 7 days, and sends the email again. **404** if the invite is missing, already accepted, or belongs to another organisation.

Response shape matches create-invite (`inviteId`, `email`, `role`, `expiresAt`, `acceptToken` in Development).

### Accept invite

`POST /identity/invites/{token}/accept`

Authenticated; invitee email must match signed-in user. `{token}` is the 6-digit invite code from the email (spaces optional). Rate-limited (**429** after 30 requests/minute/IP).

After **200**, call `PUT /identity/me/organisations/current` then send the user to `/onboarding/company-setup` for that org (even if the application is already submitted — Viewer is read-only).

### Update member role

`PATCH /identity/organisations/{organisationId}/members/{userId}`

```json
{ "role": 1 }
```

Cannot demote/remove the last Owner (409).

### Remove member

`DELETE /identity/organisations/{organisationId}/members/{userId}`

### Organisation closure (Privacy)

`POST /identity/organisations/{organisationId}/closure`

Owner only. Idempotent. Sets `isClosed` on the organisation; blocks all org-scoped routes for members.

**Deprecated:** `POST /identity/me/account-closure` → **410 Gone**

## Registration

`POST /identity/users`

Founder (no `inviteCode`):

```json
{
  "userId": "uuid",
  "email": "founder@company.co.uk",
  "emailVerified": false,
  "defaultOrganisationId": "uuid"
}
```

Each founder gets a default organisation (Owner) derived from email domain, plus a verification OTP email.

Invitee (optional `inviteCode` — the 6-digit code from preview):

```json
{
  "firstName": "Pat",
  "lastName": "Lee",
  "email": "teammate@company.co.uk",
  "password": "…",
  "inviteCode": "123456"
}
```

When the code is valid **and** the email matches the invite:

- No personal/default organisation is created (`defaultOrganisationId` is `null`)
- `emailVerified` is `true` (no verification OTP)
- The invite stays **pending** until `POST /identity/invites/{code}/accept` after login

`400` if the code is invalid/expired/already used, or the email does not match. `400` “already registered” if that email has an account — send them to login with the stored invite.

## Onboarding / funding / scoring

All `/applications/current/*` routes resolve the draft or current application for the **active organisation**, not the user alone.

When integrating from the frontend:

1. After sign-in, call `GET /identity/me/organisations`
2. If `length > 1`, show org switcher and send `X-Organisation-Id` on org-scoped calls
3. On switch, call `PUT /identity/me/organisations/current` and/or set the header

See also [ONBOARDING_FRONTEND_API.md](./ONBOARDING_FRONTEND_API.md) and [SETTINGS_FRONTEND_API.md](./SETTINGS_FRONTEND_API.md).
