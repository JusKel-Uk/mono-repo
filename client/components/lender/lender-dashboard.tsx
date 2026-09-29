'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Inbox, Package, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { useLenderMe } from '@/lib/hooks/use-lender-me';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useLenderOnboardingStore } from '@/stores/lenderOnboardingStore';
import { LenderShell } from '@/components/lender/lender-shell';
import { LenderBadge, type LenderBadgeTone } from '@/components/lender/lender-badge';
import { LenderProgressRing } from '@/components/lender/lender-progress-ring';
import { LenderDisclaimer } from '@/components/lender/lender-disclaimer';

/* ---------------------------------------------------------------- demo data */
// No dashboard backend yet — this mirrors the Figma "populated" reference. Swap
// for GET /lender/dashboard data once the endpoint exists.

type Match = {
  name: string;
  badge: { label: string; tone: LenderBadgeTone };
  meta: string;
  status: { label: string; className: string };
  percent: number;
};

const MATCHES: Match[] = [
  {
    name: 'Pennine Print Co',
    badge: { label: 'NEW MATCH', tone: 'info' },
    meta: 'Retail · £25k – £250k · matched August 13, 2026, 13:19',
    status: { label: 'PROGRESSING', className: 'text-warning-600' },
    percent: 74,
  },
  {
    name: 'Flo Technologies',
    badge: { label: 'INTERESTED', tone: 'success' },
    meta: 'Technology · £25k – £250k · matched August 13, 2026, 12:50',
    status: { label: 'ADVANCED', className: 'text-success-600' },
    percent: 92,
  },
  {
    name: 'Honesty Foods Ltd',
    badge: { label: 'REVIEWING', tone: 'warning' },
    meta: 'Food & drink · £50k – £500k · matched August 1, 2026, 13:14',
    status: { label: 'ADVANCED', className: 'text-success-600' },
    percent: 88,
  },
];

const PIPELINE = [
  { label: 'NEW MATCH', count: 1, sub: 'Unreviewed matches' },
  { label: 'REVIEWING', count: 1, sub: 'Currently being assessed' },
  { label: 'INTERESTED', count: 1, sub: 'Matches you want to pursue' },
  { label: 'NOT INTERESTED', count: 1, sub: "Matches you won't pursue" },
  { label: 'ON HOLD', count: 1, sub: "Matches you're keeping for later" },
];

type Product = {
  name: string;
  meta: string;
  badge: { label: string; tone: LenderBadgeTone };
  matches: string;
};

const PRODUCTS: Product[] = [
  {
    name: 'Clean Growth Financing',
    meta: 'Green loan · £25k–£250k',
    badge: { label: 'ACTIVE', tone: 'success' },
    matches: '3 matches',
  },
  {
    name: 'Energy Efficiency Asset Finance',
    meta: 'Asset finance · £10k–£250k',
    badge: { label: 'ACTIVE', tone: 'success' },
    matches: '2 matches',
  },
  {
    name: 'SME Working Capital Facility',
    meta: 'Revolving credit facility · £25k–£150k',
    badge: { label: 'DRAFT', tone: 'neutral' },
    matches: '0 matches',
  },
];

/* ------------------------------------------------------------- primitives */

function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className='flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-5'>
      <p className='text-body-sm text-gray-700'>{label}</p>
      <p className='text-[40px] font-semibold leading-[52px] text-carbon-black'>
        {value}
      </p>
      <p className='text-label-md text-gray-700'>{sub}</p>
    </div>
  );
}

function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className='flex flex-col gap-1'>
      <div className='flex items-center justify-between gap-4'>
        <h2 className='text-h5 font-semibold text-carbon-black'>{title}</h2>
        {action && (
          <Link
            href={action.href}
            className='flex items-center gap-2 text-body-sm text-teal-charcoal'
          >
            {action.label}
            <ArrowRight className='size-5' />
          </Link>
        )}
      </div>
      <p className='text-body-md text-gray-500'>{subtitle}</p>
    </div>
  );
}

function MatchRow({ match }: { match: Match }) {
  return (
    <Link
      href={ROUTES.lender.matchedSmes}
      className='flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-7 py-7 transition-colors hover:border-gray-300'
    >
      <div className='flex min-w-0 flex-col gap-0.5'>
        <div className='flex flex-wrap items-center gap-3'>
          <span className='text-h4 font-semibold text-carbon-black'>
            {match.name}
          </span>
          <LenderBadge tone={match.badge.tone}>{match.badge.label}</LenderBadge>
        </div>
        <p className='text-body-md text-gray-600'>{match.meta}</p>
      </div>
      <div className='flex shrink-0 items-center gap-6 sm:gap-8'>
        <div className='hidden items-center gap-6 sm:flex'>
          <span
            className={cn(
              'text-right text-body-md font-semibold',
              match.status.className,
            )}
          >
            {match.status.label}
          </span>
          <LenderProgressRing percent={match.percent} />
        </div>
        <ArrowRight className='size-5.5 text-gray-500' />
      </div>
    </Link>
  );
}

function PipelineTile({
  label,
  count,
  sub,
}: {
  label: string;
  count: number;
  sub: string;
}) {
  return (
    <div className='flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-5'>
      <p className='text-body-sm text-gray-700'>{label}</p>
      <p className='text-[44px] font-semibold leading-[56px] text-carbon-black'>
        {count}
      </p>
      <p className='text-body-sm text-gray-700'>{sub}</p>
    </div>
  );
}

function EmptyCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className='flex flex-col items-center gap-5 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-20 text-center'>
      <Inbox className='size-12 text-gray-500' />
      <div className='flex max-w-137 flex-col gap-2'>
        <p className='text-h3 font-semibold text-carbon-black'>{title}</p>
        <p className='text-body-lg text-gray-500'>{body}</p>
      </div>
      <Link
        href={ROUTES.lender.fundingProducts}
        className='inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-base font-semibold text-mineral-white shadow-xs'
      >
        <Plus className='size-5' />
        Add a funding product
      </Link>
    </div>
  );
}

/* ---------------------------------------------------------------- sections */

function DashboardBody({ empty }: { empty: boolean }) {
  const stats = empty
    ? [
        { label: 'ACTIVE PRODUCTS', value: '0', sub: '0 in total' },
        { label: 'MATCHED SMEs', value: '0', sub: 'Consent-verified matches' },
        {
          label: 'IN PIPELINE',
          value: '0',
          sub: 'SMEs you’re reviewing or engaging',
        },
        { label: 'FUNDING RANGE', value: '—', sub: 'No active funding range' },
      ]
    : [
        { label: 'ACTIVE PRODUCTS', value: '2', sub: '3 in total' },
        { label: 'MATCHED SMEs', value: '4', sub: 'Consent-verified matches' },
        {
          label: 'IN PIPELINE',
          value: '2',
          sub: 'SMEs you’re reviewing or engaging',
        },
        {
          label: 'FUNDING RANGE',
          value: '£25k – £2M',
          sub: 'Across your active products',
        },
      ];

  return (
    <div className='flex flex-col gap-6'>
      {/* Stat tiles */}
      <div className='grid grid-cols-2 gap-2 lg:grid-cols-4'>
        {stats.map((s) => (
          <StatTile key={s.label} {...s} />
        ))}
      </div>

      {/* Matched SMEs */}
      <section className='flex flex-col gap-4'>
        <SectionHeading
          title='Matched SMEs'
          subtitle='Ranked by match relevance across your active products.'
          action={
            empty ? undefined : { label: 'See all', href: ROUTES.lender.matchedSmes }
          }
        />
        {empty ? (
          <EmptyCard
            title='No active funding products yet'
            body='Matching runs only against active funding products. Add at least one product to start seeing matched SMEs.'
          />
        ) : (
          <div className='flex flex-col gap-4'>
            {MATCHES.map((m) => (
              <MatchRow key={m.name} match={m} />
            ))}
          </div>
        )}
      </section>

      {/* Pipeline overview */}
      <section className='flex flex-col gap-4'>
        <SectionHeading
          title='Pipeline overview'
          subtitle='Track SMEs across your funding journey.'
        />
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5'>
          {PIPELINE.map((p) => (
            <PipelineTile
              key={p.label}
              label={p.label}
              count={empty ? 0 : p.count}
              sub={p.sub}
            />
          ))}
        </div>
      </section>

      {/* Funding products */}
      <section className='flex flex-col gap-4'>
        <SectionHeading
          title='Funding products'
          subtitle='Define what you fund and the criteria used to match you with relevant SMEs.'
          action={{ label: 'Manage', href: ROUTES.lender.fundingProducts }}
        />
        {empty ? (
          <EmptyCard
            title='No funding products yet'
            body='Add a funding product to define what you fund and which SMEs you want to be matched with. You can save a product as a draft before activating it.'
          />
        ) : (
          <div className='rounded-2xl border border-gray-200 bg-white px-7 py-7'>
            {PRODUCTS.map((p, i) => (
              <div key={p.name}>
                {i > 0 && <div className='my-[18px] h-px w-full bg-gray-200' />}
                <div className='flex items-center justify-between gap-4'>
                  <div className='flex min-w-0 flex-col gap-2'>
                    <p className='text-body-md text-carbon-black'>{p.name}</p>
                    <p className='text-body-sm text-gray-600'>{p.meta}</p>
                  </div>
                  <div className='flex shrink-0 items-center gap-5'>
                    <LenderBadge tone={p.badge.tone}>{p.badge.label}</LenderBadge>
                    <span className='text-right text-body-sm text-gray-500'>
                      {p.matches}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <LenderDisclaimer />
    </div>
  );
}

/* -------------------------------------------------------------------- view */

/**
 * The lender Dashboard screen. Renders inside the portal shell with a header
 * greeting derived from the signed-in lender. Append `?state=empty` to preview
 * the pre-activation empty state.
 */
export function LenderDashboardView() {
  const { data } = useLenderMe();
  const params = useSearchParams();
  // A newly-onboarded lender sees the empty dashboard; established lenders see
  // the populated one. `?state=empty` forces the empty state for previews.
  // Gate on mount so SSR matches (store rehydrates client-side).
  const mounted = useMounted();
  const userType = useLenderOnboardingStore((s) => s.userType);
  const empty = params.get('state') === 'empty' || (mounted && userType === 'new');

  const firstName = data?.firstName?.trim();
  const orgName = data?.organisation.name ?? '';
  const title = firstName ? `Welcome back, ${firstName}` : 'Welcome back';
  const subtitle = orgName || 'Lender portal';

  return (
    <LenderShell
      title={title}
      subtitle={subtitle}
      action={
        <Link
          href={ROUTES.lender.fundingProducts}
          className='inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-base font-semibold text-mineral-white shadow-xs'
        >
          <Package className='size-5' />
          Manage products
        </Link>
      }
    >
      <DashboardBody empty={empty} />
    </LenderShell>
  );
}
