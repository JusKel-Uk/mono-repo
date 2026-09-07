
<div class="cover">

# Commercial Credit & Banking Intelligence

<p class="subtitle">Tech Lead Research Report — Financial Profile enrichment layer</p>

<dl class="cover-meta">
<dt>Date</dt><dd>7 September 2026</dd>
<dt>Version</dt><dd>1.1</dd>
<dt>Prepared for</dt><dd>juskel product, engineering, and compliance stakeholders</dd>
<dt>Trigger</dt><dd>Financial Profile specification update (September 2026) — Tech Lead Tasks section</dd>
<dt>Status</dt><dd>Desk research complete. Vendor pricing and legal sign-off still required before production integration.</dd>
</dl>

</div>

<div class="toc">

## Contents

1. Why this research exists
2. What changed in the Financial Profile spec
3. What juskel already has today
4. Glossary of terms
5. The business problem in plain English
6. UK regulatory landscape
7. Provider research — Experian
8. Provider research — Equifax
9. Provider research — TransUnion
10. Provider research — Creditsafe
11. Provider research — Dun & Bradstreet
12. Buy vs build — Open Banking overlap
13. What data is realistically available from an average SME
14. Cost, budget, and commercial model
15. juskel eligibility assessment
16. Accounting integration gap analysis
17. Recommended strategy and phased roadmap
18. Vendor engagement pack
19. Risks, mitigations, and open questions
20. Appendices — sources and spec mapping

</div>

## 1. Why this research exists

The September 2026 update to the **Financial Profile** specification adds a major new capability: **Commercial Credit Data Enrichment & Reconciliation** within the **Banking Intelligence** layer. That layer produces the **Banking Intelligence Score (BIS)** and feeds the wider **Sustainable Finance Score (SFS)** and **Funding Readiness Index (FRI)**.

The spec explicitly assigns Tech Lead research:

> *Investigate Experian, Equifax, TransUnion, and potentially other commercial-data providers on coverage, API availability, licensing, permissible use, reciprocity requirements, cost and whether juskel's specific use case is eligible.*

This report answers that brief in full. It is written for humans making product and engineering decisions — not as a checklist of links. Every recommendation is tied back to what juskel is building, what the law allows, and what a typical UK SME can actually supply.

<div class="callout">

**Bottom line up front:** Commercial credit enrichment is **valuable but not MVP-blocking**. juskel can ship a strong Financial Profile using manual baseline questions, accounting integrations (QuickBooks), and Open Banking (TrueLayer) while vendor and legal work proceeds in parallel. Full bureau integration is **expensive, regulated, and may require reciprocity** if juskel accesses government-mandated CCDS data as a finance provider.

</div>

---

## 2. What changed in the Financial Profile spec

The original Financial Profile document (September 2026, earlier version) defined:

- Minimum **8-question** manual baseline for SMEs without integrations
- **Accounting dataset** baseline (performance, position, ratios derived by juskel)
- **Open Banking dataset** baseline (liquidity, cash flow, behavioural signals)
- **Four-layer internal architecture:** raw data → standardised metrics → derived intelligence → juskel outputs
- Design principle: **collect facts, derive intelligence**

The **updated** document adds an entire second half focused on **Banking Intelligence architecture**:

| New concept | What it means |
|-------------|---------------|
| **Banking Intelligence** | Combines Open Banking + commercial credit + reconciliation |
| **Commercial Credit Enrichment** | Bureau data (facilities, commitments, payment performance) supplements OB |
| **Reconciliation layer** | Compare OB vs bureau; outcomes: corroborated, additional info, discrepancy, insufficient coverage |
| **Multi-bank UX** | Connect bank → auth → select accounts → connect another bank → completeness attestation |
| **Two completeness attestations** | (A) all relevant bank accounts connected; (B) all borrowing/credit commitments represented |
| **15-step Banking Intelligence journey** | End-to-end flow from intro through BIS calculation |
| **FIAM canonical accounting model** | Five groups of accounting fields with provenance metadata |
| **Explicit FIS vs BIS boundary** | Accounting cash flow → FIS; observed banking behaviour → BIS |
| **No 8th "credit score" BIS dimension** | Bureau data enriches existing BIAM dimensions, juskel must not look like a CRA |

The Reference Note in the spec points to **Experian Commercial Acumen**, **Equifax commercial Open Banking**, and **Experian Commercial CAIS / CCDS** as real-world comparators.

---

## 3. What juskel already has today

Before adding commercial credit, understand the existing foundation in the `api/` codebase:

### 3.1 Manual financial profile (Layer 1)

