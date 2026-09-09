'use client';

import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  Info,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { ScoreGauge } from './score-gauge';

const CARD = 'rounded-2xl border border-gray-200 bg-white';

/* ---------------- static placeholder data (backend later) ---------------- */

const ESG_BREAKDOWN = [
  { label: 'Environmental', value: '74 / 100' },
  { label: 'Social', value: '79 / 100' },
  { label: 'Governance', value: '84 / 100' },
];

// Exact Figma values (node 1395:15179). Ranges/labels use the accent colour;
// descriptions are carbon-black.
const MATURITY = [
  {
    range: '0 - 20',
    label: 'EMERGING',
    desc: 'Sustainability practices are largely informal.',
    bg: '#FEE4E2',
    border: '#FDA29B',
    text: '#D92D20',
  },
  {
    range: '21 - 40',
    label: 'FOUNDATION',
    desc: 'Basic governance and initiatives are in place.',
    bg: '#FFEAD5',
    border: '#FEB273',
    text: '#EC4A0A',
  },
  {
    range: '41 - 60',
    label: 'PROGRESSING',
    desc: 'Consistency practices are established.',
    bg: '#FEF0C7',
    // Figma has #FDA29B here (a red border on the yellow card) — a copy-paste
    // slip; using Warning/300 gold so the row reads consistently.
    border: '#FEC84B',
    text: '#DC6803',
  },
  {
    range: '61 - 80',
    label: 'ADVANCED',
    desc: 'Sustainability in business management.',
    bg: '#E3F1C6',
    border: '#B8DC6F',
    text: '#94C530',
  },
  {
    range: '81 - 100',
    label: 'LEADING',
    desc: 'Strategic decision-making and innovation.',
    bg: '#D1FADF',
    border: '#6CE9A6',
    text: '#039855',
  },
];

const WEIGHTING = [
  { label: 'ESG Intelligence score (EIS™)', color: '#0E2F2A', pct: 34 },
  { label: 'Banking Intelligence score (BIS™)', color: '#CBA052', pct: 33 },
  { label: 'Financial Intelligence score (FIS™)', color: '#1F6F68', pct: 33 },
];

const ESG_PILLARS = {
  head: ['Pillar', 'Weight', 'Raw Score', 'Weighted Score'],
  rows: [
    ['Governance', '45%', '84', '37.8'],
    ['Social', '30%', '79', '23.7'],
    ['Environmental', '25%', '74', '18.5'],
  ],
  total: ['Total EIS score', '100%', '', '80 / 100'],
};

const BANKING_DIMS = {
  rows: [
    ['Cashflow Stability', '82 / 100'],
    ['Payment Discipline', '79 / 100'],
    ['Revenue Consistency', '80 / 100'],
    ['Cash Runway', '78 / 100'],
    ['Banking Resilience', '81 / 100'],
  ],
  total: ['Total BIS score', '100%', '80 / 100'],
};

const FINANCIAL_DIMS = {
  rows: [
    ['Profitability', '79 / 100'],
    ['Liquidity', '81 / 100'],
    ['Financial Resilience', '80 / 100'],
    ['Operational Efficiency', '78 / 100'],
    ['Growth & Stability', '82 / 100'],
  ],
  total: ['Total FIS score', '100%', '80 / 100'],
};

const ESG_INSIGHTS = [
  { ok: true, text: 'Strong governance and risk management practices' },
  { ok: true, text: 'Good people care, wellbeing, engagement' },
  {
    ok: true,
    text: 'Environmental performance improving with an opportunity in carbon reduction',
  },
  {
    ok: false,
    text: 'Increase focus on climate resilience and resource efficiency',
  },
];

const KEY_STRENGTHS = [
  'Strong governance and ethical leadership',
  'Robust banking relationships and cashflow stability',
  'Positive people culture and engagement',
  'Effective energy management practices and risk management framework',
];

