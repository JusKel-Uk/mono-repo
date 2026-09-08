'use client';

import { CheckCircle2 } from 'lucide-react';

import type {
  BankingIntegrationMetrics,
  FinancialIntegrationMetrics,
} from '@/lib/api/onboarding';

export type MetricRow = { label: string; value: string };
export type MetricGroup = { heading: string; rows: MetricRow[] };

/* ---- value formatters ---- */

function money(v: number | null | undefined, currency: string): string | null {
  if (v == null) return null;
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency || 'GBP',
      maximumFractionDigits: 2,
    }).format(v);
  } catch {
    return `${currency} ${v.toLocaleString('en-GB')}`;
  }
}

function ratio(v: number | null | undefined): string | null {
  return v == null ? null : v.toFixed(2);
}

function percent(v: number | null | undefined): string | null {
  return v == null ? null : `${(v * 100).toFixed(1)}%`;
}

function count(v: number | null | undefined): string | null {
  return v == null ? null : v.toLocaleString('en-GB');
}

function formatPeriod(startIso: string, endIso: string): string {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? iso
      : d.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
  };
  return `${fmt(startIso)} – ${fmt(endIso)}`;
}

/** Keep only the rows whose value is present, and drop empty groups. */
function compact(
  groups: { heading: string; rows: (MetricRow | null)[] }[],
): MetricGroup[] {
  return groups
    .map((g) => ({
      heading: g.heading,
      rows: g.rows.filter((r): r is MetricRow => r != null),
    }))
    .filter((g) => g.rows.length > 0);
}

const row = (label: string, value: string | null): MetricRow | null =>
  value == null ? null : { label, value };

/* ---- source-specific row builders ---- */

/** Accounting source (QuickBooks / Xero): P&L, balance sheet, ratios. */
export function accountingMetricGroups(
  m: FinancialIntegrationMetrics,
): MetricGroup[] {
  const c = m.currency;
  return compact([
    {
      heading: 'Income',
      rows: [
        row('Annual revenue', money(m.annualRevenue, c)),
        row('Gross profit', money(m.grossProfit, c)),
        row('Operating profit', money(m.operatingProfit, c)),
        row('Net income', money(m.netIncome, c)),
        row('EBITDA', money(m.ebitda, c)),
        row('Operating cash flow', money(m.operatingCashFlow, c)),
      ],
    },
    {
      heading: 'Balance sheet',
      rows: [
        row('Cash balance', money(m.cashBalance, c)),
        row('Accounts receivable', money(m.accountsReceivable, c)),
        row('Accounts payable', money(m.accountsPayable, c)),
        row('Working capital', money(m.workingCapital, c)),
        row('Current assets', money(m.currentAssets, c)),
        row('Current liabilities', money(m.currentLiabilities, c)),
        row('Total assets', money(m.totalAssets, c)),
        row('Total liabilities', money(m.totalLiabilities, c)),
        row('Total equity', money(m.totalEquity, c)),
        row('Outstanding debt', money(m.outstandingDebt, c)),
      ],
    },
    {
      heading: 'Ratios',
      rows: [
        row('Current ratio', ratio(m.currentRatio)),
        row('Debt-to-assets', ratio(m.debtToAssets)),
        row('Profit margin', percent(m.profitMargin)),
      ],
    },
  ]);
}

/** Open Banking: aggregated cash-flow across connected banks. */
export function bankingMetricGroups(
  m: BankingIntegrationMetrics,
): MetricGroup[] {
  const c = m.currency;
  return compact([
    {
      heading: 'Cash flow',
      rows: [
        row('Average monthly inflow', money(m.avgMonthlyInflow, c)),
        row('Average monthly outflow', money(m.avgMonthlyOutflow, c)),
        row('Net cash flow', money(m.netCashFlow, c)),
        row('Total credits', money(m.totalCredits, c)),
        row('Total debits', money(m.totalDebits, c)),
      ],
    },
    {
      heading: 'Balances & activity',
      rows: [
        row('Total cash balance', money(m.totalCashBalance, c)),
        row('Transactions', count(m.transactionCount)),
        row('Accounts', count(m.accountCount)),
        row('Banks connected', count(m.connectionCount)),
      ],
    },
  ]);
}

export function accountingCaption(m: FinancialIntegrationMetrics): string {
  return `${formatPeriod(m.periodStart, m.periodEnd)} · ${m.currency}`;
}

export function bankingCaption(m: BankingIntegrationMetrics): string {
  return `${formatPeriod(m.periodStart, m.periodEnd)} · ${m.currency}`;
}

/* ---- panel ---- */

/**
 * Read-only "verified" figures imported from a connected source. Values are
 * grouped and cannot be edited — the connected integration is the source of
 * truth.
 */
export function VerifiedMetrics({
  source,
  caption,
  groups,
}: {
  source: string;
  caption?: string;
  groups: MetricGroup[];
}) {
  return (
    <div className='flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-5'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex flex-col'>
          <p className='text-base font-semibold text-carbon-black'>{source}</p>
          {caption ? (
            <p className='text-xs text-muted-foreground'>{caption}</p>
          ) : null}
        </div>
        <span className='inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success-50 px-3 py-1 text-label-md font-medium text-success-600'>
          <CheckCircle2 className='size-4' />
          Verified
        </span>
      </div>

      <div className='flex flex-col gap-5'>
        {groups.map((g) => (
          <div key={g.heading} className='flex flex-col gap-2'>
            <p className='text-label-sm font-medium uppercase tracking-wide text-gray-400'>
              {g.heading}
            </p>
            <dl className='flex flex-col'>
              {g.rows.map((r) => (
                <div
                  key={r.label}
                  className='flex items-center justify-between gap-4 border-b border-gray-100 py-2 last:border-b-0'
                >
                  <dt className='text-sm text-gray-500'>{r.label}</dt>
                  <dd className='text-sm font-medium tabular-nums text-carbon-black'>
                    {r.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