- Entity: `FinancialProfile` with five band fields (annual revenue, EBITDA, debt, cash reserves, avg monthly revenue)
- API: `GET/PUT /funding/applications/current/financial-profile`
- Step completion: all five bands filled **or** integration connected with `bandsLockedByIntegration`

**Gap vs spec:** The spec's 8-question baseline includes profit/loss amount, yes/no borrowing, 3-month cash-flow direction, and financial year end — not all modelled in the API yet.

### 3.2 Accounting integration (Layer 2 — FIS path)

- **QuickBooks OAuth** syncs into `FinancialIntegrationMetrics` (revenue, P&L lines, balance sheet, derived ratios, YoY trends)
- Exposed on GET as read-only `integrationMetrics`
- Sandbox documented in `api/sandbox/quickbooks/SPEC-MAP.md`
- Known gap: P&L can return `NoReportData: true` when report dates don't match company start date

### 3.3 Open Banking (partial BIS path)

- **TrueLayer OAuth** connects; callback applies `ApplyOpenBankingBands()` — maps account balances into revenue/debt bands
- **Limitation:** No separate `BankingIntegrationMetrics` store; no transactional/cashflow analytics yet
- Multi-bank constraints documented: `api/sandbox/truelayer/docs/Open_Banking_Consent_And_Multi_Bank_Limits.pdf`
- One `IntegrationConnection` row per provider (reconnect overwrites; not true multi-bank)

### 3.4 Evidence upload

- Financial evidence files on GET `evidence[]`
- Supports manual attestation with uploaded accounts

### 3.5 Not built yet

- Commercial credit / bureau integration
- Reconciliation engine
- BIS / FIS / SFS scoring in `scoring` module
- Per-field provenance and confidence metadata
- Multi-bank connection model

---

## 4. Glossary of terms

| Term | Plain English |
|------|---------------|
| **CRA** | Credit Reference Agency — holds and shares credit information (Experian, Equifax, etc.) |
| **CCDS** | Commercial Credit Data Sharing — UK government scheme forcing major banks to share SME credit data (with consent) via four designated CRAs |
| **Designated CRA** | One of four Treasury-approved CRAs for CCDS: **Experian, Equifax, Creditsafe, Dun & Bradstreet** |
| **CATO** | Current Account Turnover — summary of credits/debits through business current accounts (from credit sharing) |
| **Commercial CAIS** | Experian's large database of commercial credit accounts (~18M accounts cited in spec) |
| **PoR** | Principles of Reciprocity — industry rules: you share data to access shared data |
| **CIGB** | Credit Industry Governing Body — administers PoR; subscribers need direct contract |
| **Reciprocity (CCDS)** | Non-bank finance providers accessing CCDS must share their own SME lending data within 12 months |
| **FIS / BIS / EIS / SFS / FRI** | juskel intelligence scores: Financial, Banking, Environmental (ESG), combined Sustainable Finance, Funding Readiness |
| **FIAM / BIAM** | Methodologies behind FIS and BIS dimension scoring |
| **OBaaS** | Open Banking as a Service — hosted consent journey (Equifax product pattern) |
| **ASPSP** | Account Servicing Payment Service Provider — the bank the SME authorises |
| **Permissible purpose** | Legal reason you are allowed to pull credit data (lending, fraud, etc.) |

---

## 5. The business problem in plain English

### 5.1 Why Open Banking alone is not enough

When an SME connects a business bank account, juskel sees **transactions, balances, and cash behaviour**. That is excellent for liquidity and cash-flow stability (BIS dimensions).

It does **not** reliably reveal:

- Term loans held at another bank
- Asset finance or lease commitments
- Trade credit facilities with limits not visible in current account flows
- Historical payment performance on commercial credit facilities
- Adverse indicators (arrears, defaults) on bureau files

The spec's reconciliation layer exists because **banking data and credit bureau data can disagree** — and juskel's value is surfacing that honestly to the SME and to downstream funding readiness.

### 5.2 What juskel must not become

The spec is explicit:

- Commercial credit **does not** feed FIS (accounting intelligence)
- It **does not** create a fourth intelligence domain
- juskel **must not** add an eighth BIS dimension that looks like a "credit score" from a CRA
- Bureau information **enriches** existing BIAM dimensions (payment behaviour, cash runway, banking resilience)

### 5.3 What success looks like

For an SME going through onboarding:

1. They complete the **short manual baseline** (or connect integrations)
2. They connect **one or more banks** via TrueLayer (multi-bank flow)
3. They confirm **banking completeness** ("have you connected all relevant accounts?")
4. *(Future phase)* juskel retrieves **permitted commercial credit data** with SME consent
5. juskel shows a **consolidated commitments view** with clear flags where data is missing or inconsistent
6. SME confirms **borrowing completeness**
7. juskel calculates **BIS with confidence** reflecting coverage — not pretending completeness

