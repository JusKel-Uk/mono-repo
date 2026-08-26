# SME Onboarding — BUILD SESSION Guide

> **You build this yourself.** The agent instructs; you type code. One milestone per session. Say **"I'm done"** when finished for verify + score.

Copy-paste into Cursor Agent:

```
@.cursorrules @.cursor/rules/ @api/BUILD_SESSION_ONBOARDING.md

Start a juskel BUILD SESSION for SME Onboarding API — Milestone [M0–M9].

Rules:
- I write all code manually — instruct only, one step at a time.
- Read api/documentation/modules/onboarding/implementation.html for the spec (no Figma needed).
- When I say "I'm done", verify (dotnet build), score /10, preview next milestone.
```

---

## Prerequisites

- Identity module working (`POST /identity/users`, verify, sign-in, `GET /identity/me`)
- SQL Server connection string configured
- Familiarity with [api/BUILD_SESSION.md](BUILD_SESSION.md) sessions 1–8

---

## Milestone roadmap

| # | Milestone | Goal | Verify |
|---|-----------|------|--------|
| M0 | Docs only | Register `api/documentation/modules/onboarding/` | Docs site renders |
| M1 | `onboarding` skeleton | `Application` + `StepProgress`, create/current endpoints | Swagger shows `0 of 5` |
| M2 | Company setup | CRUD + Companies House verify (`juskel.Integrations`) | CH verify in Swagger |
| M3 | Business profile | Sector, location, description CRUD | Progress `2 of 5` |
| M4 | `funding` + evidence | Self-declared financial bands + Azure Blob uploads | PDF upload works |
| M5 | Open Banking | `IOpenBankingProvider` + OAuth (TrueLayer) | Connect locks bands |
| M6 | Xero + QuickBooks | Accounting OAuth + band mapping | Integration status in GET |
| M7 | `scoring` | 9 ESG sustainability questions + cert uploads | Progress `4 of 5` |
| M8 | Funding + submit | Funding profile + `POST submit` gate | 409 if incomplete |
| M9 | Hardening | Token encryption, rate limits, integration test | Full happy-path test |

**Step order:** Company → Business → Financial → Sustainability → Funding

---

## Module layout (target)

```text
api/src/
├── Infrastructure/juskel.Integrations/   # CH, OB, Xero, QB, Blob — no business rules
├── Modules/onboarding/                   # Wizard state, company + business steps
├── Modules/funding/                      # Financial + funding profiles, OAuth
└── Modules/scoring/                      # Sustainability ESG questionnaire
```

Full endpoint/DTO/validation tables: [documentation/modules/onboarding/implementation.html](documentation/modules/onboarding/implementation.html)

---

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| Scope | API only |
| Architecture | Split: `onboarding` + `funding` + `scoring` |
| Open Banking | `IOpenBankingProvider` abstraction; TrueLayer first impl |
| File storage | Azure Blob (local fallback for dev) |
| Post-submit | Data collection only — scoring engine later |
| Money fields | `decimal` / `decimal(18,2)` — never `float` |

---

## Session start prompt (example — M1)

```
@.cursorrules @.cursor/rules/ @api/BUILD_SESSION_ONBOARDING.md

Start BUILD SESSION — Onboarding M1 (module skeleton + application aggregate).

Give me step 1 only. I will type the code myself.
```
