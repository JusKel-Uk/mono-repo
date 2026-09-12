# Frontend handover — Organisations, RBAC & team invites

**Date:** September 2026  
**Backend scope:** `api/` only — this document is for the frontend developer integrating against the hosted juskel API.  
**Authoritative contracts:** [ORGANISATIONS_FRONTEND_API.md](./ORGANISATIONS_FRONTEND_API.md), [ONBOARDING_FRONTEND_API.md](./ONBOARDING_FRONTEND_API.md), [SETTINGS_FRONTEND_API.md](./SETTINGS_FRONTEND_API.md)

---

## 1. Summary (read this first)

The API moved from **one user → one application** to **one organisation → many members → one draft application per org**.

| Before | After |
|--------|--------|
| Onboarding data tied to the signed-in user | Onboarding/funding/scoring data tied to the **active organisation** |
| Account closure on the user | **Organisation closure** (Owner only) |
| No team / invites | Full team RBAC + email invites |
| Register returns `userId`, `email`, `emailVerified` | Register also returns **`defaultOrganisationId`** (`null` on invite signup) |

**Good news for MVP:** If a user belongs to **only one organisation** (every new founder today), existing `/applications/current/*` calls **keep working without changes** — no `X-Organisation-Id` header required.

**New work:** Team tab, org switcher (multi-org users), invite accept page, Settings privacy → org closure, and RBAC-aware UI (disable submit / invite / edit by role).

---

## 2. What you do **not** need to change (solo founder path)

These stay the same URL paths and JSON shapes:

- `POST /onboarding/applications`
- `GET|PUT /onboarding/applications/current/company-setup`
- `GET|PUT /onboarding/applications/current/business-profile`
- `GET|PUT /funding/applications/current/financial-profile`
- `GET|PUT /scoring/applications/current/sustainability-profile`
- `GET|PUT /funding/applications/current/funding-profile`
- `POST /onboarding/applications/current/submit`
- Integration OAuth (`POST .../authorize`, browser callback, `DELETE .../integrations/...`)
- Evidence upload/download

No new fields on those request/response bodies for org support.

---

## 3. Breaking / deprecated changes

| Item | Action |
|------|--------|
| `POST /identity/me/account-closure` | **Removed** — returns **410 Gone**. Use `POST /identity/organisations/{organisationId}/closure` (Owner only). See [SETTINGS_FRONTEND_API.md](./SETTINGS_FRONTEND_API.md). |
| `RegisterResponse` | Add `defaultOrganisationId: string \| null` (`client/lib/api/auth.ts`). `null` on invite signup. |
| Settings Team / Privacy UI | Wire to real endpoints (currently mock-only in `client/`). |

---

## 4. Organisation context — when to send `X-Organisation-Id`

Header name: **`X-Organisation-Id`** (GUID string).

**Resolution order on the server:**

1. `X-Organisation-Id` header (if present and user is a member)
2. `User.LastOrganisationId` (persisted via `PUT /identity/me/organisations/current`)
3. If the user has **exactly one** membership → that org is used automatically

**You do not need the header on every request** if you call `PUT /identity/me/organisations/current` when the user switches org in the UI.

### Routes that use org context

- All `/onboarding/applications/current/*`
- All `/funding/applications/current/*` and `/funding/integrations/*` (except OAuth **callback** — anonymous)
- All `/scoring/applications/current/*`
- Team routes under `/identity/organisations/{id}/*`

### Error responses (RFC 7807 `ProblemDetails`)

| HTTP | `type` | When |
|------|--------|------|
| 400 | `organisation-context-required` | User has 2+ orgs and no header / no current org |
| 403 | `organisation-closed` | Org closure was requested |
| 403 | — | Not a member, or role denied (e.g. Viewer PUT) |

**Recommended client pattern:**

```typescript
// client/lib/api/client.ts — extend RequestOptions
type RequestOptions = {
  auth?: boolean;
  organisationId?: string; // sets X-Organisation-Id when provided
};

// After login:
const orgs = await getOrganisations();
if (orgs.length === 1) {
  currentOrgId = orgs[0].id; // optional — API infers automatically
} else if (orgs.length > 1) {
  currentOrgId = orgs.find(o => o.isCurrent)?.id ?? orgs[0].id;
  await setCurrentOrganisation(currentOrgId); // PUT .../current
}
// Pass organisationId on requests when multi-tab or explicit override needed
```

---

## 5. Roles — UI permission matrix

`OrganisationRole` enum (same values in API JSON):

| Role | Value | Edit onboarding/funding/scoring | Submit application | Invite / manage team | Close org |
|------|-------|-----------------------------------|--------------------|----------------------|-----------|
| Owner | 0 | yes | yes | yes | yes |
| Admin | 1 | yes | yes | yes | no |
| Contributor | 2 | yes | no | no | no |
| Viewer | 3 | **read only** | no | no | no |

Use `GET /identity/me/organisations` — each item includes `role` for the signed-in user in that org.

**UI hints:**

- Hide or disable **Submit** for Contributor and Viewer.
- Hide **Invite** / role change / remove for Contributor and Viewer.
- Hide **Request organisation closure** for non-Owners.
- Viewer: load GET endpoints but disable forms and uploads (API returns **403** on PUT/POST if they try anyway).

