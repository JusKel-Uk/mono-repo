
<div class="cover">

# Credit Bureau Implementation

<p class="subtitle">Costs, Compliance, Feasibility & Action Plan</p>

<dl class="cover-meta">
<dt>Date</dt><dd>7 September 2026</dd>
<dt>Version</dt><dd>1.0</dd>
<dt>Prepared for</dt><dd>juskel leadership, product, engineering, and compliance</dd>
<dt>Companion doc</dt><dd>Commercial Credit & Banking Intelligence — Tech Lead Research Report</dd>
<dt>Basis</dt><dd>Public vendor/industry data + juskel MVP budget constraints (£5–15/mo infra is separate from bureau fees)</dd>
</dl>

</div>

<div class="callout">

**Realistic headline:** Implementing **production credit bureau enrichment** for juskel is feasible, but it is **not a £500 side project**. A honest **Year 1 budget** for a regulated, consent-gated bureau integration starts around **£8,000–£15,000** on the **lean path** (Creditsafe + legal + engineering), or **£40,000–£80,000+** on the **enterprise path** (Experian/Equifax + FCA/CIGB depth). **Timeline: 3–4 months minimum** on the lean path; **6–9 months** if FCA authorisation and reciprocity reporting are required.

</div>

<div class="toc">

## Contents

1. Executive decision summary
2. Three implementation paths (with costs)
3. Year 1 cost model by SME volume
4. Compliance — what applies to juskel
5. Compliance action checklist & timeline
6. Feasibility — will it work for our SMEs?
7. What we need to do — phased action plan
8. Engineering effort & internal cost
9. Vendor cost comparison (realistic ranges)
10. Risks that change cost or timeline
11. Recommended path for juskel
12. Sign-off checklist before spending money

</div>

## 1. Executive decision summary

juskel is **not a lender today**. The Financial Profile spec wants **Commercial Credit Data Enrichment** to supplement Open Banking — showing SMEs a consolidated view of borrowing/commitments and enriching Banking Intelligence (BIS) **without** juskel becoming a credit reference agency.

This document answers three practical questions:

| Question | Short answer |
|----------|--------------|
| **Can we afford it?** | Yes on a **lean path** (~£8–15k Year 1) if pulls are consent-gated and volume is controlled. **No** if we treat it like free API data at scale. |
| **Are we allowed to?** | **Maybe** — depends on FCA role, permissible purpose, and whether we access **CCDS reciprocal** data. Legal sign-off required **before** first production pull. |
| **Will it work for average SMEs?** | **Partially** — bureau files are often thin for sole traders and new companies; product must treat gaps as normal. |

<div class="callout success">

**Recommendation:** Pursue **Path B (Creditsafe lean integration)** in parallel with **Path A (no bureau MVP)**. Do **not** commit to **Path C (Experian/Equifax enterprise)** until legal confirms eligibility and a lender/partner funds the cost — or juskel obtains FCA credit broking/CIS authorisation.

</div>

---

## 2. Three implementation paths (with costs)

All figures are **planning estimates** in GBP, excluding VAT. Vendor quotes may differ. Assumes UK Ltd-focused SME onboarding.

### Path A — No bureau (MVP baseline)

**What you get:** Manual financial baseline + QuickBooks metrics + TrueLayer Open Banking + banking/borrowing **self-attestation** (no bureau pull).

| Cost item | Year 1 estimate | Notes |
|-----------|-----------------|-------|
| Credit bureau fees | **£0** | None |
| Legal / compliance review | **£2,000 – £5,000** | One-off: GDPR consent copy, onboarding terms, OB consent |
| External engineering | **£0** (internal) | ~2–3 person-weeks internal |
| TrueLayer (existing) | **£500 – £2,000/yr** | Volume-dependent SaaS — separate from Azure infra |
| **Path A total (Year 1)** | **£2,500 – £7,000** | Excludes internal salary |

| Timeline | Milestone |
|----------|-----------|
| **Weeks 1–4** | Banking metrics entity, multi-bank UX, completeness attestation |
| **Weeks 5–8** | Provenance/confidence flags, align manual baseline to spec |
| **Week 8** | MVP Financial Profile shippable **without bureau** |

**Feasibility:** **High** — no CRA contract, no reciprocity.

---

### Path B — Lean bureau (Creditsafe Connect) — **recommended probe**

