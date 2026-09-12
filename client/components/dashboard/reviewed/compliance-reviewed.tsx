'use client';

import {
  CircleCheck,
  CircleMinus,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  COMPLIANCE_REPORT,
  type FrameworkCard,
  type FrameworkTone,
  type ReportPack,
} from '@/lib/dashboard/report-packs';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { ReportBackLink } from './report-primitives';

/** Framework status icon + tinted circle per tone. */
const TONE: Record<FrameworkTone, { icon: LucideIcon; bg: string; color: string }> =
  {
    warning: { icon: CircleMinus, bg: 'bg-warning-50', color: 'text-warning-800' },
    error: { icon: TriangleAlert, bg: 'bg-error-50', color: 'text-error-600' },
    success: { icon: CircleCheck, bg: 'bg-success-50', color: 'text-success-600' },
  };

function Card({ card }: { card: FrameworkCard }) {
  const { icon: Icon, bg, color } = TONE[card.tone];
  return (
    <div className='flex gap-3 rounded-2xl border border-gray-200 bg-white p-5 lg:gap-4 lg:p-7'>
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full lg:size-10',
          bg,
        )}
      >
        <Icon className={cn('size-4 lg:size-5', color)} />
      </span>

      <div className='flex flex-col gap-2'>
        {/* Mobile: badge above heading; desktop: heading then badge inline */}
        <div className='flex flex-col-reverse items-start gap-2 lg:flex-row lg:items-center lg:gap-3'>
          <h2 className='text-body-md font-semibold text-carbon-black lg:text-h4'>
            {card.heading}
          </h2>
          <span className='inline-flex shrink-0 items-center rounded-full bg-gray-100 px-3 py-1 text-label-sm font-medium text-gray-700 lg:text-body-sm'>
            {card.badge}
          </span>
        </div>

        <div className='flex flex-col gap-1'>
          {card.lines.map((line) => (
            <p
              key={line.label}
              className='text-body-sm text-gray-500 lg:text-body-lg'
            >
              <span className='font-semibold text-carbon-black'>
                {line.label}
              </span>
              {line.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Post-review Compliance & Regulatory pack: per-framework status cards. */
export function ComplianceReviewed({ pack }: { pack: ReportPack }) {
  return (
    <DashboardShell title={pack.name} subtitle={pack.pageSubtitle}>
      <ReportBackLink />

      {COMPLIANCE_REPORT.map((card) => (
        <Card key={card.heading} card={card} />
      ))}
    </DashboardShell>
  );
}
