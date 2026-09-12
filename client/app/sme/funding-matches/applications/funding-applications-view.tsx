'use client';

import Link from 'next/link';
import { ArrowLeft, FileCheck2, Hourglass } from 'lucide-react';

import { ROUTES } from '@/lib/routes';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useReviewStore } from '@/stores/reviewStore';
import { FUNDING_MATCHES } from '@/lib/dashboard/funding-matches';
import { useFundingStore } from '@/stores/fundingStore';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardEmptyState } from '@/components/dashboard/empty-state';

function ApplicationsContent() {
  const appliedIds = useFundingStore((s) => s.applied);
  const applied = FUNDING_MATCHES.filter((m) => appliedIds.includes(m.id));

  return (
    <DashboardShell
      title='My applications'
      subtitle="Track the funding applications you've submitted."
    >
      <Link
        href={ROUTES.sme.fundingMatches}
        className='inline-flex w-fit items-center gap-2 text-body-sm text-gray-700 lg:text-body-md'
      >
        <ArrowLeft className='size-4.5 lg:size-5.5' />
        Back to matches
      </Link>

      {applied.length === 0 ? (
        <DashboardEmptyState
          icon={FileCheck2}
          title='No applications yet'
          body='Applications you submit from a funding match appear here so you can track their progress.'
          action={{
            label: 'Browse funding matches',
            href: ROUTES.sme.fundingMatches,
          }}
        />
      ) : (
        <div className='flex flex-col gap-3'>
          {applied.map((m) => (
            <Link
              key={m.id}
              href={`${ROUTES.sme.fundingMatches}/${m.id}`}
              className='flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-primary/40 lg:p-7'
            >
              <div className='flex flex-col gap-1'>
                <div className='flex flex-wrap items-center gap-3'>
                  <h3 className='text-body-lg font-semibold text-carbon-black lg:text-h5'>
                    {m.product}
                  </h3>
                  <span className='inline-flex items-center rounded-2xl bg-success-50 px-2.5 py-0.5 text-label-sm font-medium text-success-700 lg:text-body-sm'>
                    Submitted
                  </span>
                </div>
                <p className='text-body-sm text-gray-500 lg:text-body-md'>
                  {m.provider} · {m.amount}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

export function FundingApplicationsView() {
  const mounted = useMounted();
  const published = useReviewStore((s) => s.phase === 'published');

  if (mounted && published) return <ApplicationsContent />;

  return (
    <DashboardShell
      title='My applications'
      subtitle='Your funding applications will appear here once your assessment is reviewed and published.'
    >
      <DashboardEmptyState
        icon={Hourglass}
        title='Locked until review completes'
        body="Matches are held back until your ESG Specialist review is complete as we won't surface funders before your assessment review is complete."
        action={{ label: 'View review status', href: ROUTES.sme.dashboard }}
      />
    </DashboardShell>
  );
}