---

## 6. UK regulatory landscape

This section explains the rules that determine whether juskel **can** integrate bureau data — and at what cost.

### 6.1 Commercial Credit Data Sharing (CCDS)

**Legal basis:** Small and Medium Sized Business (Credit Information) Regulations 2015.

**Who shares data:**

- **9 designated banks** (major UK banks with large SME market share) must share in-scope SME credit information with designated CRAs — **when the SME consents**

**Who holds and redistributes:**

- **4 designated CRAs:** Experian, Equifax, Creditsafe, Dun & Bradstreet

**Which businesses are in scope:**

- SMEs with turnover up to **£25 million** (covers over 99% of UK businesses)

**What data includes:**

- Summary **business current account** information (balances, credit/debit turnover)
- **Performance** on business loans and corporate credit cards
- Not a full raw bank statement — regulated summary and performance fields

**Who can receive it:**

- Other **finance providers** (lenders, etc.) via a designated CRA, when:
  - The finance provider requests it
  - The **SME consents**
  - The provider agrees to CRA standard terms
  - Non-bank providers agree to **reciprocal sharing within 12 months** of first receiving data

**Critical coverage reality (Government Post-Implementation Review, 2024):**

- Only around **25%** of eligible business current accounts at designated banks are in the CCDS database
- **SME consent** is the main bottleneck — many businesses never opt in
- Growth of **non-designated banks** (challengers, specialists) means a growing share of lending sits outside mandatory bank reporting

**Implication:** Even with perfect integration, bureau enrichment will often return **thin or empty** files. Product must handle "insufficient coverage" as normal.

### 6.2 Reciprocity — what it means for juskel

If juskel accesses CCDS as a **finance provider**, it likely must:

1. Within **12 months** of first receiving CCDS data, begin sharing equivalent in-scope SME credit data it holds
2. Only share data for SMEs who have **consented** in juskel's terms
3. Choose **one or more** designated CRAs to reciprocate with (non-banks are not required to share with all four)

**Problem for juskel today:** juskel is a **funding readiness platform**, not a lender. It may not hold lending performance data to reciprocate. That makes full CCDS membership **legally and operationally awkward** unless juskel becomes FCA-authorised and originates or brokers credit.

### 6.3 Principles of Reciprocity (PoR) and CIGB

Separate from CCDS, the wider **shared credit performance** ecosystem (including Experian CAIS and consumer files) is governed by **PoR** via **CIGB**.

Permitted uses of shared credit data centre on:

- Preventing over-commitment and bad debt
- Fraud and money laundering prevention
- Debt recovery and tracing
- **Responsible lending**

Uses **outside** these purposes (e.g. generic SME dashboards, marketing analytics) require **CIGB review and ratification**.

Entities accessing shared data should hold a **direct CIGB subscriber agreement**, even when pulling data through a CRA.

### 6.4 FCA considerations

Depending on how juskel uses bureau data, potential FCA roles include:

| Activity | Possible FCA relevance |
|----------|------------------------|
| Showing SMEs their own aggregated financial picture | Lower risk if SME-initiated and no credit decision |
| Enriching scores shown to **lenders** on juskel's platform | May trigger **credit information services** or **credit broking** rules |
| Hard/soft credit searches on companies or directors | Permissible purpose and consent rules apply |
| Passing bureau scores that look like lending decisions | High regulatory risk — spec explicitly avoids this |

**Action required:** Legal review before any production credit pull. This report does not constitute legal advice.

### 6.5 SME consent and lawful basis

Every bureau and CCDS access requires **clear SME consent** aligned with UK GDPR and credit industry rules. The spec's enrichment step (step 8 in the 15-step journey) must include:

- Plain-language explanation of what data is retrieved and why
- Provider-specific notices where required
- Separate consent from Open Banking consent (different lawful basis and scope)

---

## 7. Provider research — Experian UK

### 7.1 Overview

Experian is the **most cited vendor in the Financial Profile spec** (Commercial Acumen, Commercial CAIS, Commercial Credit API). It is a **designated CCDS CRA** and dominates UK commercial credit reporting.

Experian publicly states its commercial data supported **at least two-thirds of UK SME borrowing in 2024**. In January 2026, Experian announced full commercial credit data (including Commercial CAIS, risk scores, CATO) available through its **Ascend** analytics platform — aimed at lenders, not self-serve startups.

### 7.2 Product catalogue relevant to juskel

