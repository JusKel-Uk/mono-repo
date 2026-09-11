'use client';

/**
 * Editable, QBO-shaped self-report of financial figures — mirrors the CORE
 * fields a connected accounting source (QuickBooks / Xero) would provide, so a
 * user without an integration can self-declare the same picture.
 *
 * Fields are the canonical CORE accounting inputs grouped by financial
 * dimension (Profitability, Liquidity, Financial resilience). We only collect
 * inputs here — working capital, EBITDA, ratios and trends are DERIVED from
 * these, not self-declared. (Operational Efficiency, Growth & Stability and
 * Financial Governance carry no self-entered monetary inputs.)
 *
 * NOTE: the raw figures below are NOT yet persisted — the backend financial
 * profile only stores the 5 enum bands. These are captured in form state until
 * the funding module is extended with self-declared financial columns.
 * TODO(backend): add raw self-declared financial fields + migration, then wire
 * these to the PUT payload (see AddSelfDeclaredFinancials).
 */

const DIMENSION_GROUPS = [
  {
    heading: 'Profitability',
    fields: [
      ['annualRevenue', 'Annual revenue'],
      ['grossProfit', 'Gross profit'],
      ['operatingExpenses', 'Operating expenses'],
      ['operatingProfit', 'Operating profit / loss'],
      ['netIncome', 'Net profit / loss'],
      ['interestExpense', 'Interest / finance expense'],
    ],
  },
  {
    heading: 'Liquidity',
    fields: [
      ['cashBalance', 'Cash & cash equivalents'],
      ['accountsReceivable', 'Accounts receivable'],
      ['accountsPayable', 'Accounts payable'],
      ['currentAssets', 'Current assets'],
      ['currentLiabilities', 'Current liabilities'],
      ['operatingCashFlow', 'Operating cash flow'],
    ],
  },
  {
    heading: 'Financial resilience',
    fields: [
      ['totalAssets', 'Total assets'],
      ['totalLiabilities', 'Total liabilities'],
      ['totalEquity', 'Net assets / equity'],
      ['outstandingDebt', 'Outstanding borrowings'],
    ],
  },
] as const;

type FieldKey = (typeof DIMENSION_GROUPS)[number]['fields'][number][0];

export type ReportedFinancials = Record<FieldKey, string>;

const ALL_KEYS: FieldKey[] = DIMENSION_GROUPS.flatMap((g) =>
  g.fields.map((f) => f[0]),
);

export const EMPTY_REPORTED: ReportedFinancials = Object.fromEntries(
  ALL_KEYS.map((k) => [k, '']),
) as ReportedFinancials;

export function SelfReportedFinancials({
  value,
  onChange,
}: {
  value: ReportedFinancials;
  onChange: (next: ReportedFinancials) => void;
}) {
  const set = (key: FieldKey, v: string) => onChange({ ...value, [key]: v });

  return (
    <div className='flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-5'>
      {DIMENSION_GROUPS.map((group) => (
        <Group key={group.heading} heading={group.heading}>
          {group.fields.map(([key, label]) => (
            <MoneyInput
              key={key}
              label={label}
              value={value[key]}
              onChange={(v) => set(key, v)}
            />
          ))}
        </Group>
      ))}
    </div>
  );
}

function Group({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col gap-3'>
      <p className='text-label-sm font-semibold uppercase tracking-wide text-gray-400'>
        {heading}
      </p>
      <div className='grid gap-4 sm:grid-cols-2'>{children}</div>
    </div>
  );
}

function MoneyInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className='flex flex-col gap-1.5'>
      <label className='text-sm font-medium text-carbon-black'>{label}</label>
      <div className='flex h-12 items-center rounded-lg border border-gray-300 px-3 focus-within:border-primary'>
        <span className='text-gray-400'>£</span>
        <input
          inputMode='decimal'
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder='0.00'
          className='w-full bg-transparent px-2 text-base text-carbon-black outline-none placeholder:text-gray-400'
        />
      </div>
    </div>
  );
}
