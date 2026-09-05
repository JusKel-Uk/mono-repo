'use client';

import Link from 'next/link';
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  TrendingDown,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
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

const COUNTDOWN = [
  { value: '28', unit: 'DAYS' },
  { value: '15', unit: 'HOURS' },
  { value: '15', unit: 'MINUTES' },
  { value: '28', unit: 'SECONDS' },
];

const PRIORITY_ACTIONS = [
  {
    title: 'Complete Scope 3 supplier emissions survey',
    points: 'Est. +8 pts',
    eta: '≈ 2 weeks',
    impact: 'High impact',
    impactClass: 'border-error-100 bg-error-50 text-error-600',
  },
  {
    title: 'Switch to certified renewable electricity tariff',
    points: 'Est. +12 pts',
    eta: '≈ 3 weeks',
    impact: 'Medium impact',
    impactClass: 'border-warning-100 bg-warning-50 text-warning-600',
  },
];

const FUNDING_MATCHES = [
  {
    name: 'British Business Bank',
    tag: 'Loan',
    detail: 'Growth Guarantee Scheme · £25,000-£250,000 · 7.9-11.4% APR',
    pct: '92%',
    fit: 'Strong',
  },
  {
    name: 'Lloyds Bank',
    tag: 'Green Loan',
    detail: 'Clean Growth Financing · £50,000-£500,000 · 6.4-9.2% APR',
    pct: '88%',
    fit: 'Strong',
  },
  {
    name: 'Innovate UK',
    tag: 'Grant',
    detail: 'Smart Grants for Sustainability · £25,000-£100,000',
    pct: '74%',
    fit: 'Good',
  },
];

const CARBON_BARS = [
  { m: 'Jan', h: 168 },
  { m: 'Feb', h: 128 },
  { m: 'Mar', h: 112 },
  { m: 'Apr', h: 96 },
  { m: 'May', h: 80 },
  { m: 'Jun', h: 64 },
  { m: 'Jul', h: 48, gold: true },
  { m: 'Aug', h: 2 },
  { m: 'Sep', h: 2 },
  { m: 'Oct', h: 2 },
  { m: 'Nov', h: 2 },
  { m: 'Dec', h: 2 },
];

