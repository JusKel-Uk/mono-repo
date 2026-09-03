# Accounting probe — Financial Profile.pdf vs QuickBooks

Maps every **accounting** requirement from `discovery/.../Financial Profile.pdf` to live QuickBooks sandbox API calls.

## Run it

### CLI (full assessment JSON)

```bash
cd api/sandbox/quickbooks
./test.sh accounting-assessment
# or
python3 accounting_probe.py --json > responses/accounting-assessment.live.json
```

### Explorer UI

```bash
cd api/sandbox/quickbooks/ui
./run-ui.sh
# → http://127.0.0.1:8769
# Connect sandbox company, then click:
#   "Accounting profile assessment (PDF)"
```

### Individual reports

```bash
./test.sh profit-and-loss
./test.sh profit-and-loss-prior
./test.sh balance-sheet
./test.sh aged-receivables
./test.sh aged-payables
./test.sh cash-flow
./test.sh accounts
./test.sh all   # everything including assessment
```

## Date range

Set in `secrets.env` (defaults in `secrets.env.example` use **2026** for new sandbox companies):

```env
QUICKBOOKS_REPORT_START_DATE=2026-01-01
QUICKBOOKS_REPORT_END_DATE=2026-12-31
```

If P&L shows `NoReportData`, widen dates to include `CompanyStartDate` from company info.

## Assessment output

Each field in the JSON/UI table includes:

| Property | Meaning |
|----------|---------|
| `label` | PDF accounting field name |
| `pdfTreatment` | CORE / CONDITIONAL / DERIVED |
| `feasibility` | `direct` · `derive` · `partial` · `unavailable` |
| `value` / `displayValue` | Parsed amount or derived result |
| `qbSource` | Which QBO report/endpoint supplied it |
| `status` | `available` · `partial` · `empty` · `unavailable` |
| `notes` | Caveats (e.g. EBITDA derivation, loan classification) |

`derivedRatios[]` shows the six PDF ratios (current ratio, leverage, margin, working capital, revenue growth, profitability movement).

## QBO endpoints used

| Report | Path |
|--------|------|
| Company info | `/companyinfo/{realmId}` |
| P&L (current + prior year) | `/reports/ProfitAndLoss` |
| Balance sheet | `/reports/BalanceSheet` |
| Aged receivables | `/reports/AgedReceivables` |
| Aged payables | `/reports/AgedPayables` |
| Cash flow statement | `/reports/CashFlow` |
| Chart of accounts | `/query` (paginated) |

## Known limitations (review checklist)

| PDF need | QB probe result |
|----------|-----------------|
| EBITDA | `partial` — derived from Net Income + interest/tax/D&A **if** expense lines exist |
| Outstanding debt | `partial` — loan/LOC account types only; trade payables excluded |
| Finance commitments | `unavailable` — no structured future-debt API |
| Trends | `derive` — prior year = current window minus 1 calendar year (simple default) |
| Cash-flow behaviour (3-month direction) | Use **Open Banking** sandbox, not this accounting probe |

## Comprehensive gap analysis PDF

Human-readable report (CORE / DERIVED / manual gaps / API persistence):

```bash
cd api/sandbox/quickbooks
python3 -m venv .venv-pdf && source .venv-pdf/bin/activate
pip install reportlab
python scripts/generate_gap_analysis_pdf.py
```

Output: [`docs/QuickBooks_Financial_Profile_Gap_Analysis.pdf`](docs/QuickBooks_Financial_Profile_Gap_Analysis.pdf)

Regenerate after sandbox assessment runs or product/API changes.

## Files

| File | Role |
|------|------|
| `accounting_probe.py` | Fetches all reports, maps PDF fields, computes ratios |
| `quickbooks_client.py` | Shared HTTP + UI endpoint registry |
| `test.sh` | CLI shortcuts |
| `scripts/generate_gap_analysis_pdf.py` | Builds gap analysis PDF |
| `docs/QuickBooks_Financial_Profile_Gap_Analysis.pdf` | CORE/DERIVED/manual gap report |
| `ui/` | Visual assessment table + raw JSON |

Paste assessment JSON into `responses/accounting-assessment.live.json` after review.
