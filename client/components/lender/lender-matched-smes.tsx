'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, Inbox, Plus, Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useLenderOnboardingStore } from '@/stores/lenderOnboardingStore';
import { LenderShell } from '@/components/lender/lender-shell';
import { LenderBadge, type LenderBadgeTone } from '@/components/lender/lender-badge';
import { LenderProgressRing } from '@/components/lender/lender-progress-ring';
import { LenderDisclaimer } from '@/components/lender/lender-disclaimer';

/* ---------------------------------------------------------------- demo data */
// No matching backend yet — mirrors the Figma "populated" reference.

type MatchStatus =
  | 'New match'
  | 'Interested'
  | 'Reviewing'
  | 'On hold'
  | 'Not interested'
  | 'Consent withdrawn';

const STATUS_TONE: Record<MatchStatus, LenderBadgeTone> = {
  'New match': 'info',
  Interested: 'success',
  Reviewing: 'warning',
  'On hold': 'neutral',
  'Not interested': 'neutral',
  'Consent withdrawn': 'error',
};

export type MatchedSme = {
  id: string;
  name: string;
  sector: string;
  status: MatchStatus;
  description: string;
  needs: string;
  readiness: string;
  sfs: number;
  updated: string;
  percent: number;
};

export const MATCHED_SMES: MatchedSme[] = [
  {
    id: 'flo-technologies',
    name: 'Flo Technologies',
    sector: 'Technology',
    status: 'Interested',
    description:
      'Turnover band, trading history and green use-of-funds align with Clean Growth criteria. Energy evidence verified by an ESG Specialist.',
    needs: '£25k – £250k',
    readiness: 'Ready',
    sfs: 80,
    updated: 'Updated August 18, 2026, 13:25',
    percent: 92,
  },
  {
    id: 'pennine-print-co',
    name: 'Pennine Print Co',
    sector: 'Textile',
    status: 'New match',
    description:
      'Working-capital need matches facility size. Sustainability evidence is partial — two sections carry specialist notes.',
    needs: '£25k – £250k',
    readiness: 'Ready',
    sfs: 70,
    updated: 'Updated August 18, 2026, 13:47',
    percent: 74,
  },
  {
    id: 'honesty-foods-ltd',
    name: 'Honesty Foods Ltd',
    sector: 'Food & drink',
    status: 'Reviewing',
    description:
      'Strong verified sustainability position with refrigeration retrofit plan. Sits at the upper end of your funding range.',
    needs: '£50k – £500k',
    readiness: 'Ready',
    sfs: 82,
    updated: 'Updated August 18, 2026, 13:52',
    percent: 88,
  },
  {
    id: 'hartley-companies',
    name: 'Hartley Companies',
    sector: 'Retail',
    status: 'On hold',
    description:
      'Fleet electrification plan fits Energy Efficiency Asset Finance. Carbon evidence is partial — one section carries specialist notes.',
    needs: '£50k – £500k',
    readiness: 'Ready',
    sfs: 75,
    updated: 'Updated August 18, 2026, 14:14',
    percent: 80,
  },
  {
    id: 'cobalt-logistics-ltd',
    name: 'Cobalt Logistics Ltd',
    sector: 'Logistics',
    status: 'Not interested',
    description:
      'Funding need fits, but readiness is low: fleet emissions data is incomplete and governance evidence is outstanding.',
    needs: '£100k – £250k',
    readiness: 'Not Ready',
    sfs: 41,
    updated: 'Updated August 18, 2026, 14:01',
    percent: 48,
  },
  {
    id: 'ravenscar-joinery-ltd',
    name: 'Ravenscar Joinery Ltd',
    sector: 'Construction',
    status: 'Consent withdrawn',
    description:
      'This SME has withdrawn consent to share their information with your organisation. Their summary and application details are no longer available to you. No further action is required.',
    needs: '',
    readiness: '',
    sfs: 0,
    updated: 'Updated August 18, 2026, 14:25',
    percent: 0,
  },
];

const NO_MATCHES: MatchedSme[] = [];

const STATUS_FILTERS: ('All statuses' | MatchStatus)[] = [
  'All statuses',
  'New match',
  'Interested',
  'Reviewing',
  'On hold',
  'Not interested',
  'Consent withdrawn',
];

/* ------------------------------------------------------------- primitives */