---

## 6. New identity endpoints (Team tab)

All require `Authorization: Bearer {jwt}` unless noted.

| Method | Path | Who | Notes |
|--------|------|-----|-------|
| `GET` | `/identity/me/organisations` | Any member | Org switcher data; `isCurrent`, `isClosed`, `role` |
| `PUT` | `/identity/me/organisations/current` | Member of target org | Body: `{ "organisationId": "uuid" }` |
| `GET` | `/identity/organisations/{id}/members` | Member | Team list |
| `GET` | `/identity/organisations/{id}/invites` | Owner / Admin | Pending invites (including expired) |
| `POST` | `/identity/organisations/{id}/invites` | Owner / Admin | Body: `{ "email", "role" }` |
| `POST` | `/identity/organisations/{id}/invites/{inviteId}/resend` | Owner / Admin | Rotates token, resets 7-day expiry, re-sends email |
| `POST` | `/identity/invites/preview` | Anonymous | Body: `{ "code" }`. Returns email, org name, role, expiresAt. Rate-limited (5/min/IP). |
| `POST` | `/identity/invites/{token}/accept` | Invitee (JWT) | No body; 6-digit code in path. Rate-limited (30/min/IP). |
| `PATCH` | `/identity/organisations/{id}/members/{userId}` | Owner / Admin | Body: `{ "role" }` |
| `DELETE` | `/identity/organisations/{id}/members/{userId}` | Owner / Admin | Cannot remove last Owner (409) |
| `POST` | `/identity/organisations/{id}/closure` | Owner | Empty body; idempotent |

Swagger tag: **`identity-organisations`** (Development: `/swagger`).

### TypeScript types (suggested)

```typescript
export enum OrganisationRole {
  Owner = 0,
  Admin = 1,
  Contributor = 2,
  Viewer = 3,
}

export type OrganisationSummary = {
  id: string;
  name: string;
  role: OrganisationRole;
  isClosed: boolean;
  isCurrent: boolean;
};

export type OrganisationMember = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: OrganisationRole;
  joinedAt: string;
};

export type CreateInviteRequest = {
  email: string;
  role: OrganisationRole; // not Owner (0)
};

export type OrganisationInvite = {
  id: string;
  email: string;
  role: OrganisationRole;
  expiresAt: string;
  createdAt: string;
};

export type CreateInviteResponse = {
  inviteId: string;
  email: string;
  role: OrganisationRole;
  expiresAt: string;
  acceptToken: string; // 6-digit code; email also links to /accept-invite
};

export type AcceptInviteResponse = {
  organisationId: string;
  organisationName: string;
  role: OrganisationRole;
};

export type RegisterResponse = {
  userId: string;
  email: string;
  emailVerified: boolean;
  defaultOrganisationId: string | null; // null when registering with inviteCode
};

export type PreviewInviteRequest = { code: string };

export type PreviewInviteResponse = {
  email: string;
  organisationName: string;
  role: OrganisationRole;
  expiresAt: string;
};
```

---

## 7. Invite flow — frontend pages to build

Happy path: **type the 6-digit code once**. Do not send them back to email. Do **not** put the code in the URL.

Suggested `sessionStorage` key: `juskel.pendingInvite` → `{ code, email, organisationName, role }`.

```text
Owner/Admin                         Invitee
    |                                   |
    | POST .../invites                  |
    |---------------------------------->| email: 6-digit code + /accept-invite
    |                                   |
    |                                   | Open /accept-invite (no ?token=)
    |                                   | Type code once
    |                                   | POST /identity/invites/preview
    |                                   |
    |              +--------------------+--------------------+
    |              | Signed in, email matches                |
    |              |   POST accept → current org             |
    |              |   → /onboarding/company-setup           |
    |              +--------------------+--------------------+
    |              | No account                              |
    |              |   Signup (email locked) + inviteCode    |
    |              |   Login?next=/accept-invite             |
    |              |   Auto-accept from sessionStorage       |
    |              |   → /onboarding/company-setup           |
    |              +--------------------+--------------------+
    |              | Existing account, signed out            |
    |              |   Login (email locked) + next           |
    |              |   Auto-accept from sessionStorage       |
    |              +-----------------------------------------+
```

| Step | Behaviour |
|------|-----------|
| `/accept-invite` | Code field first. On valid preview, persist `{ code, email, organisationName, role }` in `sessionStorage`. Show org + role. |
| Signed in, email matches | `POST /identity/invites/{code}/accept` immediately → `PUT .../organisations/current` → `/onboarding/company-setup`. |
| Signed in, email differs | Block; tell them to switch to the invited address. |
| Create account | Signup with email **locked** to preview email; `POST /identity/users` includes `inviteCode`. Response: `emailVerified: true`, `defaultOrganisationId: null`. Then login with `next=/accept-invite`. **No verification OTP.** |
| Sign in | Prefill/lock email; `next=/accept-invite`. After login, page reads storage and auto-accepts. |
| Lost storage | Idle paste form remains as backup (the email still has the code). |
| After accept | Always `/onboarding/company-setup` for that org, even if already submitted. Viewer: read-only (writes 403). |