| Product | What it delivers | API? | juskel relevance |
|---------|------------------|------|------------------|
| **Commercial Credit API** | Real-time business and director credit information, risk scores | Yes — REST via developer.experian.com | Core bureau pull if eligible |
| **CATO API** | 12-month current account turnover from mandatory credit sharing | Yes | Cash-flow corroboration vs OB |
| **Commercial Acumen** | OB transactions + management accounts + Experian credit in one view | Yes — Open Data Platform REST | **Duplicates TrueLayer** unless juskel replaces OB stack |
| **Business Decisioning APIs** | PowerCurve / Decisioning Plus / Premier — automated credit decisions | Yes — docs behind login | Overkill for MVP; lender-grade |
| **Ascend platform** | Cloud analytics + 6+ years commercial data + sandbox | Platform, not simple REST | Enterprise pricing; lender-focused |

### 7.3 Coverage

- **8 million+ UK businesses** in commercial credit database (2026 Ascend announcement)
- Strongest for **Ltd companies** with trade credit or bank lending history
- Weaker for **sole traders** and **very new businesses** (< 12 months)
- CCDS subset subject to **~25% consent rate** on designated bank accounts nationally

### 7.4 Licensing and access

- **No self-serve public pricing** — enterprise sales process
- Typically requires: commercial contract, permissible purpose documentation, technical onboarding (IP allowlisting, certificates)
- Decisioning products may require **lender status** or equivalent
- Developer portal lists products; full API docs often **behind authenticated login**

### 7.5 Reciprocity

- Full **CCDS reciprocal obligations** apply if juskel accesses CCDS pool as finance provider
- **Commercial CAIS** participation has separate SCoR/PoR membership rules for contributors

### 7.6 Cost (estimated — not quoted)

Public sources and industry norms suggest:

- **Setup / integration:** often £5k–£50k+ for enterprise CRA integrations (varies widely)
- **Per-search / per-report:** £3–£30+ per commercial credit search depending on product tier
- **Minimum commits:** common for bureau contracts — may be incompatible with juskel MVP volume

**Not compatible with £5–15/mo all-in Azure infra budget** unless pulls are rare and cached.

### 7.7 juskel fit assessment

| Strength | Weakness |
|----------|----------|
| Best match to spec Reference Note | Enterprise sales cycle; unclear non-lender eligibility |
| Richest commercial API catalogue | Commercial Acumen overlaps TrueLayer investment |
| CCDS + CAIS designated CRA | Reciprocity likely if accessing CCDS as finance provider |

**Verdict:** **Primary vendor conversation #1.** Ask explicitly about non-lending funding-readiness use case and structured commitment fields without displaying CRA scores.

---

## 8. Provider research — Equifax UK

### 8.1 Overview

Equifax is a **designated CCDS CRA** and offers the spec's other named comparator: **Open Banking Commercial Insights** combined with **Equifax Business Insights (EBI)** and CCDS through a single channel.

Equifax acquired AccountScore (open banking analytics) and positions strongly on **OB + bureau in one journey**.

### 8.2 Product catalogue relevant to juskel

| Product | What it delivers | juskel relevance |
|---------|------------------|------------------|
| **Open Banking Commercial Insights** | Business transaction data + categorisation + liquidity/cash-flow insights | Core BIS data — may **replace TrueLayer** |
| **OBaaS (Open Banking as a Service)** | Hosted consent portal; "portal in under 7 days" (2022 brochure) | Fast time-to-market; less custom OB UX |
| **Equifax Business Insights (EBI)** | Commercial bureau file on UK companies | Credit commitments, trade data |
| **CCDS via same API/dashboard** | Commercial finance agreement data | Spec reconciliation layer input |
| **Business Health Characteristics** | Derived metrics from transaction categorisation | Maps to BIAM dimensions |
| **Forecasting API** | Forward-looking cash views from historic OB | Cash runway enrichment |

Developer flow (from public docs): **Business Lookup → Check Progress → All Data endpoint** (categorised transactions, recurrence, events). Full API reference requires **developer login**.

### 8.3 Coverage

- Strong **Ltd company** bureau coverage via EBI
- OB coverage: any UK bank the SME can authorise through Equifax's AIS journey
- CCDS subject to same national consent limitations as Experian

### 8.4 Buy vs build tension

Equifax explicitly markets **turnkey OB + bureau** to avoid "large development investment." juskel has already integrated **TrueLayer**. Options:

1. **Keep TrueLayer + add Equifax EBI/CCDS only** (hybrid — preferred if Equifax allows)
2. **Replace TrueLayer with Equifax OB Commercial Insights** (single vendor, higher lock-in)
3. **Defer bureau; keep TrueLayer for MVP** (lowest near-term risk)

### 8.5 Cost (estimated — not quoted)

- OBaaS positioned as faster/cheaper than building OB yourself — but still **enterprise contract**
- Combined OB + bureau likely **£thousands+/year** minimum

