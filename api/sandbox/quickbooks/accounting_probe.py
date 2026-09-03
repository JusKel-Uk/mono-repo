"""Map Financial Profile.pdf accounting requirements → QuickBooks sandbox data.

Run standalone:
  python3 accounting_probe.py
  python3 accounting_probe.py --json > responses/accounting-assessment.live.json
"""

from __future__ import annotations

import argparse
import json
import re
import urllib.parse
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any, Callable

from quickbooks_client import (
    api_base,
    bearer_get,
    load_secrets,
    minor_version,
    refresh_access_token,
    report_dates,
)

FetchFn = Callable[[str], dict[str, Any]]

LOAN_ACCOUNT_TYPES = {
    "Long Term Liability",
    "Other Current Liability",
    "Credit Card",
}
LOAN_ACCOUNT_SUBTYPES = {
    "NotesPayable",
    "LineOfCredit",
    "LoanPayable",
    "OtherLongTermLiabilities",
    "CreditCard",
}


def parse_decimal(raw: Any) -> Decimal | None:
    if raw is None:
        return None
    if isinstance(raw, (int, float, Decimal)):
        return Decimal(str(raw))
    text = str(raw).strip().replace(",", "")
    if not text or text in {"-", "—"}:
        return None
    try:
        return Decimal(text)
    except InvalidOperation:
        return None


def prior_period(start: str, end: str) -> tuple[str, str]:
    """Shift report window back one calendar year (simple probe default)."""
    s = date.fromisoformat(start)
    e = date.fromisoformat(end)
    return s.replace(year=s.year - 1).isoformat(), e.replace(year=e.year - 1).isoformat()


def read_no_report_data(report: dict[str, Any]) -> bool:
    options = (report.get("Header") or {}).get("Option") or []
    for option in options:
        if option.get("Name") == "NoReportData" and str(option.get("Value", "")).lower() == "true":
            return True
    return False