function MatchCard({ sme }: { sme: MatchedSme }) {
  const withdrawn = sme.status === 'Consent withdrawn';

  const body = (
    <div className='flex items-start justify-between gap-6'>
      <div className='flex min-w-0 flex-col gap-2'>
        <div className='flex flex-wrap items-center gap-3'>
          <span className='text-h4 font-semibold text-carbon-black'>
            {sme.name}
          </span>
          <LenderBadge tone='neutral'>{sme.sector}</LenderBadge>
          <LenderBadge tone={STATUS_TONE[sme.status]}>
            {sme.status.toUpperCase()}
          </LenderBadge>
        </div>
        <p className='text-body-md text-gray-600'>{sme.description}</p>
        {!withdrawn && (
          <>
            <p className='text-body-md text-gray-600'>
              Needs {sme.needs} · Readiness: {sme.readiness} · SFS score:{' '}
              {sme.sfs}
            </p>
            <p className='text-body-sm text-gray-500'>{sme.updated}</p>
          </>
        )}
        {withdrawn && (
          <p className='text-body-sm text-gray-500'>{sme.updated}</p>
        )}
      </div>
      {!withdrawn && (
        <div className='flex shrink-0 items-center gap-6'>
          <LenderProgressRing percent={sme.percent} />
          <ArrowRight className='size-5.5 text-gray-500' />
        </div>
      )}
    </div>
  );

  if (withdrawn) {
    return (
      <div className='rounded-2xl border border-gray-200 bg-white px-7 py-7 opacity-80'>
        {body}
      </div>
    );
  }

  return (
    <Link
      href={`${ROUTES.lender.matchedSmes}/${sme.id}`}
      className='block rounded-2xl border border-gray-200 bg-white px-7 py-7 transition-colors hover:border-gray-300'
    >
      {body}
    </Link>
  );
}

/* -------------------------------------------------------------------- view */

/**
 * Matched SMEs list. Search + status filter run client-side over demo data
 * (no matching endpoint yet). Cards link to the SME summary read-view.
 */
export function LenderMatchedSmesView() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'All statuses' | MatchStatus>(
    'All statuses',
  );

  // A newly-onboarded lender has no active products, so no matches yet.
  const mounted = useMounted();
  const userType = useLenderOnboardingStore((s) => s.userType);
  const source = mounted && userType === 'new' ? NO_MATCHES : MATCHED_SMES;

  const filtered = useMemo(
    () =>
      source.filter((s) => {
        const q = query.trim().toLowerCase();
        const matchesQuery =
          s.name.toLowerCase().includes(q) ||
          s.sector.toLowerCase().includes(q);
        const matchesStatus =
          status === 'All statuses' || s.status === status;
        return matchesQuery && matchesStatus;
      }),
    [source, query, status],
  );

  return (
    <LenderShell
      title='Matched SMEs'
      subtitle='SMEs surfaced by the matching engine against your active funding products. Consent-based and confidential.'
    >
      {source.length === 0 ? (
        <div className='flex flex-col gap-6'>
          <div className='flex flex-col items-center gap-5 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-20 text-center'>
            <Inbox className='size-12 text-gray-500' />
            <div className='flex max-w-137 flex-col gap-2'>
              <p className='text-h3 font-semibold text-carbon-black'>
                No matched SMEs yet
              </p>
              <p className='text-body-lg text-gray-500'>
                Matching runs only against active funding products. Add at least
                one product to start seeing matched SMEs.
              </p>
            </div>
            <Link
              href={`${ROUTES.lender.fundingProducts}/new`}
              className='inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-base font-semibold text-mineral-white shadow-xs'
            >
              <Plus className='size-5' />
              Add a funding product
            </Link>
          </div>
          <LenderDisclaimer />
        </div>
      ) : (
      <div className='flex flex-col gap-6'>
        {/* Toolbar */}
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='relative flex-1'>
            <Search className='pointer-events-none absolute left-4 top-1/2 size-6 -translate-y-1/2 text-gray-500' />
            <input
              type='search'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search SME or sector'
              aria-label='Search SME or sector'
              className='h-14 w-full rounded-xl border border-gray-300 bg-white pl-13 pr-4 text-body-md text-carbon-black placeholder:text-gray-500 focus:border-teal-charcoal focus:outline-none'
            />
          </div>
          <div className='relative sm:w-80'>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as 'All statuses' | MatchStatus)
              }
              aria-label='Filter by status'
              className='h-14 w-full appearance-none rounded-xl border border-gray-300 bg-primary px-4 pr-11 text-body-md text-mineral-white focus:outline-none'
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className='pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-mineral-white' />
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <p className='rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-body-md text-gray-500'>
            No matched SMEs found.
          </p>
        ) : (
          <div className={cn('flex flex-col gap-3')}>
            {filtered.map((s) => (
              <MatchCard key={s.id} sme={s} />
            ))}
          </div>
        )}

        <LenderDisclaimer />
      </div>
      )}
    </LenderShell>
  );
}