### 8.6 juskel fit assessment

**Verdict:** **Primary vendor conversation #2.** Best if juskel wants one partner for spec's full "Banking Intelligence journey." Confirm whether TrueLayer can coexist.

---

## 9. Provider research — TransUnion UK

### 9.1 Overview

TransUnion is a major **consumer** credit bureau in the UK (**Call Report** is the standard consumer credit search product). It is **not** one of the four **Treasury-designated CCDS CRAs**.

### 9.2 Commercial SME relevance

- **Not a primary path** for commercial CCDS enrichment described in the spec
- Appears in **D&B Unified Risk View** as the **consumer leg** (director/owner personal credit) blended with D&B commercial + CCDS
- API access to Call Report typically via **aggregators** (e.g. Credit Canary) requiring **SHARE membership** for data contribution

### 9.3 When TransUnion still matters for juskel

| Scenario | TU role |
|----------|---------|
| Sole trader with thin commercial file | Consumer credit on individual may add signal |
| Personal guarantee on business lending | Director consumer file relevant |
| Fraud / identity on company principals | KYC crossover |

### 9.4 juskel fit assessment

**Verdict:** **Deprioritise for commercial credit enrichment.** Revisit for director-consumer checks only when legal and product require it — likely via lender or partner stack, not as primary CCDS source.

---

## 10. Provider research — Creditsafe

### 10.1 Overview

Creditsafe is a **designated CCDS CRA** and offers one of the most **developer-accessible** commercial data APIs in this research.

### 10.2 Product catalogue

| Product | Detail |
|---------|--------|
| **Creditsafe Connect API** | REST API with JWT auth; global company data |
| **UK company credit reports** | Scores, limits, financials, directors |
| **CCDS endpoint** | Documented path: `/v1/localSolutions/GB/CCDS/{companyId}` for commercial finance agreement data |
| **Sandbox** | Free sandbox for development and integration testing |

### 10.3 Coverage

- Broad **company registry** coverage globally; UK reports widely used for B2B credit checks
- CCDS data embedded where SME has consented into scheme
- Good for **Ltd companies**; variable for micro-entities and new cos

### 10.4 Cost

- Subscription packages on website (per-report credits model)
- Third-party integrators cite **~€1,000/year** API integration fee **plus** Creditsafe subscription — not official Creditsafe pricing
- **Lower entry point** than Experian Decisioning or Equifax OBaaS enterprise deals

### 10.5 Reciprocity

Same CCDS reciprocal rules if juskel accesses CCDS pool as a finance provider.

### 10.6 juskel fit assessment

**Verdict:** **Best MVP spike candidate.** Sandbox available today; sufficient for Phase 2 "show commitments list" UI without full BIS engine. Not a replacement for Experian/Equifax depth if juskel scales to lender-grade decisioning.

---

## 11. Provider research — Dun & Bradstreet UK

### 11.1 Overview

D&B is the fourth **designated CCDS CRA**. Strong in **trade credit** and **payment performance** data globally.

### 11.2 Relevant products

| Product | Detail |
|---------|--------|
| **D&B Business Data** | Company profiles, PAYDEX, trade payments, legal events |
| **Unified Risk View** | Blends D&B commercial + CCDS + **TransUnion consumer** for small-business decisioning |
| **CCDS** | Designated CRA — same scheme rules |

### 11.3 API access

Enterprise integration — contact sales. Less public developer self-serve than Creditsafe.

### 11.4 juskel fit assessment

**Verdict:** **Alternative CRA** if Experian/Equifax pricing or eligibility fails. Less Open-Banking-native than Equifax/Experian Acumen. Consider if trade-credit-heavy SME segment is juskel's primary market.

---

## 12. Buy vs build — Open Banking overlap

The spec assumes:

```
Open Banking (primary) + Commercial Credit (enrichment) → Reconciliation → BIS
```

juskel's current architecture:

```
TrueLayer OB → bands (today)     QuickBooks → FinancialIntegrationMetrics → FIS path
```

### 12.1 Three strategic options

**Option A — Keep TrueLayer, add bureau separately (recommended for MVP)**

- Pros: Preserves existing integration and sandbox work; clear FIS/BIS separation
- Cons: juskel builds categorisation, reconciliation, and BIAM logic itself
- Bureau vendor: Creditsafe (Phase 2) or Experian/Equifax (Phase 3)

**Option B — Replace TrueLayer with Equifax/Experian OB bundle**

- Pros: Faster to spec's 15-step journey; categorisation included
- Cons: Rip-out cost; vendor lock-in; duplicate OB consent if bureau pull fails
- Best if: legal confirms single-vendor contract and pricing acceptable

**Option C — Defer all bureau; ship OB + accounting + attestation**

