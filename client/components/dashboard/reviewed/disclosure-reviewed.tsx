'use client';

import { Download, Eye, TriangleAlert } from 'lucide-react';

import { cn } from '@/lib/utils';
import { DISCLOSURE_REPORT, type ReportPack } from '@/lib/dashboard/report-packs';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import {
  ReportBackLink,
  ReportBanner,
  ReportButton,
  StatusPill,
} from './report-primitives';

const COLS =
  'grid-cols-[minmax(0,1fr)_auto_minmax(72px,auto)] lg:grid-cols-[minmax(0,1fr)_minmax(0,200px)_minmax(0,240px)]';

/** Post-review Disclosure pack: readiness stats + a labelled item table. */
export function DisclosureReviewed({ pack }: { pack: ReportPack }) {
  const { stats, banner, items } = DISCLOSURE_REPORT;
  return (
    <DashboardShell
      title={pack.name}
      subtitle={pack.pageSubtitle}
      action={
        <div className='flex items-center gap-3'>
          <ReportButton icon={Eye} label='Preview' variant='secondary' />
          <ReportButton icon={Download} label='Download' />
        </div>
      }
    >
      {/* Mobile header actions (the header slot is desktop-only). */}
      <div className='flex gap-3 lg:hidden'>
        <ReportButton
          icon={Eye}
          label='Preview'
          variant='secondary'
          mobile
          className='flex-1'
        />
        <ReportButton icon={Download} label='Download' mobile className='flex-1' />
      </div>

      <ReportBackLink />

      {/* Readiness stats */}
      <div className='grid grid-cols-3 gap-2'>
        {stats.map((s) => (
          <div
            key={s.label}
            className='flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-4 lg:p-5'
          >
            <p className='min-h-8 text-label-md text-gray-700 lg:min-h-0 lg:text-body-sm'>
              {s.label}
            </p>
            <p className='text-[40px] font-semibold leading-[52px] text-carbon-black lg:text-[44px] lg:leading-[56px]'>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <ReportBanner icon={TriangleAlert} title={banner.title} body={banner.body} />

      {/* Disclosure items table */}
      <div className='rounded-2xl border border-gray-200 bg-white p-5 lg:p-7'>
        <div
          className={cn(
            'grid items-center gap-3 text-body-sm text-gray-500 lg:gap-4 lg:text-body-md',
            COLS,
          )}
        >
          <span>DISCLOSURE ITEM</span>
          <span>STATUS</span>
          <span className='text-right'>SOURCE</span>
        </div>
        <div className='mt-4 h-px w-full bg-gray-200' />

        <div className='flex flex-col'>
          {items.map((row, i) => (
            <div key={row.item}>
              {i > 0 && <div className='h-px w-full bg-gray-200' />}
              <div className={cn('grid items-center gap-3 py-4 lg:gap-4', COLS)}>
                <span className='text-body-sm text-carbon-black lg:text-body-md lg:font-medium'>
                  {row.item}
                </span>
                <span>
                  <StatusPill {...row.status} />
                </span>
                <span className='text-right text-body-sm text-carbon-black lg:text-body-md'>
                  {row.source}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
