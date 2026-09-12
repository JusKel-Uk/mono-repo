'use client';

import Link from 'next/link';
import { MoveRight } from 'lucide-react';

import { REPORT_PACKS, reportPackHref } from '@/lib/dashboard/report-packs';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { ScoreSummaryGrid } from './score-summary';

/** Post-review Reports hub: score summary + the four report/disclosure packs. */
export function ReportsReviewed() {
  return (
    <DashboardShell
      title='Reports & disclosures'
      subtitle='Generate structured reports and disclosure outputs using the information and evidence already in your profile.'
    >
      <ScoreSummaryGrid />

      <div className='grid gap-4 md:grid-cols-2'>
        {REPORT_PACKS.map(({ slug, icon: Icon, name, cardDesc }) => (
          <Link
            key={slug}
            href={reportPackHref(slug)}
            className='flex items-center justify-between gap-3 rounded-lg border border-gray-300 bg-white p-5 transition-colors hover:border-primary/40'
          >
            <div className='flex items-center gap-3'>
              <span className='flex size-12 shrink-0 items-center justify-center rounded-lg bg-gray-200'>
                <Icon className='size-7 text-carbon-black' />
              </span>
              <div className='flex flex-col gap-0.5'>
                <p className='text-body-md lg:text-h6 font-semibold text-carbon-black'>
                  {name}
                </p>
                <p className='text-body-sm text-gray-500'>{cardDesc}</p>
              </div>
            </div>
            <MoveRight className='size-6 shrink-0 text-carbon-black' />
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
