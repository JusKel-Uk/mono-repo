'use client';

import { cn } from '@/lib/utils';
import { ScoreGauge } from './score-gauge';

const CARD = 'rounded-2xl border border-gray-200 bg-white';

/* ---------- big number "80 / 100" ---------- */
function BigScore({ value, max = 100 }: { value: number; max?: number }) {
  return (
    <p className='whitespace-nowrap font-semibold text-carbon-black'>
      <span className='text-[56px] leading-18'>{value}</span>
      <span className='text-[40px] leading-13'> </span>
      <span className='text-[20px] font-normal leading-7 text-gray-500'>
        / {max}
      </span>
    </p>
  );
}

/* ---------- compact score card (Banking / Financial / Funding / Confidence) ---------- */
function ScoreCard({
  label,
  desc,
  value,
  max = 100,
  tier,
  className,
}: {
  label: string;
  desc: string;
  value: number;
  max?: number;
  tier: string;
  className?: string;
}) {
  return (
    <div className={cn(CARD, 'w-full overflow-hidden p-3.75', className)}>
      <div className='flex h-full flex-col justify-between gap-5'>
        <div className='flex flex-col gap-0.5'>
          <p className='text-label-lg font-semibold text-carbon-black'>
            {label}
          </p>
          <p className='text-label-md text-gray-500'>{desc}</p>
        </div>
        <div className='flex items-end justify-between'>
          <BigScore value={value} max={max} />
          <p className='text-body-sm text-right text-success-600'>{tier}</p>
        </div>
      </div>
    </div>
  );
}

const ESG_BREAKDOWN = [
  { label: 'Environmental', value: '74 / 100' },
  { label: 'Social', value: '79 / 100' },
  { label: 'Governance', value: '84 / 100' },
];

/**
 * The six-card Sustainability-Finance score summary (Overall gauge, ESG with
 * E/S/G breakdown, and the Banking / Financial / Funding / Confidence cluster).
 * Shared by the Dashboard overview and the Reports hub — both render the exact
 * same grid, so it lives here once.
 */
export function ScoreSummaryGrid() {
  return (
    <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4'>
      <div className='flex min-h-86 flex-col gap-5 overflow-hidden rounded-2xl border border-gray-200 bg-primary p-3.75 sm:col-span-2 xl:col-span-1 xl:row-span-2'>
        <p className='text-center text-label-md font-semibold text-mineral-white'>
          OVERALL SUSTAINABILITY FINANCE SCORE
        </p>
        <div className='mx-auto flex w-full max-w-74 flex-col items-center gap-2'>
          <ScoreGauge />
          <div className='flex w-full flex-col items-center gap-2 text-center'>
            <p className='whitespace-nowrap font-semibold text-mineral-white'>
              <span className='text-[56px] leading-18'>80</span>
              <span className='text-[40px] leading-13'> </span>
              <span className='text-[20px] font-normal leading-7 text-gray-400'>
                / 100
              </span>
            </p>
            <div className='flex w-full flex-col items-center gap-1'>
              <p className='text-h6 font-semibold text-mineral-white'>
                ADVANCED
              </p>
              <p className='text-label-md text-gray-300'>
                Integrated assessment of sustainability capability, financial
                resilience, and banking behaviour.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ESG Intelligence + breakdown (spans both rows on wide) */}
      <div
        className={cn(
          CARD,
          'flex min-h-86 flex-col gap-5 overflow-hidden p-3.75 sm:col-span-2 xl:col-span-1 xl:row-span-2',
        )}
      >
        <div className='flex flex-col gap-0.5'>
          <p className='text-label-lg font-semibold text-carbon-black'>
            ESG INTELLIGENCE SCORE
          </p>
          <p className='text-label-md text-gray-500'>
            Your ESG score is gotten from combining your Environmental + Social +
            Governance scores together.
          </p>
        </div>
        <div className='flex flex-1 flex-col justify-between gap-7'>
          <div className='flex items-end justify-between'>
            <BigScore value={80} />
            <p className='text-body-sm text-right text-success-600'>ADVANCED</p>
          </div>
          <div className='flex flex-col gap-2 rounded-2xl border border-gray-700 bg-primary p-3.75'>
            {ESG_BREAKDOWN.map((r, i) => (
              <div key={r.label} className='flex flex-col gap-2'>
                {i > 0 && <div className='h-px w-full bg-gray-700' />}
                <div className='flex items-center justify-between text-label-md font-medium text-mineral-white'>
                  <span>{r.label}</span>
                  <span>{r.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2×2 compact cluster — each fills one grid cell */}
      <ScoreCard
        className='min-h-39.75'
        label='BANKING INTELLIGENCE SCORE'
        desc='Banking Behaviour and Relationships.'
        value={80}
        tier='ADVANCED'
      />
      <ScoreCard
        className='min-h-39.75'
        label='FINANCIAL INTELLIGENCE SCORE'
        desc='Financial Health and Resilience.'
        value={80}
        tier='ADVANCED'
      />
      <ScoreCard
        className='min-h-44.45'
        label='FUNDING READINESS INDEX'
        desc={`Indicates your business's preparedness to engage with lenders and investors.`}
        value={78}
        tier='READY'
      />
      <ScoreCard
        className='min-h-44.45'
        label='SCORE CONFIDENCE'
        desc='Your confidence level is based on the quality and completeness of your evidence.'
        value={85}
        tier='HIGH'
      />
    </div>
  );
}