**What you get:** SME-consented **UK company credit report** + CCDS finance agreement slice where available; reconciliation UI (corroborated / missing / discrepancy); **no CRA score displayed**.

| Cost item | Year 1 estimate | Notes |
|-----------|-----------------|-------|
| Creditsafe subscription | **£1,200 – £3,500/yr** | Tier depends on report credits bundled |
| Connect API integration fee | **£800 – £1,200/yr** | Third-party integrators cite ~€1,000; confirm with Creditsafe |
| Per-report credits (variable) | **£3 – £12 per pull** | Planning midpoint **~£6/report** |
| Legal / compliance | **£3,000 – £8,000** | Bureau consent step, permissible purpose memo, DPIA update |
| CIGB subscription | **£0 – £2,500/yr** | **TBC with legal** — may apply if accessing shared performance data |
| Engineering (internal) | **4–6 person-weeks** | API client, storage, reconciliation UI contract, e2e |
| Sandbox / test pulls | **£0 – £200** | Creditsafe sandbox free; limited live test credits |
| **Path B fixed (Year 1)** | **£5,000 – £13,200** | Before variable pulls |
| **Variable at volume** | See Section 3 | |

| Timeline | Milestone |
|----------|-----------|
| **Weeks 1–2** | Legal scoping call; Creditsafe sandbox account |
| **Weeks 3–4** | Sandbox spike: company lookup + CCDS endpoint for test Ltd |
| **Weeks 5–8** | Legal sign-off on consent UX + permissible purpose |
| **Weeks 9–12** | Production contract signed; API integrated behind consent gate |
| **Weeks 13–16** | Reconciliation UI + e2e tests; soft launch to % of Ltd SMEs |
| **Month 4** | **Production bureau enrichment live (limited scope)** |

**Feasibility:** **Medium–High** for **Ltd companies**; **Low** for sole traders (thin files).

**Reciprocity risk:** If Creditsafe classifies juskel as a CCDS finance provider receiving reciprocal pool data, **12-month reporting obligation** may apply — legal must confirm **before contract**.

---

### Path C — Enterprise bureau (Experian or Equifax)

**What you get:** Full commercial credit API, optional OB+bureau bundle (Equifax OBaaS / Experian Commercial Acumen), decisioning-grade data, CATO/CCDS depth, BIAM enrichment at scale.

| Cost item | Year 1 estimate | Notes |
|-----------|-----------------|-------|
| Vendor setup / onboarding | **£8,000 – £25,000** | Integration, IP allowlisting, UAT |
| Annual platform / minimum commit | **£15,000 – £45,000/yr** | Enterprise sales; often minimum search commits |
| Per-search / per-account (variable) | **£5 – £25+ per event** | Product-dependent |
| CIGB subscription | **£1,500 – £5,000/yr** | Typical for data subscribers — confirm with CIGB |
| FCA authorisation (if required) | **£1,500 application + £500–£2k/yr** | Credit broking or CIS — **3–6 month** process |
| Legal / compliance programme | **£8,000 – £20,000** | Ongoing advisory, policies, audits |
| Reciprocity reporting build | **8–12 person-weeks** | If CCDS contributor — pipeline + ops |
| **Path C total (Year 1)** | **£40,000 – £80,000+** | Excludes internal salary |

| Timeline | Milestone |
|----------|-----------|
| **Month 1** | Vendor RFP, legal feasibility, FCA strategy decision |
| **Months 2–3** | Contract negotiation, sandbox/ UAT access |
| **Months 4–5** | Integration + reciprocity reporting (if required) |
| **Month 6–9** | Production go-live, monitoring, lender-facing BIS |

**Feasibility:** **Medium** — eligibility uncertain for non-lender platform; **high cost** for MVP-stage juskel.

---

## 3. Year 1 cost model by SME volume

Assumes **Path B (Creditsafe)** with **opt-in bureau step** — not every SME triggers a pull.

| SMEs completing bureau step (Year 1) | Variable report cost (@ £6/pull) | Path B Year 1 total (fixed + variable) |
|--------------------------------------|----------------------------------|----------------------------------------|
| **100** | £600 | **£5,600 – £13,800** |
| **500** | £3,000 | **£8,000 – £16,200** |
| **2,000** | £12,000 | **£17,000 – £25,200** |
| **10,000** | £60,000 | **£65,000 – £73,200** |

