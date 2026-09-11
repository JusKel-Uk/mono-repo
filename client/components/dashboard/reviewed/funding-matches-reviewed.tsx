'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  ChevronDown,
  FileCheck2,
  OctagonAlert,
  Save,
  Search,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import {
  FUNDING_MATCHES,
  type FundingMatch,
  MATCH_LABEL,
  PRODUCT_TYPES,
} from '@/lib/dashboard/funding-matches';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

/* ---- circular fit-score ring ---- */
function FitRing({ pct }: { pct: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className='relative size-14 shrink-0 lg:size-16'>
      <svg viewBox='0 0 64 64' className='size-full -rotate-90'>
        <circle
          cx='32'
          cy='32'
          r={r}
          fill='none'
          stroke='var(--color-gray-200)'
          strokeWidth='6'
        />
        <circle
          cx='32'
          cy='32'
          r={r}
          fill='none'
          stroke='var(--color-primary)'
          strokeWidth='6'
          strokeLinecap='round'
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
        />
      </svg>
      <span className='absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-gray-700 lg:text-body-sm'>
        {pct}%
      </span>
    </div>
  );
}

function AmountApr({ amount, apr }: { amount: string; apr: string }) {
  return (
    <div className='flex flex-col gap-4 text-right text-label-md lg:w-28 lg:text-body-md'>
      <div className='flex flex-col'>
        <span className='text-gray-500'>Amount</span>
        <span className='text-carbon-black'>{amount}</span>
      </div>
      <div className='flex flex-col'>
        <span className='text-gray-500'>APR</span>
        <span className='text-carbon-black'>{apr}</span>
      </div>
    </div>
  );
}

function MatchCard({ m }: { m: FundingMatch }) {
  const green = m.match !== 'fair';
  return (
    <Link
      href={`${ROUTES.sme.fundingMatches}/${m.id}`}
      className='flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-primary/40 lg:gap-6 lg:p-7'
    >
      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6'>
        <div className='flex gap-4'>
          <span className='hidden size-16 shrink-0 items-center justify-center rounded-xl bg-primary text-body-lg font-medium text-refined-gold lg:flex'>
            {m.monogram}
          </span>
          <div className='flex flex-col gap-1 lg:gap-0.5'>
            <div className='flex flex-col-reverse items-start gap-2 lg:flex-row lg:items-center lg:gap-3'>
              <h3 className='text-body-lg font-semibold text-carbon-black lg:text-h4'>
                {m.provider}
              </h3>
              <div className='flex flex-wrap gap-2'>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-2xl py-0.5 pr-2.5 pl-2 text-label-sm font-medium lg:text-body-sm',
                    green
                      ? 'bg-success-50 text-success-700'
                      : 'bg-warning-50 text-warning-700',
                  )}
                >
                  <span
                    className={cn(
                      'size-2 rounded-full',
                      green ? 'bg-success-500' : 'bg-warning-500',
                    )}
                  />
                  {MATCH_LABEL[m.match]}
                </span>
                <span className='inline-flex items-center rounded-2xl bg-success-50 px-2.5 py-0.5 text-label-sm font-medium text-primary lg:text-body-sm'>
                  {m.type}
                </span>
              </div>
            </div>
            <p className='text-body-sm text-gray-500 lg:text-body-lg'>
              {m.product}
            </p>
            <p className='text-label-md text-gray-600 lg:text-body-md'>
              {m.reason}
            </p>
          </div>
        </div>

        {/* Desktop: ring + amount in the top-right */}
        <div className='hidden items-center gap-8 lg:flex'>
          <FitRing pct={m.fit} />
          <AmountApr amount={m.amount} apr={m.apr} />
        </div>
      </div>

      <div className='flex items-center justify-between lg:justify-end'>
        {/* Mobile: ring + amount wrap below the text */}
        <div className='flex items-center gap-6 lg:hidden'>
          <FitRing pct={m.fit} />
          <AmountApr amount={m.amount} apr={m.apr} />
        </div>
        <span className='flex items-center gap-2 text-label-md text-carbon-black lg:text-body-md'>
          View details
          <ArrowRight className='size-4 lg:size-5.5' />
        </span>
      </div>
    </Link>
  );
}