- Pros: Zero bureau cost and regulatory exposure now
- Cons: Spec's enrichment stage not implemented; weaker BIS confidence
- Best if: MVP deadline dominates

### 12.2 Multi-bank (already researched in juskel repo)

TrueLayer/PSD2 constraints (documented internally):

- No single OAuth for all banks
- One consent journey **per bank (ASPSP)**
- SME selects accounts at each bank
- 90-day reconfirmation for ongoing access
- juskel can require attestation but cannot verify completeness

This aligns with spec steps 6–7. **No additional vendor research needed** for multi-bank UX — engineering implementation required.

---

## 13. What data is realistically available from an average SME

This section connects bureau research to onboarding reality. "Average SME" = micro to small Ltd or sole trader, £50k–£2m turnover, mixed digital maturity.

### 13.1 Expected coverage tiers in production

| SME profile | Share of cohort (planning estimate) | Bureau enrichment yield |
|-------------|-------------------------------------|-------------------------|
| Manual baseline only | 40–55% | None — self-declared only |
| Open Banking only | 10–15% | None — unless bureau pulled separately |
| Accounting connected | 15–25% | None from bureau — FIS path only |
| OB + accounting | 10–20% | Optional bureau adds commitments not in OB |
| Full stack + bureau consent | 5–15% | Richest; still often incomplete |

### 13.2 By data category

| Data need | Manual | Accounting (QB/Xero) | Open Banking | Commercial credit |
|-----------|--------|------------------------|--------------|-------------------|
| Turnover / revenue | Medium quality | Good if P&L dated correctly | Poor proxy from credits | CCDS turnover where consented |
| Profitability | Medium | Good | Not reliable | Not primary |
| Cash position | Medium | Good (cash accounts) | Excellent (connected accounts) | Not primary |
| Borrowing commitments | Low | Partial (loan accounts) | Partial (repayment patterns) | **Best source** where file exists |
| Payment performance | N/A | N/A | Good (failed payments) | **Strong** on CCDS facilities |
| Director adverse credit | N/A | N/A | N/A | Via consumer leg (TU/D&B blends) |

### 13.3 Product design rule

**Never assume bureau completeness.** Default UI state for many SMEs: *"We could not find additional commercial credit records for this business. You can confirm your borrowing manually."*

---

## 14. Cost, budget, and commercial model

### 14.1 juskel MVP infrastructure budget

Target: **£5–15/month** Azure Container Apps + Basic SQL. Bureau data does not fit this budget at per-onboarding pull volume.

### 14.2 Cost components

| Component | Typical model | MVP impact |
|-----------|---------------|------------|
| Experian / Equifax enterprise | Annual fee + per-search | High — sales-led |
| Creditsafe Connect | Subscription + credits + possible API fee | Medium — lowest entry |
| CIGB subscription | Annual subscriber fee | Compliance overhead |
| Reciprocity engineering | Build data reporting pipeline | High hidden cost if CCDS |
| TrueLayer (existing) | Per-connection SaaS | Already planned |
| Legal / compliance review | One-off + ongoing | Required before production |

### 14.3 Cost control strategies

1. **Pull bureau only on explicit SME action** ("Strengthen my profile") — not every signup
2. **Cache results** for 30–90 days per application
3. **Ltd-company gate** — skip bureau call for sole traders until product justifies cost
4. **Pass cost to lender** post-match rather than at onboarding (commercial model decision)
5. **Creditsafe sandbox** for dev/test; production pulls only after contract

---

## 15. juskel eligibility assessment

| Question | Assessment |
|----------|------------|
| Is juskel a finance provider under CCDS today? | **No** — funding readiness platform |
| Can juskel access CCDS without reciprocity? | **Unlikely** for full scheme data |
| Can juskel use commercial **company reports** with consent? | **Possibly** — via Creditsafe/CRA business information products; legal confirmation required |
| Must juskel be FCA authorised? | **Depends on use** — credit broking / CIS if facilitating lender decisions with bureau data |
| Can juskel meet spec without bureau? | **Yes for MVP** — OB + accounting + attestations |
| Must juskel become a CRA? | **No** — spec explicitly forbids looking like one |

### 15.1 Working hypothesis (pending legal sign-off)

**Near-term eligible path:** SME-initiated **commercial company report** (summary commitments, no CRA score displayed) via Creditsafe or similar — **not** full CCDS reciprocal membership.

**Long-term path:** If juskel becomes FCA-authorised credit broker/introducer with lending partners, Experian or Equifax enterprise contract with reciprocity plan.

---

## 16. Accounting integration gap analysis

Spec question: *How do we get missing data when QuickBooks/Xero doesn't expose everything?*