<div class="callout warn">

At **10,000+ pulls/year**, per-report pricing dominates. Negotiate **annual credit bundles** or move cost to **lenders post-match** (commercial model), not juskel infra budget.

</div>

**Azure infra (£5–15/mo)** covers hosting only — **bureau fees are a separate budget line**.

---

## 4. Compliance — what applies to juskel

This is not legal advice. Use this as a **briefing for your solicitor/compliance adviser**.

### 4.1 Regulations and schemes

| Framework | Applies when | juskel impact |
|-----------|--------------|---------------|
| **UK GDPR / Data Protection Act 2018** | Any personal or business data processing | Privacy notice, DPIA, consent records, retention |
| **CCDS Regulations 2015** | Accessing government-mandated SME credit sharing pool | Reciprocity within 12 months if juskel is a **finance provider** receiving data |
| **Principles of Reciprocity (CIGB)** | Accessing shared credit **performance** data | Permitted purposes: responsible lending, fraud, debt recovery — not generic analytics |
| **FCA FSMA authorisation** | Credit broking, credit information services, certain introductions | **TBC** — depends whether juskel **facilitates credit decisions** with bureau data |
| **Consumer Credit Act / CRA 1974** | Consumer (director) credit searches | If searching individuals (sole traders, PG) — stricter rules |
| **PSD2 / Open Banking** | Already in scope via TrueLayer | Separate consent from bureau step |

### 4.2 What juskel must **not** do (per spec + regulation)

- Display a bureau **credit score** as if juskel issued it
- Add an 8th BIS dimension that is effectively a CRA score
- Pull bureau data **without** SME consent and documented permissible purpose
- Access CCDS reciprocal pool **without** understanding reciprocity obligations
- Present bureau data as **complete** when coverage is partial (~25% national CCDS consent rate on designated bank accounts)

### 4.3 Permissible purpose — working positions (confirm with legal)

| juskel use case | Likely permissible? | Notes |
|-----------------|---------------------|-------|
| SME views **own** company report summary during onboarding | **Strongest case** | SME-initiated, transparency |
| juskel enriches **internal** BIS without showing raw bureau to lenders | **Plausible** | Still needs purpose documentation |
| juskel shows bureau-derived flags to **lenders** on marketplace | **Higher bar** | Likely CIS or broking authorisation |
| Hard search affecting company credit file | **Avoid for MVP** | Soft/report products preferred |

---

## 5. Compliance action checklist & timeline

| # | Action | Owner | Cost est. | When |
|---|--------|-------|-----------|------|
| 1 | **Compliance scoping workshop** — define juskel's FCA status and bureau use case | Legal + Product | £500 – £1,500 | **Week 1** |
| 2 | **Permissible purpose memo** — document why each data field is pulled | Legal | £1,500 – £3,000 | **Weeks 2–3** |
| 3 | **DPIA update** — bureau data flows, retention, subprocessors | Legal / DPO | £1,000 – £2,500 | **Weeks 3–4** |
| 4 | **SME consent copy** — separate step for commercial credit (not bundled with OB) | Legal + Product | £800 – £2,000 | **Weeks 4–5** |
| 5 | **Terms of service update** — data sharing, third-party CRAs | Legal | £500 – £1,500 | **Weeks 5–6** |
| 6 | **CIGB subscriber assessment** — required? | Legal | £0 – £500 review | **Week 4** |
| 7 | **FCA authorisation decision** — proceed, defer, or partner model | Leadership + Legal | £0 (decision) | **Week 6** |
| 8 | **Vendor contract review** — reciprocity clauses, permitted use, SLAs | Legal | £1,000 – £3,000 | **Before signature** |
| 9 | **Go/no-go gate** — no production API key until 1–8 complete | Engineering | £0 | **Before Week 9** |

**Compliance timeline summary:** Allow **6–8 weeks** from kickoff to **safe production bureau pull**, assuming legal resource is available.

---

## 6. Feasibility — will it work for our SMEs?

### 6.1 Expected hit rate (planning assumptions)