function ActionLink({
  href,
  icon: Icon,
  label,
  variant,
  mobile,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  variant: 'primary' | 'secondary';
  mobile?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-5 font-semibold shadow-xs transition',
        mobile ? 'text-body-sm' : 'text-body-md',
        variant === 'primary'
          ? 'bg-primary text-mineral-white hover:opacity-90'
          : 'border border-gray-300 bg-mineral-white text-carbon-black hover:bg-muted',
      )}
    >
      <Icon className='size-5' />
      {label}
    </Link>
  );
}

function FilterDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className='relative w-full sm:w-80'>
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        className='flex h-13 w-full items-center justify-between gap-3 rounded-xl bg-primary px-4 text-body-sm text-mineral-white lg:h-14 lg:text-body-md'
      >
        {value}
        <ChevronDown
          className={cn('size-5 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <>
          <button
            type='button'
            aria-hidden
            tabIndex={-1}
            className='fixed inset-0 z-10 cursor-default'
            onClick={() => setOpen(false)}
          />
          <div className='absolute right-0 z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg'>
            {PRODUCT_TYPES.map((t) => (
              <button
                key={t}
                type='button'
                onClick={() => {
                  onChange(t);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-body-sm hover:bg-gray-50 lg:text-body-md',
                  t === value ? 'font-medium text-carbon-black' : 'text-gray-600',
                )}
              >
                {t}
                {t === value && <Check className='size-4 text-primary' />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Post-review Funding matches: search + filter over fit-ranked opportunities. */
export function FundingMatchesReviewed() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState(PRODUCT_TYPES[0]);

  const q = query.trim().toLowerCase();
  const matches = FUNDING_MATCHES.filter(
    (m) =>
      (type === PRODUCT_TYPES[0] || m.type === type) &&
      (q === '' || `${m.provider} ${m.product}`.toLowerCase().includes(q)),
  );

  return (
    <DashboardShell
      title='Funding matches'
      subtitle={`${FUNDING_MATCHES.length} opportunities ranked by fit with your business, financial, sustainability and funding profile.`}
      action={
        <div className='flex items-center gap-4'>
          <ActionLink
            href={`${ROUTES.sme.fundingMatches}/applications`}
            icon={FileCheck2}
            label='My applications'
            variant='secondary'
          />
          <ActionLink
            href={`${ROUTES.sme.fundingMatches}/saved`}
            icon={Save}
            label='Saved list'
            variant='primary'
          />
        </div>
      }
    >
      {/* Mobile header actions (the header slot is desktop-only). */}
      <div className='flex gap-3 lg:hidden'>
        <ActionLink
          href={`${ROUTES.sme.fundingMatches}/applications`}
          icon={FileCheck2}
          label='My applications'
          variant='secondary'
          mobile
        />
        <ActionLink
          href={`${ROUTES.sme.fundingMatches}/saved`}
          icon={Save}
          label='Saved list'
          variant='primary'
          mobile
        />
      </div>

      {/* Search + product-type filter */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
        <div className='relative flex-1'>
          <Search className='absolute top-1/2 left-4 size-5 -translate-y-1/2 text-gray-500 lg:size-6' />
          <input
            type='search'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search provider or product'
            className='h-13 w-full rounded-xl border border-gray-300 bg-white pr-4 pl-12 text-body-sm text-carbon-black outline-none placeholder:text-gray-500 focus:border-primary lg:h-14 lg:text-body-md'
          />
        </div>
        <FilterDropdown value={type} onChange={setType} />
      </div>

      {/* Match cards */}
      {matches.length === 0 ? (
        <div className='flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-body-md text-gray-500'>
          No matches for your search.
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          {matches.map((m) => (
            <MatchCard key={m.id} m={m} />
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className='flex items-start gap-3 rounded-2xl border border-mineral-white bg-abyssal p-6 text-mineral-white'>
        <OctagonAlert className='size-4 shrink-0 lg:size-6' />
        <p className='text-label-md lg:text-body-md'>
          Funding matches are recommendations based on your business profile and
          ESG assessment. Eligibility, approval, and final lending terms are
          determined solely by the funding provider.
        </p>
      </div>
    </DashboardShell>
  );
}