### Invite validation (show in form + handle 400)

- **Business email only** — Gmail, Yahoo, Outlook, iCloud, etc. rejected.
- **Same domain as organisation** — e.g. owner `@acme.co.uk` → only `*@acme.co.uk` invites allowed. Domain is set at org creation from the Owner’s email.

**Security:** Preview proves the code exists; accept still requires JWT + matching email. Do not put the code in the URL (access logs / referrers).

---

## 8. Registration change

`POST /identity/users` — founder (omit `inviteCode`):

```json
{
  "userId": "uuid",
  "email": "founder@company.co.uk",
  "emailVerified": false,
  "defaultOrganisationId": "uuid"
}
```

Each **founder** gets a default org (Owner). Name is derived from email domain (e.g. `company.co.uk` → “Company”). Solo users never need the org header.

Invite signup (include `inviteCode`): `emailVerified: true`, `defaultOrganisationId: null`, no OTP. They still **log in**, then accept from `sessionStorage`. They join the inviting org only — no personal workspace.

---

## 9. Settings → Privacy (organisation closure)

Replace any wiring to `POST /identity/me/account-closure`:

- **New:** `POST /identity/organisations/{organisationId}/closure` (empty body)
- **Owner only**; **idempotent** (200 even if already closed)
- User **stays signed in**; org shows `isClosed: true` on `GET /identity/me/organisations`
- Block or message when `isClosed` — org-scoped API calls return **403** `organisation-closed`

Copy in UI should say **organisation closure**, not “delete my account”.

---

## 10. Suggested implementation phases

### Phase 1 — No user-visible change (solo founders)

- [ ] Add `defaultOrganisationId` to `RegisterResponse`
- [ ] Swap account closure → org closure in Settings when that screen is wired
- [ ] Optional: centralise `organisationId` on `request()` for future use

### Phase 2 — Team tab

- [ ] `GET /identity/me/organisations` + `GET .../members`
- [ ] Invite form with domain hint (derive from current user’s email domain or org list)
- [ ] Handle 400 validation errors from invite API
- [ ] Role change / remove member (Owner/Admin only)

### Phase 3 — Invite accept + multi-org

- [ ] `/accept-invite`: preview → sessionStorage → signup with `inviteCode` or login with `next`
- [ ] Signup/verify: do **not** drop pending invite; invite signup skips OTP
- [ ] After accept → `/onboarding/company-setup` (read-only if Viewer / already submitted)
- [ ] Org switcher when `organisations.length > 1`
- [ ] `PUT /identity/me/organisations/current` on switch
- [ ] Handle 400 `organisation-context-required`

### Phase 4 — RBAC polish

- [ ] Disable submit / integrations / uploads by role
- [ ] Read-only financial/sustainability forms for Viewer
- [ ] Closed-org empty states

---

## 11. Testing

- **Swagger (local):** `http://localhost:5242/swagger` — tag `identity-organisations`
- **E2E reference:** `api/scripts/e2e-organisations-rbac-api.mjs` (invite, accept, RBAC, wrong domain, closure)
- **Solo onboarding E2E:** `api/scripts/e2e-onboarding-api.mjs` — unchanged paths; still passes without org header

Staging base URL (if deployed): see `api/QUICKBOOKS_E2E.md` or your team’s deploy notes.

---

## 12. FAQ

**Why header instead of org in the JWT?**  
Users can belong to multiple orgs with different roles. Org context is workspace selection (`LastOrganisationId` + optional header), not identity. Switching org should not require re-login. See team discussion in backend PR notes.

**Must every API call send `X-Organisation-Id`?**  
No. Single-org users: never. Multi-org users: set current org once via PUT, or send header per request.

**Can I invite `colleague@gmail.com`?**  
No — business email + same domain as the organisation.

**Does invite email contain a deep link?**  
Yes — to `{JUSKEL_FRONTEND_URL}/accept-invite` **without** the code in the URL. The user types the 6-digit code **once**; persist it (sessionStorage) through signup/login. Do not send them back to the inbox.

**Does every signup create a personal organisation?**  
Founders: yes. Invite signup (`inviteCode` matching that email): **no**. They join the inviting org only, after login + accept.

---

## 13. Related files in `client/` (reference only — not modified by backend)

| File | Notes |
|------|--------|
| `client/lib/api/auth.ts` | `inviteCode?` on register; `defaultOrganisationId: string \| null` |
| `client/app/accept-invite/accept-invite.tsx` | Preview first; persist invite; do not rely on `?token=` |
| `client/app/(auth)/signup/signup-form.tsx` | Honour locked email + `inviteCode` + `next` |
| `client/app/(auth)/login/login-form.tsx` | Already honours `next`; lock/prefill email from pending invite |
| `client/lib/api/onboarding.ts` | No org header support yet |
| `client/lib/api/client.ts` | Extend for `X-Organisation-Id` |
| `client/app/sme/settings/page.tsx` | Team + closure UI exists; not wired to API |

---

*Questions → backend owner or Swagger in Development.*