def normalize_label(label: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", label.lower())


def iter_report_rows(node: dict[str, Any] | None):
    if not node:
        return
    rows = node.get("Row")
    if not isinstance(rows, list):
        return
    for row in rows:
        yield row
        nested = row.get("Rows")
        if nested:
            yield from iter_report_rows(nested)


def find_amount_by_group(report: dict[str, Any], group: str) -> Decimal | None:
    for row in iter_report_rows(report.get("Rows")):
        if row.get("group") == group and row.get("Summary"):
            amount = _amount_from_col_data(row["Summary"].get("ColData"))
            if amount is not None:
                return amount
    return None


def find_amount_by_labels(report: dict[str, Any], *labels: str) -> Decimal | None:
    wanted = {normalize_label(l) for l in labels}
    for row in iter_report_rows(report.get("Rows")):
        for col_source in (row, row.get("Summary")):
            if not col_source:
                continue
            col_data = col_source.get("ColData")
            if not isinstance(col_data, list) or not col_data:
                continue
            label = col_data[0].get("value", "")
            if normalize_label(label) in wanted:
                amount = _amount_from_col_data(col_data)
                if amount is not None:
                    return amount
    return None


def _amount_from_col_data(col_data: list[dict[str, Any]] | None) -> Decimal | None:
    if not col_data or len(col_data) < 2:
        return None
    return parse_decimal(col_data[-1].get("value"))


def find_expense_amount(report: dict[str, Any], *needles: str) -> Decimal | None:
    needles_norm = [normalize_label(n) for n in needles]
    for row in iter_report_rows(report.get("Rows")):
        col_data = row.get("ColData")
        if not isinstance(col_data, list) or not col_data:
            continue
        label = normalize_label(col_data[0].get("value", ""))
        if any(n in label for n in needles_norm):
            amount = _amount_from_col_data(col_data)
            if amount is not None:
                return abs(amount)
    return None


def fetch_with_refresh(env: dict[str, str], path: str) -> tuple[dict[str, str], dict[str, Any]]:
    data = bearer_get(env, path)
    needs_refresh = data.get("status") in (401, 403) or data.get("fault")
    if needs_refresh:
        ok, refresh_data = refresh_access_token(env)
        if ok:
            env = load_secrets()
            data = bearer_get(env, path)
        else:
            data.setdefault("authError", "Token expired — reconnect via sandbox UI (Connect sandbox company).")
            data["refreshError"] = refresh_data
    return env, data


def fetch_all_accounts(env: dict[str, str], realm: str, minor: str) -> tuple[dict[str, str], list[dict[str, Any]], list[str]]:
    accounts: list[dict[str, Any]] = []
    errors: list[str] = []
    start = 1
    while start <= 5000:
        query = urllib.parse.quote(f"select * from Account startposition {start} maxresults 100")
        path = f"/{realm}/query?query={query}&minorversion={minor}"
        env, data = fetch_with_refresh(env, path)
        if data.get("error") or data.get("Fault") or data.get("fault"):
            errors.append(f"accounts page {start}: {data.get('error') or 'Fault'}")
            break
        batch = (data.get("QueryResponse") or {}).get("Account") or []
        if not batch:
            break
        accounts.extend(batch)
        if len(batch) < 100:
            break
        start += 100
    return env, accounts, errors


def bucket_accounts(accounts: list[dict[str, Any]]) -> dict[str, Any]:
    cash = Decimal("0")
    receivables = Decimal("0")
    payables = Decimal("0")
    loan_debt = Decimal("0")
    total_liabilities = Decimal("0")
    by_type: dict[str, int] = {}

    for acc in accounts:
        balance = parse_decimal(acc.get("CurrentBalance")) or Decimal("0")
        account_type = acc.get("AccountType") or ""
        subtype = acc.get("AccountSubType") or ""
        classification = acc.get("Classification") or ""
        by_type[account_type] = by_type.get(account_type, 0) + 1

        if account_type == "Bank":
            cash += balance
        if account_type in {"Accounts Receivable"} or subtype == "AccountsReceivable":
            receivables += balance
        if account_type in {"Accounts Payable"} or subtype == "AccountsPayable":
            payables += abs(balance)
        if classification == "Liability":
            total_liabilities += abs(balance)
        if account_type in LOAN_ACCOUNT_TYPES or subtype in LOAN_ACCOUNT_SUBTYPES:
            if subtype not in {"AccountsPayable", "PayrollTaxPayable"} and "Payable" not in account_type:
                loan_debt += abs(balance)

    return {
        "cashBank": cash,
        "receivables": receivables,
        "payables": payables,
        "loanDebt": loan_debt,
        "totalLiabilitiesFromAccounts": total_liabilities,
        "accountCount": len(accounts),
        "accountTypes": by_type,
    }


def field_row(
    *,
    field_id: str,
    label: str,
    pdf_treatment: str,
    feasibility: str,
    value: Any = None,
    display: str | None = None,
    currency: str | None = None,
    qb_source: str = "",
    period: str | None = None,
    status: str = "available",
    notes: str = "",
) -> dict[str, Any]:
    return {
        "id": field_id,
        "label": label,
        "pdfTreatment": pdf_treatment,
        "feasibility": feasibility,
        "value": value,
        "displayValue": display if display is not None else ("" if value is None else str(value)),
        "currency": currency,
        "qbSource": qb_source,
        "period": period,
        "status": status,
        "notes": notes,
    }


def ratio_row(
    ratio_id: str,
    label: str,
    value: Decimal | None,
    formula: str,
    status: str,
    notes: str = "",
) -> dict[str, Any]:
    display = "—"
    if value is not None:
        display = f"{value.quantize(Decimal('0.01'))}"
    return {
        "id": ratio_id,
        "label": label,
        "formula": formula,
        "value": float(value) if value is not None else None,
        "displayValue": display,
        "status": status,
        "notes": notes,
    }


def safe_div(numerator: Decimal | None, denominator: Decimal | None) -> Decimal | None:
    if numerator is None or denominator is None or denominator == 0:
        return None
    return numerator / denominator


def growth_rate(current: Decimal | None, prior: Decimal | None) -> Decimal | None:
    if current is None or prior is None or prior == 0:
        return None
    return (current - prior) / abs(prior)


def run_assessment(env: dict[str, str] | None = None) -> dict[str, Any]:
    env = env or load_secrets()
    realm = env.get("QUICKBOOKS_REALM_ID", "").strip()
    token = env.get("QUICKBOOKS_ACCESS_TOKEN", "").strip()
    if not realm or not token:
        return {"error": "Connect sandbox company first (access token + realm ID in secrets.env)."}

    minor = minor_version(env)
    start, end = report_dates(env)
    prior_start, prior_end = prior_period(start, end)
    period_label = f"{start} → {end}"
    prior_label = f"{prior_start} → {prior_end}"
    as_of = end

    errors: list[str] = []
    requests: list[dict[str, str]] = []

    def get_report(name: str, path: str) -> dict[str, Any]:
        requests.append({"name": name, "path": path})
        nonlocal env
        env, data = fetch_with_refresh(env, path)
        if data.get("error") or data.get("Fault") or data.get("fault"):
            errors.append(f"{name}: API error")
        return data

    company = get_report("companyinfo", f"/{realm}/companyinfo/{realm}?minorversion={minor}")
    pnl = get_report(
        "profit-and-loss",
        f"/{realm}/reports/ProfitAndLoss?start_date={start}&end_date={end}&minorversion={minor}",
    )
    pnl_prior = get_report(
        "profit-and-loss-prior",
        f"/{realm}/reports/ProfitAndLoss?start_date={prior_start}&end_date={prior_end}&minorversion={minor}",
    )
    balance_sheet = get_report(
        "balance-sheet",
        f"/{realm}/reports/BalanceSheet?date={as_of}&minorversion={minor}",
    )
    aged_ar = get_report(
        "aged-receivables",
        f"/{realm}/reports/AgedReceivables?report_date={as_of}&minorversion={minor}",
    )
    aged_ap = get_report(
        "aged-payables",
        f"/{realm}/reports/AgedPayables?report_date={as_of}&minorversion={minor}",
    )
    cash_flow = get_report(
        "cash-flow",
        f"/{realm}/reports/CashFlow?start_date={start}&end_date={end}&minorversion={minor}",
    )

    env, accounts, account_errors = fetch_all_accounts(env, realm, minor)
    errors.extend(account_errors)
    buckets = bucket_accounts(accounts)

    currency = (pnl.get("Header") or {}).get("Currency") or (balance_sheet.get("Header") or {}).get("Currency")
    pnl_empty = read_no_report_data(pnl)
    pnl_prior_empty = read_no_report_data(pnl_prior)

    revenue = None if pnl_empty else find_amount_by_group(pnl, "Income") or find_amount_by_labels(pnl, "Total Income", "Income")
    revenue_prior = None if pnl_prior_empty else find_amount_by_group(pnl_prior, "Income") or find_amount_by_labels(pnl_prior, "Total Income", "Income")
    gross_profit = None if pnl_empty else find_amount_by_group(pnl, "GrossProfit") or find_amount_by_labels(pnl, "Gross Profit")
    operating_profit = None if pnl_empty else find_amount_by_group(pnl, "NetOperatingIncome") or find_amount_by_labels(
        pnl, "Net Operating Income", "Operating Income"
    )
    net_income = None if pnl_empty else find_amount_by_group(pnl, "NetIncome") or find_amount_by_labels(pnl, "Net Income")
    net_income_prior = None if pnl_prior_empty else find_amount_by_group(pnl_prior, "NetIncome") or find_amount_by_labels(
        pnl_prior, "Net Income"
    )

    depreciation = None if pnl_empty else find_expense_amount(pnl, "Depreciation")
    amortization = None if pnl_empty else find_expense_amount(pnl, "Amortization")
    interest = None if pnl_empty else find_expense_amount(pnl, "Interest")
    tax = None if pnl_empty else find_expense_amount(pnl, "Tax", "Income Tax")

    ebitda = None
    ebitda_notes = "QB has no native EBITDA line."
    if net_income is not None:
        parts = [net_income]
        added = []
        for label, part in (("interest", interest), ("tax", tax), ("depreciation", depreciation), ("amortization", amortization)):
            if part is not None:
                parts.append(part)
                added.append(label)
        if added:
            ebitda = sum(parts, Decimal("0"))
            ebitda_notes = f"Derived: Net Income + {', '.join(added)}. Chart-of-accounts dependent."
        else:
            ebitda_notes = "Could not find D&A / interest / tax lines to derive EBITDA."

    current_assets = find_amount_by_labels(balance_sheet, "Total Current Assets", "Current Assets")
    current_liabilities = find_amount_by_labels(balance_sheet, "Total Current Liabilities", "Current Liabilities")
    total_assets = find_amount_by_labels(balance_sheet, "TOTAL ASSETS", "Total Assets")
    total_liabilities = find_amount_by_labels(
        balance_sheet, "Total Liabilities", "TOTAL LIABILITIES", "Total Liabilities And Equity"
    )
    total_equity = find_amount_by_labels(balance_sheet, "Total Equity", "Net Assets", "TOTAL EQUITY")

    ar_report_total = find_amount_by_labels(aged_ar, "Total", "TOTAL")
    ap_report_total = find_amount_by_labels(aged_ap, "Total", "TOTAL")
    operating_cash_flow = find_amount_by_labels(
        cash_flow, "Net cash provided by operating activities", "Net Cash Provided by Operating Activities"
    )

    working_capital = None
    if current_assets is not None and current_liabilities is not None:
        working_capital = current_assets - current_liabilities

    fields: list[dict[str, Any]] = [
        field_row(
            field_id="annual_revenue",
            label="Annual turnover / revenue",
            pdf_treatment="CORE",
            feasibility="direct",
            value=float(revenue) if revenue is not None else None,
            currency=currency,
            qb_source="reports/ProfitAndLoss → Income",
            period=period_label,
            status="empty" if pnl_empty else ("available" if revenue is not None else "partial"),
            notes="Empty if report dates exclude company activity (NoReportData)." if pnl_empty else "",
        ),
        field_row(
            field_id="revenue_trend",
            label="Revenue trend",
            pdf_treatment="CORE – derived",
            feasibility="derive",
            value=float(growth_rate(revenue, revenue_prior)) if revenue is not None and revenue_prior is not None else None,
            display=(
                f"{(growth_rate(revenue, revenue_prior) * 100).quantize(Decimal('0.1'))}% YoY"
                if revenue is not None and revenue_prior is not None and growth_rate(revenue, revenue_prior) is not None
                else "—"
            ),
            currency=currency,
            qb_source="Two P&L windows (current vs prior year)",
            period=f"{period_label} vs {prior_label}",
            status="available" if revenue is not None and revenue_prior is not None else "empty" if pnl_empty or pnl_prior_empty else "partial",
        ),
        field_row(
            field_id="operating_profit",
            label="Operating profit / loss",
            pdf_treatment="CORE",
            feasibility="direct",
            value=float(operating_profit) if operating_profit is not None else None,
            currency=currency,
            qb_source="reports/ProfitAndLoss → NetOperatingIncome",
            period=period_label,
            status="empty" if pnl_empty else ("available" if operating_profit is not None else "partial"),
        ),
        field_row(
            field_id="ebitda",
            label="EBITDA",
            pdf_treatment="CONDITIONAL",
            feasibility="partial",
            value=float(ebitda) if ebitda is not None else None,
            currency=currency,
            qb_source="Derived from P&L (Net Income + interest/tax/D&A if present)",
            period=period_label,
            status="available" if ebitda is not None else "partial",
            notes=ebitda_notes,
        ),
        field_row(
            field_id="profitability_trend",
            label="Profitability trend",
            pdf_treatment="CORE – derived",
            feasibility="derive",
            value=float(growth_rate(net_income, net_income_prior)) if net_income is not None and net_income_prior is not None else None,
            display=(
                f"Net income Δ {(growth_rate(net_income, net_income_prior) * 100).quantize(Decimal('0.1'))}% YoY"
                if net_income is not None and net_income_prior is not None and growth_rate(net_income, net_income_prior) is not None
                else "—"
            ),
            currency=currency,
            qb_source="Two P&L windows",
            period=f"{period_label} vs {prior_label}",
            status="available" if net_income is not None and net_income_prior is not None else "partial",
        ),
        field_row(
            field_id="cash_equivalents",
            label="Cash / cash equivalents",
            pdf_treatment="CORE",
            feasibility="direct",
            value=float(buckets["cashBank"]) if buckets["cashBank"] else None,
            currency=currency,
            qb_source="query Account (Bank) or BalanceSheet cash lines",
            period=as_of,
            status="available" if buckets["cashBank"] else "partial",
            notes="Using bank account balances from chart of accounts.",
        ),
        field_row(
            field_id="accounts_receivable",
            label="Accounts receivable (debtors)",
            pdf_treatment="CORE",
            feasibility="direct",
            value=float(ar_report_total or buckets["receivables"]) if (ar_report_total or buckets["receivables"]) else None,
            currency=currency,
            qb_source="reports/AgedReceivables or A/R accounts",
            period=as_of,
            status="available" if (ar_report_total or buckets["receivables"]) else "partial",
        ),
        field_row(
            field_id="accounts_payable",
            label="Accounts payable (creditors)",
            pdf_treatment="CORE",
            feasibility="direct",
            value=float(ap_report_total or buckets["payables"]) if (ap_report_total or buckets["payables"]) else None,
            currency=currency,
            qb_source="reports/AgedPayables or A/P accounts",
            period=as_of,
            status="available" if (ap_report_total or buckets["payables"]) else "partial",
        ),
        field_row(
            field_id="current_assets",
            label="Current assets",
            pdf_treatment="CORE",
            feasibility="direct",
            value=float(current_assets) if current_assets is not None else None,
            currency=currency,
            qb_source="reports/BalanceSheet",
            period=as_of,
            status="available" if current_assets is not None else "partial",
        ),
        field_row(
            field_id="current_liabilities",
            label="Current liabilities",
            pdf_treatment="CORE",
            feasibility="direct",
            value=float(current_liabilities) if current_liabilities is not None else None,
            currency=currency,
            qb_source="reports/BalanceSheet",
            period=as_of,
            status="available" if current_liabilities is not None else "partial",
        ),
        field_row(
            field_id="working_capital",
            label="Working capital position",
            pdf_treatment="DERIVED",
            feasibility="derive",
            value=float(working_capital) if working_capital is not None else None,
            currency=currency,
            qb_source="Current assets − current liabilities",
            period=as_of,
            status="available" if working_capital is not None else "partial",
        ),
        field_row(
            field_id="total_assets",
            label="Total assets",
            pdf_treatment="CORE",
            feasibility="direct",
            value=float(total_assets) if total_assets is not None else None,
            currency=currency,
            qb_source="reports/BalanceSheet",
            period=as_of,
            status="available" if total_assets is not None else "partial",
        ),
        field_row(
            field_id="total_liabilities",
            label="Total liabilities",
            pdf_treatment="CORE",
            feasibility="direct",
            value=float(total_liabilities) if total_liabilities is not None else None,
            currency=currency,
            qb_source="reports/BalanceSheet",
            period=as_of,
            status="available" if total_liabilities is not None else "partial",
        ),
        field_row(
            field_id="net_assets_equity",
            label="Net assets / equity",
            pdf_treatment="CORE",
            feasibility="direct",
            value=float(total_equity) if total_equity is not None else None,
            currency=currency,
            qb_source="reports/BalanceSheet → Equity",
            period=as_of,
            status="available" if total_equity is not None else "partial",
        ),
        field_row(
            field_id="outstanding_debt",
            label="Outstanding debt / borrowings",
            pdf_treatment="CORE",
            feasibility="partial",
            value=float(buckets["loanDebt"]) if buckets["loanDebt"] else None,
            currency=currency,
            qb_source="query Account (loan / LOC / notes payable types)",
            period=as_of,
            status="available" if buckets["loanDebt"] else "partial",
            notes="Depends on SME categorising loans correctly (not trade payables).",
        ),
        field_row(
            field_id="finance_commitments",
            label="Finance / debt commitments",
            pdf_treatment="CONDITIONAL",
            feasibility="unavailable",
            status="unavailable",
            qb_source="—",
            notes="No structured future-commitment dataset in QBO API.",
        ),
        field_row(
            field_id="latest_accounting_period",
            label="Latest accounting period / date",
            pdf_treatment="CORE",
            feasibility="direct",
            value=end,
            qb_source="P&L Header.EndPeriod + CompanyInfo.FiscalYearStartMonth",
            period=period_label,
            status="available",
            notes=(company.get("CompanyInfo") or {}).get("FiscalYearStartMonth", ""),
        ),
        field_row(
            field_id="prior_comparative_period",
            label="Prior comparative period",
            pdf_treatment="CORE where available",
            feasibility="direct",
            value=prior_end,
            qb_source="Second P&L call (prior year window)",
            period=prior_label,
            status="empty" if pnl_prior_empty else ("available" if revenue_prior is not None or net_income_prior is not None else "partial"),
        ),
        field_row(
            field_id="gross_profit",
            label="Gross profit (supporting)",
            pdf_treatment="Supporting",
            feasibility="direct",
            value=float(gross_profit) if gross_profit is not None else None,
            currency=currency,
            qb_source="reports/ProfitAndLoss → GrossProfit",
            period=period_label,
            status="empty" if pnl_empty else ("available" if gross_profit is not None else "partial"),
        ),
        field_row(
            field_id="net_income",
            label="Net profit / loss",
            pdf_treatment="CORE (manual baseline)",
            feasibility="direct",
            value=float(net_income) if net_income is not None else None,
            currency=currency,
            qb_source="reports/ProfitAndLoss → NetIncome",
            period=period_label,
            status="empty" if pnl_empty else ("available" if net_income is not None else "partial"),
        ),
        field_row(
            field_id="operating_cash_flow_statement",
            label="Operating cash flow (accounting statement)",
            pdf_treatment="Supporting",
            feasibility="direct",
            value=float(operating_cash_flow) if operating_cash_flow is not None else None,
            currency=currency,
            qb_source="reports/CashFlow",
            period=period_label,
            status="available" if operating_cash_flow is not None else ("empty" if read_no_report_data(cash_flow) else "partial"),
            notes="Accounting cash-flow statement — not the same as Open Banking transaction behaviour.",
        ),
    ]

    ratios = [
        ratio_row(
            "current_ratio",
            "Current ratio",
            safe_div(current_assets, current_liabilities),
            "current assets ÷ current liabilities",
            "available" if current_assets is not None and current_liabilities is not None else "partial",
        ),
        ratio_row(
            "debt_to_assets",
            "Debt-to-assets / leverage",
            safe_div(total_liabilities, total_assets),
            "total liabilities ÷ total assets",
            "available" if total_liabilities is not None and total_assets is not None else "partial",
        ),
        ratio_row(
            "profit_margin",
            "Profit margin",
            safe_div(net_income, revenue),
            "net income ÷ revenue",
            "available" if net_income is not None and revenue is not None else "partial",
        ),
        ratio_row(
            "working_capital_ratio",
            "Working capital (absolute)",
            working_capital,
            "current assets − current liabilities",
            "available" if working_capital is not None else "partial",
        ),
        ratio_row(
            "revenue_growth",
            "Revenue growth rate",
            growth_rate(revenue, revenue_prior),
            "(current revenue − prior revenue) ÷ prior revenue",
            "available" if revenue is not None and revenue_prior is not None else "partial",
        ),
        ratio_row(
            "profitability_movement",
            "Profitability movement",
            growth_rate(net_income, net_income_prior),
            "net income YoY change",
            "available" if net_income is not None and net_income_prior is not None else "partial",
        ),
    ]

    status_counts: dict[str, int] = {}
    for item in fields:
        status_counts[item["status"]] = status_counts.get(item["status"], 0) + 1

    feasibility_counts: dict[str, int] = {}
    for item in fields:
        feasibility_counts[item["feasibility"]] = feasibility_counts.get(item["feasibility"], 0) + 1

    return {
        "assessmentId": "financial-profile-accounting",
        "sourceDocument": "Financial Profile.pdf (accounting sections)",
        "fetchedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "realmId": realm,
        "currency": currency,
        "periods": {
            "current": {"start": start, "end": end, "label": period_label},
            "prior": {"start": prior_start, "end": prior_end, "label": prior_label},
            "balanceSheetAsOf": as_of,
        },
        "company": {
            "name": (company.get("CompanyInfo") or {}).get("CompanyName"),
            "country": (company.get("CompanyInfo") or {}).get("Country"),
            "fiscalYearStartMonth": (company.get("CompanyInfo") or {}).get("FiscalYearStartMonth"),
            "companyStartDate": (company.get("CompanyInfo") or {}).get("CompanyStartDate"),
        },
        "summary": {
            "fieldCount": len(fields),
            "statusCounts": status_counts,
            "feasibilityCounts": feasibility_counts,
            "accountsFetched": buckets["accountCount"],
            "apiErrors": errors,
        },
        "fields": fields,
        "derivedRatios": ratios,
        "accountBuckets": {k: float(v) if isinstance(v, Decimal) else v for k, v in buckets.items()},
        "requests": requests,
        "rawFlags": {
            "pnlNoReportData": pnl_empty,
            "pnlPriorNoReportData": pnl_prior_empty,
            "cashFlowNoReportData": read_no_report_data(cash_flow),
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="QuickBooks accounting probe vs Financial Profile.pdf")
    parser.add_argument("--json", action="store_true", help="Print JSON only")
    args = parser.parse_args()
    result = run_assessment()
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