const IMPROVEMENT_PRIORITIES = [
  'Develop a comprehensive carbon reduction plan',
  'Improve measurement of Scope 3 emissions',
  'Strengthen resource efficiency initiatives',
  'Enhance water stewardship practices and increase community engagement and impact tracking',
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

const TABS = ['Trend', 'Drivers', 'Peer benchmark', 'What-if'] as const;
type Tab = (typeof TABS)[number];

const TREND_SERIES = [
  { key: 'SFS', label: 'SFS score', color: '#0E2F2A', start: 8, end: 80 },
  { key: 'EIS', label: 'EIS score', color: '#1F6F68', start: 5, end: 76 },
  { key: 'BIS', label: 'BIS score', color: '#CBA052', start: 2, end: 72 },
  { key: 'FIS', label: 'FIS score', color: '#8FA6A0', start: 0, end: 68 },
];
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const DRIVERS = [
  {
    title: 'Verified Scope 1 & 2 emissions baseline',
    meta: 'Environmental · Energy bills 2026 (bundle).zip · verified July 26, 2026',
    pts: '+4 pts',
    up: true,
  },
  {
    title: 'Living Wage Foundation accreditation',
    meta: 'Social · Living Wage certificate.pdf · verified June 15, 2026',
    pts: '+5 pts',
    up: true,
  },
  {
    title: 'Formal board diversity policy',
    meta: 'Governance · Formal board diversity policy.docx · verified May 12, 2026',
    pts: '+6 pts',
    up: true,
  },
  {
    title: 'Scope 3 emissions not yet measured',
    meta: 'Environmental · Sustainability profile · Q18',
    pts: '-6 pts',
    up: false,
  },
];

const WHATIF = [
  {
    title: 'Complete Scope 3 supplier emissions survey',
    meta: 'Environmental · ≈ 2 weeks',
    impact: '+4',
  },
  {
    title: 'Publish a Diversity, Equity, and Inclusion (DEI) policy',
    meta: 'Social · ≈ 4 weeks',
    impact: '+5',
  },
  {
    title: 'Publish a Data Privacy and Cybersecurity Policy',
    meta: 'Governance · ≈ 6 weeks',
    impact: '+6',
  },
  {
    title: 'Switch to REGO-backed renewable electricity',
    meta: 'Environmental · ≈ 4 weeks',
    impact: '+8',
  },
];

const PEER = {
  sector:
    'Information Technology (UK, 11–50 employees) · 214 anonymised businesses',
  you: 80,
  median: 72,
  top: 85,
};

function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex items-start gap-3 rounded-2xl bg-primary p-6 text-mineral-white'>
      <Info className='mt-0.5 size-5 shrink-0 text-gray-300' />
      <p className='text-body-sm text-gray-200 lg:text-body-md'>{children}</p>
    </div>
  );
}

function PanelHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className='flex flex-col gap-1'>
      <p className='text-body-sm font-semibold text-carbon-black lg:text-h5 lg:font-medium'>
        {title}
      </p>
      <p className='text-body-sm text-gray-500 lg:text-body-md'>{sub}</p>
    </div>
  );
}

function DriversPanel() {
  return (
    <div className='flex flex-col gap-6'>
      <PanelHeading
        title="What's driving your score"
        sub='This shows what activities and actions impact your ESG score.'
      />
      <div className='flex flex-col'>
        {DRIVERS.map((d, i) => (
          <div
            key={d.title}
            className={cn(
              'flex items-center justify-between gap-4 py-4',
              i > 0 && 'border-t border-gray-200',
            )}
          >
            <div className='flex flex-col gap-1'>
              <p className='text-body-sm font-medium text-carbon-black lg:text-body-md'>
                {d.title}
              </p>
              <p className='text-label-md text-gray-500 lg:text-body-sm'>
                {d.meta}
              </p>
            </div>
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1 text-label-md font-medium lg:text-body-sm',
                d.up ? 'text-success-600' : 'text-error-600',
              )}
            >
              {d.up ? (
                <TrendingUp className='size-4' />
              ) : (
                <TrendingDown className='size-4' />
              )}
              {d.pts}
            </span>
          </div>
        ))}
      </div>
      <InfoBanner>
        JusKel uses AI-assisted analysis to explain the methodology-calculated
        drivers behind your score. Every insight remains traceable to the
        underlying assessment response or evidence.
      </InfoBanner>
    </div>
  );
}

