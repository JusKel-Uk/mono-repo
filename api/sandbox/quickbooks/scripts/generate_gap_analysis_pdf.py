#!/usr/bin/env python3
"""Generate QuickBooks vs Financial Profile.pdf gap analysis PDF."""

from __future__ import annotations

import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "QuickBooks_Financial_Profile_Gap_Analysis.pdf"


def build_pdf() -> None:
    try:
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_LEFT
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib.units import cm
        from reportlab.platypus import (
            PageBreak,
            Paragraph,
            SimpleDocTemplate,
            Spacer,
            Table,
            TableStyle,
        )
    except ImportError as exc:
        print("reportlab required: python3 -m venv .venv && source .venv/bin/activate && pip install reportlab", file=sys.stderr)
        raise SystemExit(1) from exc

    OUT.parent.mkdir(parents=True, exist_ok=True)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("DocTitle", parent=styles["Title"], fontSize=20, spaceAfter=14, textColor=colors.HexColor("#1e3a5f"))
    h1 = ParagraphStyle("H1", parent=styles["Heading1"], fontSize=14, spaceBefore=16, spaceAfter=8, textColor=colors.HexColor("#1e3a5f"))
    h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontSize=11, spaceBefore=10, spaceAfter=6, textColor=colors.HexColor("#334155"))
    body = ParagraphStyle("Body", parent=styles["Normal"], fontSize=9, leading=13, alignment=TA_LEFT)
    small = ParagraphStyle("Small", parent=styles["Normal"], fontSize=8, leading=11, textColor=colors.HexColor("#475569"))
    cell = ParagraphStyle("Cell", parent=styles["Normal"], fontSize=7.5, leading=10)

    def p(text: str, style=body) -> Paragraph:
        return Paragraph(text.replace("\n", "<br/>"), style)

    def table(data: list[list], col_widths: list[float] | None = None) -> Table:
        wrapped = [[p(str(c), cell) if not isinstance(c, Paragraph) else c for c in row] for row in data]
        t = Table(wrapped, colWidths=col_widths, repeatRows=1)
        t.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e8eef6")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1e3a5f")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 7.5),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd5e1")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                    ("LEFTPADDING", (0, 0), (-1, -1), 4),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        return t

    story: list = []

    # Cover
    story.append(p("juskel — QuickBooks Financial Profile Gap Analysis", title_style))
    story.append(p(
        "Accounting data requirements (Financial Profile.pdf) vs QuickBooks Online API feasibility, "
        "live sandbox validation, and current juskel manual collection (Figma / API).",
        body,
    ))
    story.append(Spacer(1, 0.3 * cm))
    story.append(p(f"<b>Document date:</b> {date.today().isoformat()}", small))
    story.append(p("<b>Evidence:</b> Intuit sandbox company 9341457727779039 · accounting_probe.py · test.sh all (Sep 2026)", small))
    story.append(p("<b>Scope:</b> Accounting only (Open Banking is a separate dataset per product spec).", small))

    story.append(p("Executive summary", h1))
    story.append(p(
        "The product vision is: SMEs provide a <b>minimum manual baseline</b> (or connect integrations); "
        "juskel derives richer intelligence without asking for ratios or trends. QuickBooks can supply "
        "<b>most CORE accounting fields</b> when extended beyond today's MVP sync (P&amp;L + accounts only). "
        "The current app collects <b>5 band dropdowns</b> plus optional evidence — not the PDF's 8 manual questions. "
        "Today's API persists integration output as <b>bands + metadata JSON</b>, not the full Layer-2 metric model.",
        body,
    ))

    story.append(p("1. Product data flow (Figma + API)", h1))
    story.append(table([
        ["Path", "User action", "What populates the DB today"],
        ["Manual", "Select 5 bands + upload evidence per band (Figma)", "funding.FinancialProfiles (5 enum bands) + funding.FinancialEvidence (files, no questionKey)"],
        ["QuickBooks", "Connect accounting OAuth", "Same 5 bands (mapped from P&amp;L/accounts) + IntegrationConnections (tokens, realmId, ProviderMetadataJson snapshot)"],
        ["Open Banking", "Connect bank OAuth", "Same 5 bands (from balances) — PDF intends separate cash-behaviour dataset"],
        ["Xero", "Connect OAuth", "Tokens only — no financial sync yet"],
    ], col_widths=[2.2 * cm, 5.5 * cm, 9.3 * cm]))

    story.append(p("2. PDF minimum manual baseline (8 questions) vs juskel today", h1))
    story.append(table([
        ["#", "PDF manual question", "PDF section", "juskel manual field today", "Gap"],
        ["1", "Latest annual turnover", "Financial performance", "annualRevenueBand (band)", "No £ amount; band proxy only"],
        ["2", "Profitable? (break-even / loss)", "Financial performance", "ebitdaBand (margin bands)", "Not yes/no/break-even"],
        ["3", "Profit or loss £ for that year", "Financial performance", "—", "Not collected manually"],
        ["4", "Cash held across business accounts (£)", "Cash & borrowing", "cashReserves (months band)", "Months not £ cash"],
        ["5", "Has outstanding borrowing? (Y/N)", "Cash & borrowing", "—", "Not collected; debt band only"],
        ["6", "Outstanding debt £ (if Yes)", "Cash & borrowing", "existingDebtBand (band)", "No Y/N gate; band only"],
        ["7", "3-month cash-flow direction", "Cash flow", "—", "PDF: derive from OB if connected; not in API"],
        ["8", "Latest financial year end date", "Financial performance", "—", "Not on FinancialProfile"],
        ["—", "(extra in juskel)", "—", "avgMonthlyRevenue band", "Not in PDF minimum set"],
    ], col_widths=[0.8 * cm, 4.2 * cm, 2.8 * cm, 3.8 * cm, 4.4 * cm]))

    story.append(PageBreak())
    story.append(p("3. PDF CORE accounting fields — QuickBooks achievability", h1))
    story.append(p(
        "Feasibility from live sandbox probe (2026-01-01 to 2026-12-31). "
        "<b>Direct</b> = QBO report/field. <b>Derive</b> = juskel computes from QBO data. "
        "<b>Partial</b> = available but chart-dependent or parser refinement needed. "
        "<b>Unavailable</b> = not in QBO API.",
        small,
    ))

    core_rows = [
        ["Field", "PDF", "QB feasibility", "Sandbox result", "QBO source"],
        ["Annual turnover / revenue", "CORE", "Direct", "Available — USD 10,200.77", "P&amp;L Total Income"],
        ["Operating profit / loss", "CORE", "Direct", "Available — USD 4,558.46", "P&amp;L Net Operating Income"],
        ["Cash / cash equivalents", "CORE", "Direct", "Available — USD 2,001.00", "Bank accounts / Balance sheet"],
        ["Accounts receivable", "CORE", "Direct", "Available — USD 5,281.52", "AgedReceivables / A/R accounts"],
        ["Accounts payable", "CORE", "Direct", "Available — USD 1,602.67", "AgedPayables / A/P accounts"],
        ["Current assets", "CORE", "Direct", "Available — USD 9,941.29", "Balance sheet"],
        ["Current liabilities", "CORE", "Direct", "Available — USD 6,131.33", "Balance sheet"],
        ["Total assets", "CORE", "Direct", "Available — USD 23,436.29", "Balance sheet"],
        ["Total liabilities", "CORE", "Direct", "Available* — see note", "Balance sheet (parser must target Total Liabilities line)"],
        ["Net assets / equity", "CORE", "Direct", "Available — USD -7,695.04", "Balance sheet Equity"],
        ["Outstanding debt / borrowings", "CORE", "Partial", "Available — USD 29,528.66", "Loan Payable + Notes Payable + credit cards (account types)"],
        ["Latest accounting period", "CORE", "Direct", "Available — 2026-12-31", "P&amp;L header + CompanyInfo fiscal year"],
        ["Prior comparative period", "CORE*", "Direct", "Empty for 2025 (company started Aug 2026)", "Second P&amp;L window"],
        ["Gross profit", "Supporting", "Direct", "Available — USD 9,795.77", "P&amp;L GrossProfit"],
        ["Net profit / loss", "CORE", "Direct", "Available — USD 1,642.46", "P&amp;L NetIncome"],
        ["Operating cash flow (statement)", "Supporting", "Direct", "Available — USD 1,896.02", "CashFlow report (not Open Banking)"],
        ["EBITDA", "CONDITIONAL", "Partial", "Not derived in probe", "No native line — derive from Net Income + D&amp;A/interest/tax if coded"],
        ["Finance / debt commitments", "CONDITIONAL", "Unavailable", "N/A", "No structured future-commitment API"],
    ]
    story.append(table(core_rows, col_widths=[3.4 * cm, 1.4 * cm, 1.8 * cm, 3.6 * cm, 5.8 * cm]))
    story.append(Spacer(1, 0.2 * cm))
    story.append(p("* Total liabilities parser in probe matched L+E total in one case; production parser should read explicit Total Liabilities (sandbox BS: USD 31,131.33).", small))

    story.append(p("4. PDF DERIVED accounting intelligence — QuickBooks achievability", h1))
    story.append(table([
        ["Derived metric (PDF)", "Formula", "QB feasibility", "Sandbox result", "Blocked when"],
        ["Working capital", "Current assets − current liabilities", "Derive", "Available — USD 3,809.96", "—"],
        ["Current ratio", "Current assets ÷ current liabilities", "Derive", "Available — 1.62", "—"],
        ["Profit margin", "Net income ÷ revenue", "Derive", "Available — 16.1%", "—"],
        ["Debt-to-assets / leverage", "Total liabilities ÷ total assets", "Derive", "Available — 1.00*", "Needs correct liabilities line"],
        ["Revenue trend / growth", "YoY revenue change", "Derive", "Empty", "Prior year NoReportData (new company)"],
        ["Profitability trend / movement", "YoY net income change", "Derive", "Partial / empty", "Prior year NoReportData"],
        ["Revenue trend (PDF CORE-derived)", "Growth/stability signal", "Derive", "Empty", "Needs 2+ years of books"],
    ], col_widths=[3.6 * cm, 4.2 * cm, 1.6 * cm, 3.2 * cm, 3.4 * cm]))

    story.append(p("5. What QuickBooks does NOT replace (per PDF architecture)", h1))
    story.append(table([
        ["Dataset", "Owner", "Examples", "In QuickBooks?"],
        ["Accounting performance & position", "QuickBooks / Xero", "Revenue, P&amp;L, balance sheet, debtors/creditors", "Yes (extended sync)"],
        ["Cash-flow behaviour & liquidity stress", "Open Banking", "Inflows/outflows, avg balance, failed payments, volatility", "No — use TrueLayer transactions"],
        ["SME minimum manual baseline", "User + evidence", "8 headline questions when not connected", "No — user input"],
        ["Provenance & confidence", "juskel platform", "source, period, retrievedAt, integration vs self-declared", "Partial — metadata blob today"],
        ["Finance commitments (future)", "—", "Scheduled debt, covenants", "Unavailable in QBO"],
        ["3-month cash-flow direction (manual Q7)", "User or OB", "More in than out?", "OB path, not accounting P&amp;L"],
    ], col_widths=[3.5 * cm, 2.5 * cm, 5.5 * cm, 4.5 * cm]))

    story.append(PageBreak())
    story.append(p("6. Gap matrix: PDF → QuickBooks → juskel manual → API persistence", h1))
    story.append(table([
        ["PDF need", "QB achievable?", "Auto-fills manual?", "In 5-band API?", "Persisted as £ metric?"],
        ["Turnover", "Yes", "Yes (band)", "annualRevenueBand", "No — band + QB JSON only"],
        ["Profitable Y/N", "Yes (from net income sign)", "Partial via ebitdaBand", "ebitdaBand", "No"],
        ["Profit £", "Yes", "Could auto-fill", "No field", "No"],
        ["Cash £", "Yes", "Partial (months band)", "cashReserves", "No"],
        ["Debt Y/N + £", "Partial", "Partial (debt band)", "existingDebtBand", "No"],
        ["FY end date", "Yes", "Could auto-fill", "No field", "No"],
        ["Cash-flow direction", "No (use OB)", "No", "No field", "No"],
        ["A/R, A/P, WC, ratios", "Yes (derive)", "Not in UI yet", "No", "No"],
        ["Evidence per answer", "N/A", "Figma per band", "evidence[] unkeyed", "Files only"],
    ], col_widths=[3.2 * cm, 2.2 * cm, 2.8 * cm, 2.8 * cm, 3.0 * cm]))

    story.append(p("7. Recommended implementation phases", h1))
    story.append(p("<b>Phase A — Align manual baseline with PDF</b><br/>Add: latestFinancialYearEnd, isProfitable, profitLossAmount (or band), hasBorrowing, cashFlowDirection; decide £ cash vs months band.", body))
    story.append(p("<b>Phase B — Extend QuickBooks sync</b><br/>Fetch Balance Sheet, Aged AR/AP, Cash Flow, prior-year P&amp;L; persist Layer-2 metrics table; fix liabilities parser.", body))
    story.append(p("<b>Phase C — Map QB → manual fields</b><br/>On connect, auto-populate PDF-aligned fields and bands; set bandsLockedByIntegration; store provenance per field.", body))
    story.append(p("<b>Phase D — Keep Open Banking separate</b><br/>Do not merge OB into same bands as accounting; OB feeds cash-behaviour fields per PDF.", body))
    story.append(p("<b>Phase E — Evidence linkage</b><br/>Add questionKey on financial evidence (like sustainability) for audit trail.", body))

    story.append(p("8. Sandbox evidence snapshot (validated)", h1))
    story.append(table([
        ["Metric", "Value (USD)", "Status"],
        ["Company", "Sandbox Company US c03c", "—"],
        ["Company start", "2026-08-16", "—"],
        ["Total income (2026 FY window)", "10,200.77", "Available"],
        ["Net operating income", "4,558.46", "Available"],
        ["Net income", "1,642.46", "Available"],
        ["Cash (bank accounts)", "2,001.00", "Available"],
        ["Accounts receivable", "5,281.52", "Available"],
        ["Accounts payable", "1,602.67", "Available"],
        ["Current assets", "9,941.29", "Available"],
        ["Current liabilities", "6,131.33", "Available"],
        ["Working capital", "3,809.96", "Derived"],
        ["Total assets", "23,436.29", "Available"],
        ["Loan-type debt (accounts)", "29,528.66", "Partial"],
        ["Operating cash flow (statement)", "1,896.02", "Available"],
        ["Prior-year P&amp;L", "NoReportData", "Empty"],
        ["Finance commitments", "—", "Unavailable"],
    ], col_widths=[5.5 * cm, 4.5 * cm, 3.0 * cm]))

    story.append(Spacer(1, 0.4 * cm))
    story.append(p("Appendix — QBO endpoints to add in production sync", h2))
    story.append(p(
        "companyinfo · ProfitAndLoss (current + prior) · BalanceSheet · AgedReceivables · "
        "AgedPayables · CashFlow · query Account (paginated). "
        "Regenerate probe: <font name='Courier'>cd api/sandbox/quickbooks && ./test.sh accounting-assessment</font>",
        small,
    ))
    story.append(p(
        "Related repo docs: api/sandbox/quickbooks/ACCOUNTING_PROBE.md · api/QUICKBOOKS_E2E.md · "
        "api/ONBOARDING_FRONTEND_API.md · discovery/.../Financial Profile.pdf",
        small,
    ))

    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=1.8 * cm,
        rightMargin=1.8 * cm,
        topMargin=1.8 * cm,
        bottomMargin=1.8 * cm,
        title="juskel QuickBooks Financial Profile Gap Analysis",
        author="juskel",
    )
    doc.build(story)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build_pdf()
