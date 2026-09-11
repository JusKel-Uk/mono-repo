'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Bookmark, Trash2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { FUNDING_MATCHES, type FundingMatch } from '@/lib/dashboard/funding-matches';
import { useFundingStore } from '@/stores/fundingStore';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardEmptyState } from '@/components/dashboard/empty-state';

const PRIMARY_BTN =
  'inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-5 text-body-sm font-semibold text-mineral-white shadow-xs transition-opacity hover:opacity-90 lg:text-body-md';
const SECONDARY_BTN =
  'inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 bg-mineral-white px-5 text-body-sm font-semibold text-carbon-black shadow-xs transition-colors hover:bg-muted lg:text-body-md';

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className='text-gray-400'>{label} </span>
      <span className='text-carbon-black'>{value}</span>
    </span>
  );
}

function SavedCard({ m }: { m: FundingMatch }) {
  const remove = useFundingStore((s) => s.toggleSaved);
  return (
    <div className='flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 lg:gap-6 lg:p-7'>
      <div className='flex items-start justify-between gap-4'>
        <div className='flex flex-col gap-1 lg:gap-2'>
          <p className='text-body-sm text-gray-400 uppercase lg:text-body-lg'>
            {m.provider}
          </p>
          <h3 className='text-h5 font-semibold text-carbon-black lg:text-h3'>
            {m.product}
          </h3>
          <p className='text-body-sm text-gray-400 lg:text-body-lg'>
            {m.reason}
          </p>
          <div className='mt-1 flex flex-wrap gap-x-6 gap-y-1 text-body-sm lg:text-body-md'>
            <Meta label='Match' value={`${m.fit}%`} />
            <Meta label='Amount' value={m.amount} />
            <Meta label='APR' value={m.apr} />
          </div>
        </div>
        <button
          type='button'
          onClick={() => remove(m.id)}
          aria-label={`Remove ${m.product} from saved`}
          className='shrink-0 text-gray-500 transition-colors hover:text-carbon-black'
        >
          <Trash2 className='size-5 lg:size-6' />
        </button>
      </div>

      <div className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
        <Link href={`${ROUTES.sme.fundingMatches}/${m.id}`} className={SECONDARY_BTN}>
          View details
        </Link>
        <Link
          href={`${ROUTES.sme.fundingMatches}/${m.id}/apply`}
          className={PRIMARY_BTN}
        >
          Start application
          <ArrowUpRight className='size-5' />
        </Link>
      </div>
    </div>
  );
}

export function FundingSavedReviewed() {
  const savedIds = useFundingStore((s) => s.saved);
  const saved = FUNDING_MATCHES.filter((m) => savedIds.includes(m.id));
  const count = saved.length;

  return (
    <DashboardShell
      title='Saved funding matches'
      subtitle={
        count === 0
          ? 'You have not shortlisted anything yet.'
          : `${count} funding ${count === 1 ? 'match' : 'matches'} shortlisted for later review.`
      }
    >
      <Link
        href={ROUTES.sme.fundingMatches}
        className='inline-flex w-fit items-center gap-2 text-body-sm text-gray-700 lg:text-body-md'
      >
        <ArrowLeft className='size-4.5 lg:size-5.5' />
        Back to matches
      </Link>

      {count === 0 ? (
        <DashboardEmptyState
          icon={Bookmark}
          title='No saved funding matches yet'
          body="When you find a match you would like to revisit, tap the Shortlist button. It will be saved here so you can compare and apply when you're ready."
          action={{
            label: 'Browse funding matches',
            href: ROUTES.sme.fundingMatches,
          }}
        />
      ) : (
        <div className={cn('flex flex-col gap-3')}>
          {saved.map((m) => (
            <SavedCard key={m.id} m={m} />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
