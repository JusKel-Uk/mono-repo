# Notifications API — Frontend integration guide

Maps the SME inbox (`/sme/notifications`) and bell badge to the notifications module.

**OpenAPI (dev):** `http://localhost:5242/swagger`  
**Auth:** Bearer `accessToken` from `POST /identity/sessions`.  
**Org:** send `X-Organisation-Id` on inbox routes (same as other SME APIs). Preferences are per user, not per org.

Settings toggles stay on Identity — see [`SETTINGS_FRONTEND_API.md`](SETTINGS_FRONTEND_API.md). This document covers the **inbox**. Swap the seeded Zustand store in `client/lib/dashboard/notifications.ts` for these endpoints.

---

## Inbox → endpoint map

| UI | Method | Path |
|----|--------|------|
| Notifications list | `GET` | `/notifications` |
| Bell unread badge | `GET` | `/notifications/unread-count` |
| Mark one as read | `POST` | `/notifications/{id}/read` |
| Mark all as read | `POST` | `/notifications/read-all` |
| Preferences (canonical) | `GET` / `PUT` | `/notifications/me/preferences` |

The Settings page can keep calling `/identity/me/notification-preferences` — same DTO.

---

## List

`GET /notifications`

```json
{
  "items": [
    {
      "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "title": "2 new funding matches",
      "category": "FUNDING MATCH",
      "body": "Lloyds Clean Growth and Innovate UK Smart Grants added to your list.",
      "createdAt": "2026-09-10T10:00:00Z",
      "read": false,
      "actionUrl": "/sme/funding-matches"
    }
  ]
}
```

| Field | Notes |
|-------|--------|
| `category` | Display label: `ONBOARDING`, `SUBMISSION`, `EXPERT REVIEW`, `INTEGRATION`, `SCORE`, `FUNDING MATCH` |
| `createdAt` | UTC ISO-8601 — format relative time on the client |
| `actionUrl` | Optional deep link; may be null |
| icons | Client maps `category` → Lucide icon. API does not send icons |

Newest first. Poll this list (and unread-count) — there is no websocket.

Empty list: `{ "items": [] }` (200), not 404.

---

## Unread count

`GET /notifications/unread-count`

```json
{ "count": 2 }
```

Use `count` for the bell badge. Hide the badge when `count === 0`.

---

## Mark read

- `POST /notifications/{id}/read` → **204**. **404** if it is not yours / not in this org.
- `POST /notifications/read-all` → **204**. Idempotent.

---

## Preferences (gateway)

The notification **gateway** is the only place that applies preferences. Producers (funding, onboarding, scoring) never check them.

A send is delivered only if **the category is on AND the channel is on**.

```json
{
  "assessmentProgress": true,
  "submissionsNeedAttention": true,
  "expertReviewUpdates": true,
  "integrationSyncEvents": true,
  "scoreUpdates": true,
  "newFundingMatches": true,
  "inAppEnabled": true,
  "emailEnabled": true
}
```

| Flag | Inbox label | Example |
|------|-------------|---------|
| `assessmentProgress` | ONBOARDING | Section / profile complete |
| `submissionsNeedAttention` | SUBMISSION | Missing evidence (when wired) |
| `expertReviewUpdates` | EXPERT REVIEW | Reviewer flags (when wired) |
| `integrationSyncEvents` | INTEGRATION | Xero / QuickBooks / Open Banking sync or revoke |
| `scoreUpdates` | SCORE | Score recalculated (when wired) |
| `newFundingMatches` | FUNDING MATCH | New matches (when wired) |
| `inAppEnabled` | — | Global in-app channel |
| `emailEnabled` | — | Global email channel |

Missing row → every flag `true`. Omitting `inAppEnabled` / `emailEnabled` on PUT defaults them to `true` (existing Settings PUT of six booleans stays valid).

OTP, password reset, and org-invite emails are **not** preference-gated and never appear in the inbox.

---

## Reload behaviour

1. On Notifications page mount: `GET /notifications`.
2. On dashboard shell mount (or interval): `GET /notifications/unread-count`.
3. After Mark all as read: `POST /notifications/read-all`, then refetch list + count.