| SME type | Bureau file useful? | Expected enrichment value |
|----------|---------------------|---------------------------|
| **Ltd, 2+ years, B2B credit** | **60–75%** | Facilities, limits, performance flags |
| **Ltd, < 12 months** | **20–35%** | Often thin file |
| **Sole trader / partnership** | **10–25%** | Commercial file weak; consumer leg separate |
| **No prior commercial borrowing** | **5–15%** | "Insufficient coverage" normal |
| **CCDS-enriched slice (all types)** | **~25% of eligible bank accounts nationally** | Government PIR 2024 — consent bottleneck |

### 6.2 Product feasibility rules

1. **Gate bureau step to Ltd + Companies House number** for MVP — reduces wasted pulls.
2. **Charge pulls to opt-in** — "Strengthen my profile with commercial credit data."
3. **Always show coverage status** — corroborated / additional / discrepancy / insufficient.
4. **Never block onboarding** on empty bureau response.
5. **Cache report 90 days** per application to control cost.

**Overall feasibility verdict:** Bureau enrichment is **worth doing on Path B** for funding readiness **if** expectations are set correctly. It is **not feasible** to promise complete borrowing visibility for every average SME.

---

## 7. What we need to do — phased action plan

### Phase 0 — Decide & de-risk (Weeks 1–6)

**Goal:** Know if we can legally pull data and which vendor fits budget.

| Week | Engineering | Product | Legal | Commercial |
|------|-------------|---------|-------|--------------|
| 1 | Read research PDF; spike Creditsafe sandbox signup | Confirm Path A vs B for MVP scope | Scoping call | — |
| 2 | Sandbox: authenticate, lookup test Ltd, log response shape | Draft consent UX wireframe | Permissible purpose draft | Email Creditsafe sales |
| 3 | Map API fields → juskel reconciliation model | Review hit-rate assumptions | DPIA draft | Email Experian + Equifax (optional) |
| 4 | Estimate eng tasks for Path B | Gate rules (Ltd only?) | CIGB assessment | Compare quotes |
| 5 | — | Sign-off Path B budget band (£8–15k Y1) | Consent copy v1 | Creditsafe proposal |
| 6 | **Go/no-go** meeting | | **Legal gate document** | Contract negotiation start |

**Phase 0 cost:** **£2,000 – £6,000** (legal) + internal time.

---

### Phase 1 — Ship MVP without bureau (Weeks 1–8, parallel)

**Goal:** Spec-aligned Financial Profile without waiting for CRA contract.

| Deliverable | Effort |
|-------------|--------|
| `BankingIntegrationMetrics` + stop balance→revenue band hack | 1.5 weeks |
| Multi-bank connection + completeness attestation | 1.5 weeks |
| Manual baseline alignment (8 questions or band map) | 1 week |
| Provenance + confidence on GET responses | 1 week |
| Borrowing completeness attestation (manual, no bureau) | 0.5 week |

**Phase 1 incremental cost:** **£0 bureau** (internal engineering only).

---

### Phase 2 — Creditsafe production (Weeks 7–16)

**Goal:** Consent-gated bureau pull for eligible Ltd SMEs.

| Week | Deliverable |
|------|-------------|
| 7–8 | Production API credentials; `CommercialCreditSnapshot` entity |
| 9–10 | Consent middleware + audit log; pull on opt-in only |
| 11–12 | Reconciliation service (4 outcomes); API GET fields |
| 13–14 | Swagger + `ONBOARDING_FRONTEND_API.md`; e2e script |
| 15–16 | Soft launch; monitor cost per pull; tune gating |

**Phase 2 incremental cost:** **£3,000 – £7,200 fixed** + **£6 × opt-in pulls**.

---

### Phase 3 — Scale or upgrade (Month 6+, optional)

Only if Path B proves value **and** legal confirms Path C eligibility:

- Negotiate Experian Commercial Credit or Equifax EBI/CCDS enterprise tier
- FCA authorisation if introducing to lenders with bureau-enriched BIS
- Reciprocity reporting pipeline if CCDS contributor status triggered
- BIAM dimension weighting from bureau fields in scoring module

**Phase 3 cost:** See Path C — **£40k–£80k+ Year 1**.

---

## 8. Engineering effort & internal cost

Planning rates assume **internal** delivery (no agency). For budgeting internal time at a notional **£500/day** fully loaded:

