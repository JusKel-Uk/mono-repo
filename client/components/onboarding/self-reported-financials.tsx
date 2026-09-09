'use client';

/**
 * Editable, QBO-shaped self-report of financial figures — mirrors the fields a
 * connected accounting source (QuickBooks / Xero) would provide, so a user
 * without an integration can self-declare the same picture.
 *
 * NOTE: the raw figures below are NOT yet persisted — the backend financial
 * profile only stores the 5 enum bands. These are captured in form state until
 * the funding module is extended with self-declared financial columns.
 * TODO(backend): add raw self-declared financial fields + migration, then wire
 * these to the PUT payload (see AddSelfDeclaredFinancials).
 */

const INCOME_FIELDS = [
  ['annualRevenue', 'Annual revenue'],
  ['grossProfit', 'Gross profit'],
  ['operatingProfit', 'Operating profit'],
  ['netIncome', 'Net income'],
  ['ebitda', 'EBITDA'],
  ['operatingCashFlow', 'Operating cash flow'],
] as const;

const BALANCE_FIELDS = [
  ['cashBalance', 'Cash balance'],
  ['accountsReceivable', 'Accounts receivable'],
  ['accountsPayable', 'Accounts payable'],
  ['workingCapital', 'Working capital'],
  ['currentAssets', 'Current assets'],
  ['currentLiabilities', 'Current liabilities'],
  ['totalAssets', 'Total assets'],
  ['totalLiabilities', 'Total liabilities'],
  ['totalEquity', 'Total equity'],
  ['outstandingDebt', 'Outstanding debt'],
] as const;

type FieldKey =
  | (typeof INCOME_FIELDS)[number][0]
  | (typeof BALANCE_FIELDS)[number][0];

export type ReportedFinancials = Record<FieldKey, string>;

const ALL_KEYS: FieldKey[] = [
  ...INCOME_FIELDS.map((f) => f[0]),
  ...BALANCE_FIELDS.map((f) => f[0]),
];

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
  const set = (key: FieldKey, v: string) =>
    onChange({ ...value, [key]: v });

  return (
    <div className='flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-5'>
      <Group heading='Income'>
        {INCOME_FIELDS.map(([key, label]) => (
          <MoneyInput
            key={key}
            label={label}
            value={value[key]}
            onChange={(v) => set(key, v)}
          />
        ))}
      </Group>

      <Group heading='Balance sheet'>
        {BALANCE_FIELDS.map(([key, label]) => (
          <MoneyInput
            key={key}
            label={label}
            value={value[key]}
            onChange={(v) => set(key, v)}
          />
        ))}
      </Group>
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
      <p className='text-label-sm font-medium uppercase tracking-wide text-gray-400'>
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

