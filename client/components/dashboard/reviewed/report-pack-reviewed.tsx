'use client';

import { Download, OctagonAlert } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  type EvidenceStatus,
  type Pill,
  type ReportPack,
  type ReportSection,
} from '@/lib/dashboard/report-packs';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import {
  ReportBackLink,
  ReportBanner,
  ReportButton,
  StatusPill,
} from './report-primitives';

const COLS = 'lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.7fr)_minmax(0,1fr)_150px]';

const ESG_PILL: Record<EvidenceStatus, Pill> = {
  'self-declared': { label: 'Self-declared', tone: 'warning' },
  'evidence-backed': { label: 'Evidence-backed', tone: 'teal' },
  verified: { label: 'Verified', tone: 'success' },
  missing: { label: 'Missing', tone: 'error' },
};

function Section({ section }: { section: ReportSection }) {
  const { icon: Icon, title, rows } = section;
  return (
    <div className='flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 lg:p-7'>
      <div className='flex items-center gap-3'>
        <Icon className='size-4 text-carbon-black lg:size-6' />
        <h2 className='text-body-md font-medium text-carbon-black lg:text-h5 lg:font-semibold'>
          {title}
        </h2>
      </div>

      {/* Column headers (desktop only) */}
      <div
        className={cn(
          'hidden gap-4 text-body-md font-medium text-gray-500 lg:grid',
          COLS,
        )}
      >
        <span>METRIC</span>
        <span>RESPONSE</span>
        <span>SOURCE</span>
        <span className='text-right'>EVIDENCE STATUS</span>
      </div>
      <div className='hidden h-px w-full bg-gray-200 lg:block' />

      <div className='flex flex-col gap-4'>
        {rows.map((row, i) => (
          <div key={row.metric} className='flex flex-col gap-4'>
            {i > 0 && <div className='h-px w-full bg-gray-200' />}

            {/* Desktop: 4-column row */}
            <div className={cn('hidden items-center gap-4 lg:grid', COLS)}>
              <span className='text-body-md font-medium text-carbon-black'>
                {row.metric}
              </span>
              <span className='text-body-md text-carbon-black'>
                {row.response}
              </span>
              <span className='text-body-md text-carbon-black'>
                {row.source}
              </span>
              <span className='flex justify-end'>
                <StatusPill {...ESG_PILL[row.status]} />
              </span>
            </div>

            {/* Mobile: stacked */}
            <div className='flex flex-col gap-2 lg:hidden'>
              <div className='flex items-start justify-between gap-3'>
                <span className='text-body-sm font-medium text-carbon-black'>
                  {row.metric}
                </span>
                <StatusPill {...ESG_PILL[row.status]} />
              </div>
              <div className='flex flex-wrap items-center gap-x-2 gap-y-1 text-body-sm text-gray-500'>
                <span className='text-carbon-black'>{row.response}</span>
                <span aria-hidden>·</span>
                <span>{row.source}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Post-review report pack: disclaimer + evidence-labelled section tables. */
export function ReportPackReviewed({
  pack,
  sections,
}: {
  pack: ReportPack;
  sections: ReportSection[];
}) {
  return (
    <DashboardShell
      title={pack.name}
      subtitle={pack.pageSubtitle}
      action={<ReportButton icon={Download} label='Download PDF' />}
    >
      {/* Mobile header action (the header slot is desktop-only). */}
      <ReportButton
        icon={Download}
        label='Download PDF'
        mobile
        className='lg:hidden'
      />

      <ReportBackLink />

      <ReportBanner
        icon={OctagonAlert}
        title='Kindly note that this is platform-generated and not a formal audit'
        body='This report reuses your assessment answers and confirmed evidence. Each row is labelled self-declared, evidence-backed, or verified so your recipients can weigh confidence.'
      />

      {sections.map((s) => (
        <Section key={s.title} section={s} />
      ))}
    </DashboardShell>
  );
}