| Phase | Person-weeks | Notional internal value |
|-------|--------------|-------------------------|
| Phase 0 spike | 1 week | £2,500 |
| Phase 1 (no bureau MVP) | 3 weeks | £7,500 |
| Phase 2 (Creditsafe) | 5 weeks | £12,500 |
| Phase 3 (enterprise) | 10+ weeks | £25,000+ |

**Total internal engineering (Path A + B):** ~**9 person-weeks** over **4 months**.

---

## 9. Vendor cost comparison (realistic ranges)

| Vendor | Setup | Annual fixed | Per pull | Sandbox | Best for juskel |
|--------|-------|--------------|----------|---------|-----------------|
| **Creditsafe Connect** | Low | **£2–4k** | **£3–12** | **Free** | **Path B — MVP probe** |
| **Experian Commercial Credit API** | **£8–25k** | **£15–40k** | **£5–25** | Login-gated | Path C — lender-grade |
| **Experian Commercial Acumen** | High | **£20k+** | Bundled | Sales-led | OB+bureau bundle (replaces TrueLayer?) |
| **Equifax OB Commercial + EBI** | **£5–15k** | **£12–35k** | Bundled | Login-gated | Path C — single vendor OB+bureau |
| **D&B** | **£5–20k** | **£10–30k** | Variable | Sales-led | Alternative CRA |
| **TransUnion (commercial)** | N/A | N/A | N/A | Via reseller | **Not primary** for commercial CCDS |

**All vendor figures are estimates until written quotes are received.**

---

## 10. Risks that change cost or timeline

| Risk | Cost impact | Timeline impact |
|------|-------------|-----------------|
| Legal says FCA authorisation required | **+£5–15k; +3–6 months** | Delays Phase 2 production |
| CCDS reciprocity triggered | **+8–12 eng weeks ongoing ops** | +2–3 months |
| Creditsafe contract minimum above budget | May force defer or Path A only | +4–8 weeks renegotiation |
| Low opt-in rate (<10% SMEs) | Low variable cost but weak ROI | May question Phase 2 value |
| High opt-in without caching | **Variable cost spike** | Need pricing change mid-year |
| Sole traders expected to use bureau | Wasted pulls | Product fix — Ltd gate |

---

## 11. Recommended path for juskel

<div class="callout success">

### Recommended: Path A now + Path B in parallel

| Item | Decision |
|------|----------|
| **Now (Weeks 1–8)** | Ship Financial Profile MVP **without** bureau — TrueLayer + QuickBooks + attestations |
| **Parallel (Weeks 1–6)** | Legal scoping + Creditsafe sandbox — **£2–6k legal** |
| **Month 3–4** | If legal go: Creditsafe production — **£5–13k fixed Year 1** + opt-in pulls |
| **Defer** | Experian/Equifax enterprise until funded or FCA path clear |
| **Budget ask (Year 1)** | **£10,000 – £18,000** all-in for Path A + B (100–500 opt-in SMEs) |
| **Timeline** | **4 months** to bureau live; **2 months** to MVP without bureau |

</div>

### What leadership should approve

1. **£2,000 – £6,000** legal budget for Phase 0 compliance (immediate)
2. **£5,000 – £8,000** Creditsafe fixed costs (after legal go, ~Month 2)
3. **£3,000** variable buffer for Year 1 report pulls (500 SMEs × £6)
4. **9 person-weeks** engineering capacity over 4 months (internal)
5. Explicit **no production bureau pull** rule until legal sign-off document exists

---

## 12. Sign-off checklist before spending money

Before paying any CRA or signing a bureau contract:

- [ ] Written **permissible purpose** opinion from legal
- [ ] Confirmed whether juskel triggers **CCDS reciprocity**
- [ ] Confirmed whether **CIGB subscription** is required
- [ ] Confirmed whether **FCA authorisation** is required for chosen UX
- [ ] SME **consent screen** approved by legal (separate from OB)
- [ ] **DPIA** updated with CRA subprocessor
- [ ] Written **vendor quote** with per-pull pricing and minimum commit
- [ ] Product rule: **Ltd-only gate** (or documented exception)
- [ ] Engineering: **cache + audit log** design approved
- [ ] Budget owner sign-off on **Year 1 £10–18k band**

---

<footer class="doc-footer">

**juskel** — Internal planning document. Version 1.0, 7 September 2026.  
Cost figures are estimates for budgeting only, not vendor quotes or legal advice. Update decision log after Creditsafe / legal engagements.

</footer>
