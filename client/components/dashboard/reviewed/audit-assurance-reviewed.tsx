'use client';

import {
  Minus,
  OctagonAlert,
  Share,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  AUDIT_REPORT,
  type AuditChip,
  type AuditReport,
  type ReportPack,
} from '@/lib/dashboard/report-packs';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import {
  ReportBackLink,
  ReportBanner,
  ReportButton,
} from './report-primitives';

/** Round status icon-chip per row (evidence on file / self-declared / none). */
const CHIP: Record<AuditChip, { icon: LucideIcon; bg: string; color: string }> =
  {
    evidence: { icon: ShieldCheck, bg: 'bg-success-50', color: 'text-success-600' },
    partial: { icon: OctagonAlert, bg: 'bg-error-50', color: 'text-error-600' },
    none: { icon: Minus, bg: 'bg-gray-50', color: 'text-gray-500' },
  };

function Section({ section }: { section: AuditReport['sections'][number] }) {
  return (
    <div className='flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 lg:p-7'>
      <h2 className='text-body-md font-semibold text-carbon-black lg:text-h5'>
        {section.title}
      </h2>
      <div className='h-px w-full bg-gray-200' />

      <div className='flex flex-col'>
        {section.rows.map((row, i) => {
          const { icon: Icon, bg, color } = CHIP[row.chip];
          return (
            <div key={row.item}>
              {i > 0 && <div className='h-px w-full bg-gray-200' />}
              <div className='flex items-start justify-between gap-3 py-4'>
                <div className='flex gap-3'>
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full lg:size-10',
                      bg,
                    )}
                  >
                    <Icon className={cn('size-4 lg:size-5', color)} />
                  </span>
                  <div className='flex flex-col gap-0.5'>
                    <p className='text-body-sm font-semibold text-carbon-black lg:text-h5'>
                      {row.item}
                    </p>
                    <p className='text-label-md text-gray-500 lg:text-body-lg'>
                      {row.desc}
                    </p>
                  </div>
                </div>
                <span className='shrink-0 text-right text-label-md text-gray-500 lg:text-body-sm'>
                  {row.reliability}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Post-review Audit & Assurance pack: reliability banner + grouped checklist. */
export function AuditAssuranceReviewed({ pack }: { pack: ReportPack }) {
  const { banner, sections } = AUDIT_REPORT;
  return (
    <DashboardShell
      title={pack.name}
      subtitle={pack.pageSubtitle}
      action={<ReportButton icon={Share} label='Export pack' />}
    >
      {/* Mobile header action (the header slot is desktop-only). */}
      <ReportButton
        icon={Share}
        label='Export pack'
        mobile
        className='lg:hidden'
      />

      <ReportBackLink />

      <ReportBanner icon={ShieldCheck} title={banner.title} body={banner.body} />

      {sections.map((s) => (
        <Section key={s.title} section={s} />
      ))}
    </DashboardShell>
  );
}