function WhatIfPanel() {
  return (
    <div className='flex flex-col gap-6'>
      <PanelHeading
        title='What if you did this?'
        sub='See the estimation of how each action could change your score.'
      />
      <div className='flex flex-col'>
        {WHATIF.map((w, i) => (
          <div
            key={w.title}
            className={cn(
              'flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4',
              i > 0 && 'border-t border-gray-200',
            )}
          >
            <div className='flex flex-col gap-1'>
              <p className='text-body-sm font-medium text-carbon-black lg:text-body-md'>
                {w.title}
              </p>
              <p className='text-label-md text-gray-500 lg:text-body-sm'>
                {w.meta}
              </p>
            </div>
            <div className='flex shrink-0 items-center gap-5'>
              <span className='text-label-md font-medium text-success-600 lg:text-body-sm'>
                Estimated score impact {w.impact}
              </span>
              <button
                type='button'
                className='inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-body-sm font-medium text-mineral-white transition-opacity hover:opacity-90'
              >
                Add to plan
                <ArrowRight className='size-4' />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PeerStat({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub: string;
}) {
  return (
    <div className={cn(CARD, 'flex flex-col gap-1 p-5')}>
      <p className='text-label-md text-gray-500'>{title}</p>
      <p className='text-h4 font-semibold text-carbon-black lg:text-h3'>
        {value}
      </p>
      <p className='text-label-md text-gray-500 lg:text-body-sm'>{sub}</p>
    </div>
  );
}

function PeerPanel() {
  return (
    <div className='flex flex-col gap-6'>
      <PanelHeading title='How you compare with your peers' sub={PEER.sector} />
      {/* distribution bar */}
      <div className='relative mx-2 my-10 h-2 rounded-full bg-gray-200'>
        <Marker pos={PEER.median} label={`Median · ${PEER.median}`} />
        <Marker pos={PEER.top} label={`Top quartile · ${PEER.top}`} />
        <div
          className='absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow'
          style={{ left: `${PEER.you}%` }}
        />
        <div
          className='absolute top-5 -translate-x-1/2 whitespace-nowrap text-label-md font-medium text-carbon-black'
          style={{ left: `${PEER.you}%` }}
        >
          You · {PEER.you}
        </div>
      </div>
      <div className='grid gap-3 sm:grid-cols-3'>
        <PeerStat title='You' value='80' sub='Above sector median' />
        <PeerStat title='Sector median' value='72' sub='+8 points ahead' />
        <PeerStat title='Top quartile' value='85' sub='5 points to reach it' />
      </div>
      <InfoBanner>
        Improving your sustainability performance may strengthen your position
        for funding opportunities where ESG criteria are considered.
      </InfoBanner>
    </div>
  );
}

function Marker({ pos, label }: { pos: number; label: string }) {
  return (
    <>
      <div
        className='absolute -top-7 -translate-x-1/2 whitespace-nowrap text-label-sm text-gray-500'
        style={{ left: `${pos}%` }}
      >
        {label}
      </div>
      <div
        className='absolute -top-2 h-6 w-px bg-gray-400'
        style={{ left: `${pos}%` }}
      />
    </>
  );
}

/* ---------------- sub-components ---------------- */

function BigScore({ value, max = 100 }: { value: number; max?: number }) {
  return (
    <p className='whitespace-nowrap font-semibold text-carbon-black'>
      <span className='text-[40px] leading-13 lg:text-[56px] lg:leading-18'>
        {value}
      </span>
      <span className='text-body-md font-normal leading-6 text-gray-500 lg:text-[20px] lg:leading-7'>
        {' '}
        / {max}
      </span>
    </p>
  );
}

function ScoreCard({
  label,
  desc,
  value,
  tier,
  className,
}: {
  label: string;
  desc: string;
  value: number;
  tier: string;
  className?: string;
}) {
  return (
    <div className={cn(CARD, 'w-full overflow-hidden p-3.75', className)}>
      <div className='flex h-full flex-col justify-between gap-5'>
        <div className='flex flex-col gap-0.5'>
          <p className='font-semibold text-carbon-black text-label-lg'>
            {label}
          </p>
          <p className='text-label-md text-gray-500'>{desc}</p>
        </div>
        <div className='flex items-end justify-between'>
          <BigScore value={value} />
          <p className='text-label-md text-right text-success-600 lg:text-body-sm'>
            {tier}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Dark breakdown card (ESG pillars / Banking / Financial dimensions). */
function BreakdownCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col gap-4 overflow-hidden rounded-2xl border border-gray-800 bg-abyssal p-5 text-mineral-white'>
      <div className='flex flex-col gap-0.5'>
        <p className='text-body-sm font-semibold'>{title}</p>
        <p className='text-label-md text-gray-400'>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function TrendChart() {
  const W = 1180;
  const H = 240;
  const padL = 28;
  const padB = 24;
  const plotW = W - padL;
  const plotH = H - padB;
  const x = (i: number) => padL + (plotW * i) / (MONTHS.length - 1);
  const y = (v: number) => plotH - (plotH * v) / 100;

  return (
    <div className='overflow-x-auto'>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className='h-60 w-full min-w-180'
        preserveAspectRatio='none'
        role='img'
        aria-label='One-year trend of SFS, EIS, BIS and FIS scores'
      >
        {/* horizontal gridlines + y labels */}
        {[0, 20, 40, 60, 80, 100].map((v) => (
          <g key={v}>
            <line
              x1={padL}
              x2={W}
              y1={y(v)}
              y2={y(v)}
              stroke='#EAEAEA'
              strokeWidth={1}
            />
            <text
              x={0}
              y={y(v) + 4}
              className='fill-gray-400'
              style={{ fontSize: 12 }}
            >
              {v}
            </text>
          </g>
        ))}
        {/* x labels */}
        {MONTHS.map((m, i) => (
          <text
            key={m}
            x={x(i)}
            y={H - 6}
            textAnchor='middle'
            className='fill-gray-400'
            style={{ fontSize: 12 }}
          >
            {m}
          </text>
        ))}
        {/* series */}
        {TREND_SERIES.map((s) => {
          const pts = MONTHS.map((_, i) => {
            const t = i / (MONTHS.length - 1);
            const v = s.start + (s.end - s.start) * t;
            return `${x(i)},${y(v)}`;
          }).join(' ');
          return (
            <polyline
              key={s.key}
              points={pts}
              fill='none'
              stroke={s.color}
              strokeWidth={2}
              strokeLinecap='round'
            />
          );
        })}
      </svg>
    </div>
  );
}

/* ---------------- main ---------------- */

export function ScorecardScored() {
  const [tab, setTab] = useState<Tab>('Trend');

  return (
    <DashboardShell
      title='Your sustainability finance scorecard'
      subtitle='Confidence level: 85% · last calculated July 25, 2026.'
      action={
        <div className='flex items-center gap-3'>
          <button
            type='button'
            className='inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 bg-mineral-white px-5 text-body-md font-semibold text-carbon-black shadow-xs transition-colors hover:bg-muted'
          >
            <RefreshCw className='size-5' />
            Refresh
          </button>
          <button
            type='button'
            className='inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-5 text-body-md font-semibold text-mineral-white shadow-xs transition-opacity hover:opacity-90'
          >
            <Download className='size-5' />
            Download PDF
          </button>
        </div>
      }
    >
      {/* ---- Score summary ---- */}
      <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4'>
        <div className='flex min-h-86 flex-col gap-5 overflow-hidden rounded-2xl border border-gray-200 bg-primary p-3.75 sm:col-span-2 xl:col-span-1 xl:row-span-2'>
          <p className='text-center text-label-md font-semibold text-mineral-white'>
            OVERALL SUSTAINABILITY FINANCE SCORE
          </p>
          <div className='mx-auto flex w-full max-w-74 flex-col items-center gap-2'>
            <ScoreGauge />
            <div className='flex w-full flex-col items-center gap-2 text-center'>
              <p className='whitespace-nowrap font-semibold text-mineral-white'>
                <span className='text-[56px] leading-13 lg:leading-18'>80</span>
                <span className='font-normal leading-6 text-gray-400 text-[20px] lg:leading-7'>
                  {' '}
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

        {/* ESG Intelligence + breakdown */}
        <div
          className={cn(
            CARD,
            'flex min-h-86 flex-col gap-5 overflow-hidden p-3.75 sm:col-span-2 xl:col-span-1 xl:row-span-2',
          )}
        >
          <div className='flex flex-col gap-0.5'>
            <p className='font-semibold text-carbon-black text-label-lg'>
              ESG INTELLIGENCE SCORE (EIS™)
            </p>
            <p className='text-label-md text-gray-500'>
              Your ESG score is gotten from combining your Environmental +
              Social + Governance scores together.
            </p>
          </div>
          <div className='flex flex-1 flex-col justify-between gap-7'>
            <div className='flex items-end justify-between'>
              <BigScore value={80} />
              <p className='text-label-md text-right text-success-600 lg:text-body-sm'>
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

        <ScoreCard
          className='min-h-39.75'
          label='BANKING INTELLIGENCE SCORE (BIS™)'
          desc='Banking Behaviour and Relationships.'
          value={80}
          tier='ADVANCED'
        />
        <ScoreCard
          className='min-h-39.75'
          label='FINANCIAL INTELLIGENCE SCORE (FIS™)'
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

      {/* ---- Maturity band + weighting ---- */}
      <div className='flex flex-col gap-3 xl:flex-row'>
        <div className={cn(CARD, 'p-5 xl:flex-[2.4]')}>
          <div className='flex flex-col gap-5'>
            <p className='text-body-sm font-semibold text-carbon-black'>
              THE MATURITY BAND FOR YOUR OVERALL SUSTAINABILITY FINANCE SCORE
              (SFS™)
            </p>
            <div className='flex flex-wrap justify-center gap-3 lg:flex-nowrap'>
              {MATURITY.map((b) => (
                <div
                  key={b.label}
                  className='flex w-[calc(50%-0.375rem)] flex-col items-center gap-2 rounded-lg border p-4 text-center lg:w-auto lg:flex-1'
                  style={{ backgroundColor: b.bg, borderColor: b.border }}
                >
                  <div className='flex flex-col items-center'>
                    <p
                      className='text-body-sm font-semibold leading-5'
                      style={{ color: b.text }}
                    >
                      {b.range}
                    </p>
                    <p
                      className='text-body-sm font-semibold leading-5'
                      style={{ color: b.text }}
                    >
                      {b.label}
                    </p>
                  </div>
                  <p className='text-label-md text-carbon-black'>{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={cn(CARD, 'p-5 xl:flex-1')}>
          <div className='flex flex-col gap-5'>
            <p className='text-body-sm font-semibold text-carbon-black'>
              Current SFS™ intelligence weighting
            </p>
            <div className='flex items-center gap-5'>
              <div className='relative size-27 shrink-0'>
                <div
                  className='size-full rounded-full'
                  style={{
                    // Visual order clockwise from top: ESG (dark) top, FIS
                    // (teal) lower-right, BIS (gold) left — matches Figma.
                    background:
                      'conic-gradient(from -60deg, #0E2F2A 0 33.34%, #1F6F68 33.34% 66.67%, #CBA052 66.67% 100%)',
                  }}
                />
                <span className='absolute left-1/2 top-[26%] -translate-x-1/2 -translate-y-1/2 text-[11px] font-bold text-mineral-white'>
                  80%
                </span>
                <span className='absolute left-[75%] top-[68%] -translate-x-1/2 -translate-y-1/2 text-[11px] font-bold text-mineral-white'>
                  70%
                </span>
                <span className='absolute left-[27%] top-[68%] -translate-x-1/2 -translate-y-1/2 text-[11px] font-bold text-mineral-white'>
                  50%
                </span>
              </div>
              <div className='flex flex-col gap-2'>
                {WEIGHTING.map((w) => (
                  <div key={w.label} className='flex items-center gap-2'>
                    <span
                      className='h-3 w-6 shrink-0 rounded-lg'
                      style={{ background: w.color }}
                    />
                    <span className='text-label-md text-gray-700'>
                      {w.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Dimension breakdowns ---- */}
      <div className='grid gap-3 lg:grid-cols-3'>
        <BreakdownCard
          title='ESG PILLAR BREAKDOWN (WITHIN EIS™)'
          subtitle='How the ESG Intelligence Score (EIS™) is calculated.'
        >
          <div className='flex flex-col gap-3'>
            <div className='grid grid-cols-[1.4fr_0.8fr_0.9fr_1fr] text-label-md text-gray-400'>
              {ESG_PILLARS.head.map((h, i) => (
                <span key={h} className={i > 0 ? 'text-right' : ''}>
                  {h}
                </span>
              ))}
            </div>
            {ESG_PILLARS.rows.map((r) => (
              <div
                key={r[0]}
                className='grid grid-cols-[1.4fr_0.8fr_0.9fr_1fr] border-t border-gray-800 pt-3 text-label-md'
              >
                {r.map((c, i) => (
                  <span key={i} className={i > 0 ? 'text-right' : ''}>
                    {c}
                  </span>
                ))}
              </div>
            ))}
            <div className='grid grid-cols-[1.4fr_0.8fr_0.9fr_1fr] border-t border-gray-800 pt-3 text-label-md font-semibold'>
              <span>Total EIS score</span>
              <span className='text-right'>100%</span>
              <span />
              <span className='text-right'>80 / 100</span>
            </div>
          </div>
        </BreakdownCard>

        <BreakdownCard
          title='BANKING DIMENSION BREAKDOWN (WITHIN BIS™)'
          subtitle='How the Banking Intelligence Score (BIS™) is calculated.'
        >
          <div className='flex flex-col gap-3'>
            {BANKING_DIMS.rows.map((r) => (
              <div
                key={r[0]}
                className='flex items-center justify-between border-t border-gray-800 pt-3 text-label-md first:border-t-0 first:pt-0'
              >
                <span>{r[0]}</span>
                <span>{r[1]}</span>
              </div>
            ))}
            <div className='flex items-center justify-between border-t border-gray-800 pt-3 text-label-md font-semibold'>
              <span>Total BIS score</span>
              <span>80 / 100</span>
            </div>
          </div>
        </BreakdownCard>

        <BreakdownCard
          title='FINANCIAL DIMENSION BREAKDOWN (WITHIN FIS™)'
          subtitle='How the Financial Intelligence Score (FIS™) is calculated.'
        >
          <div className='flex flex-col gap-3'>
            {FINANCIAL_DIMS.rows.map((r) => (
              <div
                key={r[0]}
                className='flex items-center justify-between border-t border-gray-800 pt-3 text-label-md first:border-t-0 first:pt-0'
              >
                <span>{r[0]}</span>
                <span>{r[1]}</span>
              </div>
            ))}
            <div className='flex items-center justify-between border-t border-gray-800 pt-3 text-label-md font-semibold'>
              <span>Total FIS score</span>
              <span>80 / 100</span>
            </div>
          </div>
        </BreakdownCard>
      </div>

      {/* ---- Insights ---- */}
      <div className='grid gap-3 lg:grid-cols-3'>
        <div className='rounded-2xl border border-gray-300 bg-gray-50 p-5'>
          <div className='flex flex-col gap-4'>
            <p className='text-body-sm font-semibold text-carbon-black'>
              ESG KEY INSIGHTS
            </p>
            <div className='flex flex-col gap-3'>
              {ESG_INSIGHTS.map((r) => (
                <div key={r.text} className='flex items-start gap-2'>
                  {r.ok ? (
                    <Check className='mt-0.5 size-4 shrink-0 text-success-600' />
                  ) : (
                    <Info className='mt-0.5 size-4 shrink-0 text-warning-600' />
                  )}
                  <span className='text-label-md text-gray-700'>{r.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className='rounded-2xl border border-success-200 bg-success-50 p-5'>
          <div className='flex flex-col gap-4'>
            <div className='flex items-center gap-2'>
              <CheckCircle2 className='size-4.5 text-success-600' />
              <p className='text-body-sm font-semibold text-carbon-black'>
                KEY STRENGTHS
              </p>
            </div>
            <ul className='flex flex-col gap-2'>
              {KEY_STRENGTHS.map((s) => (
                <li key={s} className='flex gap-2 text-label-md text-gray-700'>
                  <span className='text-gray-400'>•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className='rounded-2xl border border-warning-200 bg-warning-50 p-5'>
          <div className='flex flex-col gap-4'>
            <div className='flex items-center gap-2'>
              <AlertCircle className='size-4.5 text-warning-600' />
              <p className='text-body-sm font-semibold text-carbon-black'>
                IMPROVEMENT PRIORITIES
              </p>
            </div>
            <ul className='flex flex-col gap-2'>
              {IMPROVEMENT_PRIORITIES.map((s) => (
                <li key={s} className='flex gap-2 text-label-md text-gray-700'>
                  <span className='text-gray-400'>•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ---- Recalc + Priority actions ---- */}
      <div className='flex flex-col gap-3 xl:flex-row'>
        <div className={cn(CARD, 'min-h-81 p-7 xl:flex-[1.4]')}>
          <div className='flex flex-col gap-6'>
            <div className='flex flex-col gap-2'>
              <p className='text-body-sm text-gray-400 lg:text-body-lg'>
                YOUR NEXT SFS RECALCULATION
              </p>
              <p className='text-h6 font-semibold text-carbon-black lg:text-h3'>
                Your SFS™ score refreshes on September 1
              </p>
              <p className='text-body-sm text-gray-400 lg:text-body-lg'>
                Validated changes to your assessment may affect your next
                Sustainability Finance Score and refresh the funding
                opportunities matched to your profile.
              </p>
            </div>
            <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
              {COUNTDOWN.map((c) => (
                <div
                  key={c.unit}
                  className='flex h-27 flex-col items-center justify-center gap-1 rounded-lg border border-gray-200 bg-abyssal text-center'
                >
                  <p className='text-h4 font-semibold text-mineral-white'>
                    {c.value}
                  </p>
                  <p className='text-body-sm text-gray-300 lg:text-body-md'>
                    {c.unit}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className={cn(
            CARD,
            'flex min-h-81 flex-col justify-between p-7 xl:flex-1',
          )}
        >
          <div className='flex flex-col gap-5'>
            <div className='flex items-center justify-between gap-4'>
              <p className='text-body-sm font-medium text-primary lg:text-body-md'>
                Do these before September 1
              </p>
              <p className='text-label-md text-right text-gray-500 lg:text-body-sm'>
                PRIORITY ACTIONS
              </p>
            </div>
            <div className={cn(CARD, 'flex flex-col gap-4 p-3.75')}>
              {PRIORITY_ACTIONS.map((a, i) => (
                <div key={a.title} className='flex flex-col gap-4'>
                  {i > 0 && <div className='h-px w-full bg-gray-200' />}
                  <div className='flex flex-col gap-2'>
                    <div className='flex items-center justify-between gap-4'>
                      <p className='text-body-sm text-carbon-black lg:text-body-md'>
                        {a.title}
                      </p>
                      <p className='shrink-0 text-label-md text-right text-success-600 lg:text-body-sm'>
                        {a.points}
                      </p>
                    </div>
                    <div className='flex items-center gap-3'>
                      <p className='text-label-md text-gray-400 lg:text-body-sm'>
                        {a.eta}
                      </p>
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
            className='mt-5 flex items-center gap-2 self-end text-label-md md:text-body-md text-carbon-black'
          >
            Check recommendations
            <ArrowRight className='size-5.5' />
          </Link>
        </div>
      </div>

      {/* ---- Analytics tabs ---- */}
      <div className='flex w-full max-w-full gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1.5 sm:w-fit sm:overflow-visible'>
        {TABS.map((t) => (
          <button
            key={t}
            type='button'
            onClick={() => setTab(t)}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-lg px-3.5 py-2 text-body-sm font-medium transition-colors sm:px-4 sm:text-body-md',
              tab === t
                ? 'bg-primary text-mineral-white'
                : 'text-gray-600 hover:bg-muted',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className={cn(CARD, 'p-7')}>
        {tab === 'Trend' && (
          <div className='flex flex-col gap-6'>
            <PanelHeading
              title='One-year trend'
              sub='All four scores moving dynamically even as small changes compound.'
            />
            <TrendChart />
            <div className='flex flex-wrap gap-5'>
              {TREND_SERIES.map((s) => (
                <div key={s.key} className='flex items-center gap-2'>
                  <span
                    className='h-1 w-6 rounded-full'
                    style={{ background: s.color }}
                  />
                  <span className='text-label-md text-gray-600'>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'Drivers' && <DriversPanel />}
        {tab === 'What-if' && <WhatIfPanel />}
        {tab === 'Peer benchmark' && <PeerPanel />}
      </div>
    </DashboardShell>
  );
}
