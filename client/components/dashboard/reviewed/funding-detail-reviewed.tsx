'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  CircleCheck,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import {
  APPLICATION_CHECKLIST,
  ELIGIBILITY,
  type FundingMatch,
} from '@/lib/dashboard/funding-matches';
import { useFundingStore } from '@/stores/fundingStore';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

const PRIMARY_BTN =
  'inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-5 font-semibold text-mineral-white shadow-xs transition-opacity hover:opacity-90';
const SECONDARY_BTN =
  'inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 bg-mineral-white px-5 font-semibold text-carbon-black shadow-xs transition-colors hover:bg-muted';

function DetailActions({ id, mobile }: { id: string; mobile?: boolean }) {
  const saved = useFundingStore((s) => s.saved.includes(id));
  const toggleSaved = useFundingStore((s) => s.toggleSaved);
  const size = mobile ? 'text-body-sm' : 'text-body-md';
  const BookmarkIcon = saved ? BookmarkCheck : Bookmark;
  return (
    <div className={cn('flex items-center gap-4', mobile && 'flex-1')}>
      <button
        type='button'
        onClick={() => toggleSaved(id)}
        className={cn(SECONDARY_BTN, size, mobile && 'flex-1')}
      >
        <BookmarkIcon className='size-5' />
        {saved ? 'Saved' : 'Shortlist'}
      </button>
      <Link
        href={`${ROUTES.sme.fundingMatches}/${id}/apply`}
        className={cn(PRIMARY_BTN, size, mobile && 'flex-1')}
      >
        Start application
        <ArrowUpRight className='size-5' />
      </Link>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex flex-col text-body-sm lg:text-body-md'>
      <span className='text-gray-400'>{label}</span>
      <span className='text-mineral-white'>{value}</span>
    </div>
  );
}

export function FundingDetailReviewed({ match }: { match: FundingMatch }) {
  return (
    <DashboardShell
      title='Funding matches'
      subtitle='4 opportunities ranked by fit with your business, financial, sustainability and funding profile.'
      action={<DetailActions id={match.id} />}
    >
      {/* Mobile header actions (the header slot is desktop-only). */}
      <div className='flex lg:hidden'>
        <DetailActions id={match.id} mobile />
      </div>

      <Link
        href={ROUTES.sme.fundingMatches}
        className='inline-flex w-fit items-center gap-2 text-body-sm text-gray-700 lg:text-body-md'
      >
        <ArrowLeft className='size-4.5 lg:size-5.5' />
        Back to matches
      </Link>

      {/* Hero */}
      <div className='overflow-hidden rounded-2xl bg-primary p-6 text-mineral-white lg:p-7'>
        <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
          <div className='flex flex-col gap-3 lg:max-w-[55%] lg:gap-4'>
            <span className='inline-flex w-fit items-center rounded-2xl bg-refined-gold px-3 py-0.5 text-label-md font-normal text-carbon-black lg:text-body-sm lg:font-medium'>
              {match.fit}% match · {match.rating}
            </span>
            <div className='flex flex-col gap-0.5'>
              <h2 className='text-h4 font-semibold lg:text-h2'>
                {match.product}
              </h2>
              <p className='text-body-md text-gray-300 lg:text-h5'>
                {match.provider}
              </p>
            </div>
            <p className='text-body-sm text-gray-300 lg:text-body-lg lg:text-gray-400'>
              {match.reason}
            </p>
          </div>
          <div className='flex gap-12 lg:gap-24'>
            <div className='flex flex-col gap-4'>
              <KV label='Amount' value={match.amount} />
              <KV label='Indicative APR' value={match.apr} />
            </div>
            <div className='flex flex-col gap-4'>
              <KV label='Term' value={match.term} />
              <KV label='Minimum SFS score band' value={match.minBand} />
            </div>
          </div>
        </div>
      </div>

      {/* Checklist + eligibility */}
      <div className='flex flex-col gap-3 lg:flex-row'>
        {/* Application checklist */}
        <div className='flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 lg:flex-[1.4] lg:gap-6 lg:p-7'>
          <div className='flex flex-col gap-1'>
            <h3 className='text-body-md font-semibold text-carbon-black lg:text-h5'>
              Application checklist
            </h3>
            <p className='text-body-sm text-gray-500 lg:text-body-md'>
              Tick these off to submit a strong application. We already have
              three for you.
            </p>
          </div>
          <div className='flex flex-col gap-3'>
            {APPLICATION_CHECKLIST.map((item) => (
              <div
                key={item.label}
                className='flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3'
              >
                {item.done ? (
                  <CircleCheck className='size-5 shrink-0 text-success-600 lg:size-6' />
                ) : (
                  <span className='size-5 shrink-0 rounded-full border-2 border-primary lg:size-6' />
                )}
                <span
                  className={cn(
                    'text-body-sm text-carbon-black lg:text-body-md',
                    item.done && 'line-through',
                  )}
                >
                  {item.label}
                  {item.note && (
                    <span className='font-semibold text-warning-600'>
                      {item.note}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Eligibility summary */}
        <div className='flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 lg:flex-1 lg:gap-6 lg:p-7'>
          <div className='flex flex-col gap-1'>
            <h3 className='text-body-md font-semibold text-carbon-black lg:text-h5'>
              Eligibility summary
            </h3>
            <p className='text-body-sm text-gray-500 lg:text-body-md'>
              See how your business aligns with this funding product’s
              eligibility criteria.
            </p>
          </div>
          <div className='flex flex-col gap-2 lg:gap-3'>
            {ELIGIBILITY.map((e) => (
              <div key={e} className='flex items-center gap-3'>
                <CircleCheck className='size-5 shrink-0 text-success-600' />
                <span className='text-body-sm text-carbon-black lg:text-body-md'>
                  {e}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