### 16.1 Data acquisition hierarchy (from spec)

1. **Direct connected accounting data** (QuickBooks, Xero, Sage, FreeAgent)
2. **Derived from connected data** (margins, working capital, EBITDA)
3. **Existing juskel company/profile data** (employees, sector)
4. **Financial document evidence** (AI extract → SME confirm)
5. **SME structured input** (self-declared, lower confidence)

### 16.2 QuickBooks — juskel status

| Canonical field | QB source | juskel status |
|-----------------|-----------|---------------|
| Revenue, net income | P&L report | Live in `FinancialIntegrationMetrics` |
| Cash, AR, AP | Accounts / balance sheet | Live |
| Working capital, ratios | Derived | Live |
| Operating cash flow | Cash flow report | Partial — often missing |
| EBITDA | Derived from P&L lines | Conditional |
| Prior period / YoY | Second P&L window | Live when data exists |
| Provenance metadata | N/A | **Not built** |

**Known issue:** Wrong report date window → `NoReportData: true` → bands fall back to account balances only.

### 16.3 Xero — juskel status

- OAuth stub exists in API
- **No metrics mapper** equivalent to QuickBooks
- **Next engineering task:** `api/sandbox/xero/SPEC-MAP.md` probe

### 16.4 Mapping principle (from spec)

Build canonical fields (`net_profit_loss`, `operating_cash_flow`) — **not** provider-specific names (`QuickBooks.PnL.NetIncome`). juskel already follows this in `FinancialIntegrationMetrics`.

---

## 17. Recommended strategy and phased roadmap

<div class="callout success">

**Recommended MVP strategy:** Ship Financial Profile without bureau integration. Parallel-track vendor discovery and legal review. Add lightweight Creditsafe enrichment in Phase 2 only if eligibility and cost confirm.

</div>

### Phase 0 — Compliance and vendor discovery (weeks 1–6)

- [ ] Legal: FCA status, permissible purpose, consent copy for bureau step
- [ ] Sales: Experian + Equifax introductory calls (script in Section 18)
- [ ] Engineering: Creditsafe Connect sandbox spike
- [ ] Decision record: TrueLayer-only vs Equifax OB bundle

### Phase 1 — MVP without bureau (ship now)

- [ ] Align manual baseline with spec (8 questions or band mapping)
- [ ] QuickBooks metrics (done) + provenance flags
- [ ] TrueLayer → new `BankingIntegrationMetrics` (replace balance→band hack)
- [ ] Multi-bank connection model + banking completeness attestation
- [ ] Coverage/confidence on all GET responses

### Phase 2 — Lightweight commercial enrichment

- [ ] Creditsafe company report + CCDS slice for Ltd SMEs (consent-gated)
- [ ] Reconciliation UI: corroborated / additional / discrepancy / insufficient
- [ ] Borrowing completeness attestation (spec step 12)
- [ ] No CRA score displayed; no 8th BIS dimension

### Phase 3 — Full Banking Intelligence

- [ ] Experian or Equifax enterprise contract (if eligible + funded)
- [ ] BIAM dimension enrichment from bureau + OB
- [ ] BIS calculation in scoring module
- [ ] SFS / FRI integration with EIS + FIS

---

## 18. Vendor engagement pack

### 18.1 Intro call script

> juskel is a UK SME **funding readiness** platform. We are **not a lender**. During onboarding we connect **Open Banking (TrueLayer)** and **accounting software (QuickBooks/Xero)**. We want to supplement connected banking with **permitted commercial credit information** so SMEs see a consolidated view of borrowing and commitments, and we enrich our **Banking Intelligence** scoring — **without** displaying a bureau credit score or operating as a CRA.

**Questions to ask every vendor:**

1. Which product fits a **non-lending platform** with **SME-initiated consent**?
2. What **FCA authorisation** and **CIGB/PoR** obligations apply to juskel?
3. Is **CCDS reciprocal reporting** required for our use case?
4. Provide pricing at **500 / 5,000 / 50,000** SME lookups per year.
5. Can we receive **structured commitment fields** without raw CRA scores?
6. Can we keep **TrueLayer for Open Banking** and use your product for bureau data only?
7. What is **sandbox access** timeline and production onboarding duration?
8. What **sole trader / new company** coverage should we expect?

### 18.2 Experian-specific questions

- Commercial Credit API vs Commercial Acumen vs Ascend — which for juskel?
- Can Acumen replace TrueLayer or must we dual-integrate?
- CATO API standalone availability and cost?

### 18.3 Equifax-specific questions

- OBaaS vs API-only with existing TrueLayer?
- Business Health Characteristics field schema for BIAM mapping?
- CCDS + EBI + OB single contract pricing?