export function DashboardOverview({ greeting }: { greeting: string }) {
  return (
    <DashboardShell
      title={greeting}
      subtitle={`Here's what your Sustainability Finance score currently looks like.`}
      notifications={2}
    >
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
              Your ESG score is gotten from combining your Environmental +
              Social + Governance scores together.
            </p>
          </div>
          <div className='flex flex-1 flex-col justify-between gap-7'>
            <div className='flex items-end justify-between'>
              <BigScore value={80} />
              <p className='text-body-sm text-right text-success-600'>
                ADVANCED
              </p>
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

      {/* ---------- Recalc + Priority actions ---------- */}
      <div className='flex flex-col gap-3 xl:flex-row'>
        {/* Next recalculation */}
        <div className={cn(CARD, 'min-h-81 p-7 xl:flex-[1.4]')}>
          <div className='flex flex-col gap-6'>
            <div className='flex flex-col gap-2'>
              <p className='text-body-lg text-gray-400'>
                YOUR NEXT SFS RECALCULATION
              </p>
              <p className='text-h3 font-semibold text-carbon-black'>
                Your SFS score refreshes on September 1
              </p>
              <p className='text-body-lg text-gray-400'>
                Validated changes to your assessment may affect your next
                Sustainability Finance Score and refresh the funding
                opportunities matched to your profile.
              </p>
            </div>
            <div className='flex gap-4'>
              {COUNTDOWN.map((c) => (
                <div
                  key={c.unit}
                  className='flex h-27 flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-gray-200 bg-abyssal text-center'
                >
                  <p className='text-h4 font-semibold text-mineral-white'>
                    {c.value}
                  </p>
                  <p className='text-body-md text-gray-300'>{c.unit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Priority actions */}
        <div
          className={cn(
            CARD,
            'flex min-h-81 flex-col justify-between p-7 xl:flex-1',
          )}
        >
          <div className='flex flex-col gap-5'>
            <div className='flex items-center justify-between gap-4'>
              <p className='text-body-md font-medium text-primary'>
                Do these before September 1
              </p>
              <p className='text-body-sm text-right text-gray-500'>
                PRIORITY ACTIONS
              </p>
            </div>
            <div className={cn(CARD, 'flex flex-col gap-4 p-3.75')}>
              {PRIORITY_ACTIONS.map((a, i) => (
                <div key={a.title} className='flex flex-col gap-4'>
                  {i > 0 && <div className='h-px w-full bg-gray-200' />}
                  <div className='flex flex-col gap-2'>
                    <div className='flex items-center justify-between gap-4'>
                      <p className='text-body-md text-carbon-black'>
                        {a.title}
                      </p>
                      <p className='shrink-0 text-body-sm text-right text-success-600'>
                        {a.points}
                      </p>
                    </div>
                    <div className='flex items-center gap-3'>
                      <p className='text-body-sm text-gray-400'>{a.eta}</p>
                      <span
                        className={cn(
                          'inline-flex h-6 items-center rounded-full border px-3 text-label-sm font-medium',
                          a.impactClass,
                        )}
                      >
                        {a.impact}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Link
            href={ROUTES.sme.recommendations}
            className='mt-5 flex items-center gap-2 self-end text-body-md text-carbon-black'
          >
            Check recommendations
            <ArrowRight className='size-5.5' />
          </Link>
        </div>
      </div>

      {/* ---------- Top funding matches + Carbon ---------- */}
      <div className='flex flex-col gap-3 xl:flex-row'>
        {/* Top funding matches */}
        <div className={cn(CARD, 'min-h-83.5 p-7 xl:flex-2')}>
          <div className='flex flex-col gap-4.5'>
            <div className='flex items-center justify-between'>
              <p className='text-h5 font-medium text-carbon-black'>
                Top funding matches
              </p>
              <Link
                href={ROUTES.sme.fundingMatches}
                className='flex items-center gap-2 text-body-sm text-primary'
              >
                View funding matches
                <ArrowRight className='size-5' />
              </Link>
            </div>
            <div className='flex flex-col gap-4.5'>
              {FUNDING_MATCHES.map((f, i) => (
                <div key={f.name} className='flex flex-col gap-4.5'>
                  {i > 0 && <div className='h-px w-full bg-gray-200' />}
                  <div className='flex items-center justify-between gap-4'>
                    <div className='flex flex-col gap-2'>
                      <div className='flex items-center gap-2'>
                        <p className='text-body-md text-carbon-black'>
                          {f.name}
                        </p>
                        <span className='inline-flex h-5.5 items-center rounded-full border border-data-teal bg-primary px-3 text-label-sm font-medium text-mineral-white'>
                          {f.tag}
                        </span>
                      </div>
                      <p className='text-body-sm text-gray-600'>{f.detail}</p>
                    </div>
                    <div className='flex items-center gap-5'>
                      <div className='flex flex-col items-end gap-1 text-right'>
                        <p className='text-h6 font-semibold text-carbon-black'>
                          {f.pct}
                        </p>
                        <p className='text-body-sm text-gray-500'>{f.fit}</p>
                      </div>
                      <ChevronRight className='size-6 text-carbon-black' />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Carbon emissions */}
        <div
          className={cn(
            'min-h-83.5 overflow-hidden rounded-lg border border-gray-300 bg-primary p-6 xl:flex-1',
          )}
        >
          <div className='flex flex-col gap-5'>
            <div className='flex flex-col gap-2'>
              <div className='flex items-center justify-between'>
                <p className='text-body-md font-semibold text-mineral-white'>
                  Carbon emissions
                </p>
                <span className='inline-flex h-6 items-center gap-2 rounded-full bg-data-teal px-3 text-label-md font-medium text-mineral-white'>
                  Scope 1 &amp; 2
                  <ChevronDown className='size-4' />
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <p className='text-body-sm text-gray-300'>July 2026:</p>
                  <p className='text-mineral-white'>
                    <span className='text-[28px] font-bold leading-9'>20</span>
                    <span className='text-body-sm'> </span>
                    <span className='text-body-sm font-medium'>tCO₂e</span>
                  </p>
                </div>
                <span className='inline-flex h-6 items-center gap-2 rounded-full bg-success-50 px-3 text-label-md font-medium text-success-600'>
                  <TrendingDown className='size-4' />
                  -28% vs June
                </span>
              </div>
            </div>
            <div className='flex flex-col gap-2'>
              <div className='flex h-47.5 items-end gap-2'>
                {CARBON_BARS.map((b) => (
                  <div
                    key={b.m}
                    className='flex flex-1 flex-col items-center justify-center gap-2'
                  >
                    <div
                      className={cn(
                        'w-full rounded',
                        b.gold ? 'bg-refined-gold' : 'bg-mineral-white',
                      )}
                      style={{ height: b.h }}
                    />
                    <p className='text-center text-label-sm text-gray-300'>
                      {b.m}
                    </p>
                  </div>
                ))}
              </div>
              <div className='flex items-center gap-2'>
                <span className='size-2 shrink-0 rounded-full bg-refined-gold' />
                <p className='text-label-sm text-gray-300'>
                  Based on reported data | Updated July 20, 2026.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