### 18.4 Creditsafe-specific questions

- CCDS endpoint coverage rates for micro-SMEs?
- Reciprocity trigger for Connect API CCDS calls?
- Production pricing vs sandbox limits?

### 18.5 Decision log (update after calls)

| Date | Vendor | Contact | Product discussed | Eligible? | Est. annual cost | Notes |
|------|--------|---------|-------------------|-----------|------------------|-------|
| | Experian | | | | | |
| | Equifax | | | | | |
| | Creditsafe | | | | | |
| | Legal counsel | | | | | |

---

## 19. Risks, mitigations, and open questions

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| juskel not eligible for CCDS without reciprocity | High | Blocks full spec enrichment | Phase 2 Creditsafe reports; legal path for CIS/broker role |
| Bureau cost exceeds revenue | High | Budget failure | Consent-gated pulls; cache; lender-funded model |
| Thin bureau files for average SME | High | Weak BIS confidence | "Insufficient coverage" as normal; manual attestation |
| SME refuses bureau consent | Medium | Gap in commitments view | Borrowing completeness step + manual add |
| TrueLayer + Equifax OB duplication | Medium | Wasted engineering | Decide single OB vendor in Phase 0 |
| Regulatory action for impermissible purpose | Low | Severe | No production pulls until legal sign-off |
| Reciprocity obligation if juskel pivots to lending | Medium | Long-term ops burden | Architecture isolates bureau module |

### Open questions for product owner

1. Is bureau enrichment **required for MVP launch** or Phase 2?
2. Will juskel pursue **FCA credit broking** authorisation in 2026–2027?
3. Who pays for bureau pulls — juskel, SME, or lender?
4. Should sole traders be **excluded** from bureau step initially?

---

## Appendix A — Sources and references

| Source | URL |
|--------|-----|
| Experian Commercial Credit API | https://developer.experian.com/products/uk/commercial-credit |
| Experian Business Decisioning | https://developer.experian.com/products/uk/business-decisioning |
| Experian Ascend expansion (Jan 2026) | https://news.europawire.eu/experian-expands-ascend-platform-with-full-access-to-uk-commercial-credit-data/eu-press-release/2026/01/05/11/31/50/167249/ |
| Equifax OB Commercial Insights | https://www.equifax.co.uk/business/product/open-banking-commercial-insights/ |
| Equifax OB Insights developer | https://developer.equifax.co.uk/open-banking-insights |
| Creditsafe Connect API | https://www.creditsafe.com/gb/en/enterprise/integrations/company-data-api.html |
| Creditsafe API catalog | https://doc.creditsafe.com/connect-catalog |
| GOV.UK CCDS consultation | https://www.gov.uk/government/consultations/commercial-credit-data-sharing-and-bank-referral-scheme-consultation-and-call-for-evidence/commercial-credit-data-sharing-consultation-and-call-for-evidence |
| CCDS Post-Implementation Review 2024 | https://assets.publishing.service.gov.uk/media/672113d93ce5634f5f6ef442/CCDS_Post-Implementation_Review_2024.pdf |
| CIGB FAQs | https://www.cigb.co.uk/resources/help-advice-faqs/ |
| Principles of Reciprocity (PDF) | https://www.cigb.co.uk/wp-content/uploads/2026/03/PoRs-Jan-26.pdf |
| D&B Unified Risk View | https://dev-cs.dnb.co.uk/products/dnb-unified-risk-view.html |
| juskel TrueLayer multi-bank limits | `api/sandbox/truelayer/docs/Open_Banking_Consent_And_Multi_Bank_Limits.pdf` |
| juskel QuickBooks SPEC-MAP | `api/sandbox/quickbooks/SPEC-MAP.md` |
| juskel Financial Profile spec (updated) | `discovery/requirements/financial-profile/Financial Profile (updated 2026-09-07).pdf` |

---

## Appendix B — Mapping research questions to this report

| Spec Tech Lead question | Report section |
|-------------------------|----------------|
| Coverage | Sections 7–11, 13 |
| API availability | Sections 7–11, 16 |
| Licensing | Sections 6, 7–11 |
| Permissible use | Sections 6.4, 6.5, 15 |
| Reciprocity requirements | Sections 6.2, 6.3 |
| Cost | Section 14 |
| juskel use case eligibility | Sections 15, 17 |
| Reference Note (Experian Acumen, Equifax OB, CAIS) | Sections 7, 8 |
| Accounting "missing data" question | Section 16 |

---

<footer class="doc-footer">

**juskel** — Internal document. Version 1.1, 7 September 2026.  
Desk research from public sources and juskel codebase analysis. Not legal advice. Vendor pricing requires direct quotes.

</footer>
