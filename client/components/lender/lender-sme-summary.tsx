'use client';

import { useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  MinusCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { LenderShell } from '@/components/lender/lender-shell';
import { LenderBadge, type LenderBadgeTone } from '@/components/lender/lender-badge';
import { LenderDisclaimer } from '@/components/lender/lender-disclaimer';
import { MATCHED_SMES } from '@/components/lender/lender-matched-smes';
import { SmeActionButtons } from '@/components/lender/lender-sme-dialogs';

/* ------------------------------------------------------------- demo content */
// Rich body content is representative (only Flo Technologies is specced in the
// design); the header reflects the SME that was clicked.

const KPIS = (percent: number, sfs: number, readiness: string) => [
  { label: 'MATCH RELEVANCE', value: `${percent}%` },
  { label: 'SUSTAINABILITY FINANCE SCORE (SFS)', value: `${sfs}`, suffix: ' / 100' },
  { label: 'FUNDING READINESS', value: readiness },
  { label: 'EVIDENCE CONFIDENCE', value: 'Moderate' },
];

const FUNDING_NEED = [
  { label: 'Requirement', value: '£25k – £250k' },
  { label: 'Employees', value: '25–49' },
  { label: 'Turnover band', value: '£5m – £10m' },
  { label: 'Purpose', value: 'Seasonal working capital' },
];

const CARBON = [
  { label: 'Reporting period', value: 'FY2025 (Jan–Dec)' },
  { label: 'Total emissions', value: '1,240 tCO₂e' },
  { label: 'Scope 1', value: '180 tCO₂e' },
  { label: 'Scope 2', value: '60 tCO₂e' },
  { label: 'Scope 3', value: '1,000 tCO₂e (partial)' },
  { label: 'Data coverage', value: '82%' },
  { label: 'Calculation status', value: 'Specialist-reviewed' },
  { label: 'Baseline movement', value: '−6% vs FY2024' },
  { label: 'Material limitations', value: 'Scope 3 categories 1 & 4 estimated' },
];

type EvidenceState = 'verified' | 'validated' | 'missing' | 'partial';
const EVIDENCE: { label: string; state: EvidenceState }[] = [
  { label: 'Statutory accounts (verified)', state: 'verified' },
  { label: 'Energy usage evidence (verified)', state: 'verified' },
  { label: 'Supplier code of conduct (missing)', state: 'missing' },
  { label: 'Bank / accounting feed (validated)', state: 'validated' },
  { label: 'Emissions declaration (partial)', state: 'partial' },
];

const AI_NOTES = [
  'Concentration: top customer ≈ 31% of revenue',
  'Seasonality in Q1 cash conversion',
  'No material governance flags raised in review',
];

const PIPELINE_ACTIONS = [
  'New match',
  'Reviewing',
  'Interested',
  'On hold',
  'Not interested',
];

const STATUS_TONE: Record<string, LenderBadgeTone> = {
  'New match': 'info',
  Interested: 'success',
  Reviewing: 'warning',
  'On hold': 'neutral',
  'Not interested': 'neutral',
  'Consent withdrawn': 'error',
};

/* ------------------------------------------------------------- primitives */

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className='flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 lg:p-7'>
      <div className='flex flex-col gap-1'>
        <h2 className='text-h5 font-semibold text-carbon-black'>{title}</h2>
        {subtitle && <p className='text-body-md text-gray-500'>{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function LabelValue({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex flex-col gap-0.5'>
      <p className='text-body-sm text-gray-500'>{label}</p>
      <p className='text-body-md text-carbon-black'>{value}</p>
    </div>
  );
}

const EV_ICON: Record<EvidenceState, React.ReactNode> = {
  verified: <CheckCircle2 className='size-5 text-success-600' />,
  validated: <CheckCircle2 className='size-5 text-success-600' />,
  missing: <MinusCircle className='size-5 text-gray-400' />,
  partial: <AlertTriangle className='size-5 text-warning-600' />,
};

/* -------------------------------------------------------------------- view */

/** SME summary read-view for a matched SME. */
export function LenderSmeSummaryView({ smeId }: { smeId: string }) {
  const sme = MATCHED_SMES.find((s) => s.id === smeId);
  if (!sme) notFound();

  const [pipeline, setPipeline] = useState('');
  const [relevant, setRelevant] = useState<'yes' | 'no' | null>(null);
  const [feedback, setFeedback] = useState('');

  return (
    <LenderShell
      title={sme.name}
      subtitle={`${sme.sector} · London · Early · 2 years trading`}
    >
      <div className='flex flex-col gap-6'>
        <Link
          href={ROUTES.lender.matchedSmes}
          className='flex w-fit items-center gap-2 text-body-md text-gray-700'
        >
          <ArrowLeft className='size-5.5' />
          Back to matched SMEs
        </Link>

        <div className='flex items-center gap-3'>
          <LenderBadge tone={STATUS_TONE[sme.status] ?? 'neutral'}>
            {sme.status.toUpperCase()}
          </LenderBadge>
        </div>

        {/* KPI tiles */}
        <div className='grid grid-cols-2 gap-2 lg:grid-cols-4'>
          {KPIS(sme.percent, sme.sfs, sme.readiness || 'Ready').map((k) => (
            <div
              key={k.label}
              className='flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-5'
            >
              <p className='text-body-sm text-gray-700'>{k.label}</p>
              <p className='text-[32px] font-semibold leading-10 text-carbon-black'>
                {k.value}
                {k.suffix && (
                  <span className='text-body-md font-normal text-gray-500'>
                    {k.suffix}
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>

        {/* Funding need */}
        <Card title='Funding need — Clean Growth Financing'>
          <div className='grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4'>
            {FUNDING_NEED.map((f) => (
              <LabelValue key={f.label} {...f} />
            ))}
          </div>
        </Card>

        {/* Readiness summary */}
        <Card title='Readiness summary'>
          <p className='text-body-md text-gray-600'>
            Financial and operational evidence complete. Sustainability evidence
            reviewed with two outstanding data gaps (Scope 3, supplier policy).
          </p>
          <p className='text-body-sm text-gray-500'>
            Reviewed by Chloé Bennett, Senior SFS Specialist · August 18, 2026,
            17:11
          </p>
        </Card>

        {/* Carbon profile */}
        <Card title='Carbon profile summary'>
          <div className='grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3'>
            {CARBON.map((c) => (
              <LabelValue key={c.label} {...c} />
            ))}
          </div>
        </Card>

        {/* Evidence */}
        <Card title='Evidence summary'>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            {EVIDENCE.map((e) => (
              <div key={e.label} className='flex items-center gap-2'>
                {EV_ICON[e.state]}
                <span className='text-body-md text-carbon-black'>{e.label}</span>
              </div>
            ))}
          </div>
          <p className='text-body-sm text-gray-500'>
            Raw documents, extracted values, and questionnaire answers are never
            shared with lenders.
          </p>
        </Card>

        {/* AI review */}
        <Card title='AI-assisted review summary'>
          <ul className='flex flex-col gap-2'>
            {AI_NOTES.map((n) => (
              <li
                key={n}
                className='flex items-start gap-2 text-body-md text-gray-600'
              >
                <span className='mt-2 size-1.5 shrink-0 rounded-full bg-gray-400' />
                {n}
              </li>
            ))}
          </ul>
        </Card>

        {/* Lender action */}
        <Card
          title='Lender action'
          subtitle='Take action on this application, your selection will update the application status visible to the SME.'
        >
          <div className='flex flex-col gap-3'>
            <button
              type='button'
              onClick={() => toast.success(`${sme.name} marked as reviewing`)}
              className='inline-flex w-fit items-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-base font-semibold text-gray-700 shadow-xs hover:bg-muted'
            >
              Mark as reviewing
            </button>
            <SmeActionButtons smeName={sme.name} />
          </div>
        </Card>

        {/* Pipeline status */}
        <Card
          title='Pipeline status'
          subtitle='Track this SME through your internal lending workflow. Statuses are visible only to your organisation.'
        >
          <div className='relative sm:w-90'>
            <select
              value={pipeline}
              onChange={(e) => {
                setPipeline(e.target.value);
                if (e.target.value)
                  toast.success(`Pipeline status: ${e.target.value}`);
              }}
              aria-label='Pipeline status'
              className={cn(
                'h-14 w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 pr-11 text-body-md focus:border-teal-charcoal focus:outline-none',
                pipeline ? 'text-carbon-black' : 'text-gray-400',
              )}
            >
              <option value=''>Select an action</option>
              {PIPELINE_ACTIONS.map((a) => (
                <option key={a} value={a} className='text-carbon-black'>
                  {a}
                </option>
              ))}
            </select>
            <ChevronDown className='pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-gray-500' />
          </div>
          <p className='text-body-sm text-gray-500'>Updated August 18, 2026, 18:04</p>
        </Card>

        {/* Match relevance feedback */}
        <Card
          title='Match relevance'
          subtitle='Tell us whether this match was relevant to your funding criteria. Your feedback helps improve future matching and is never shared with the SME.'
        >
          <div className='flex flex-col gap-2'>
            <p className='text-body-md font-medium text-carbon-black'>
              Was this match relevant?
            </p>
            <div className='flex gap-3'>
              {(['yes', 'no'] as const).map((v) => (
                <button
                  key={v}
                  type='button'
                  onClick={() => setRelevant(v)}
                  aria-pressed={relevant === v}
                  className={cn(
                    'rounded-lg border px-5 py-2.5 text-body-md font-semibold transition-colors',
                    relevant === v
                      ? 'border-teal-charcoal bg-primary text-mineral-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-muted',
                  )}
                >
                  {v === 'yes' ? 'Relevant' : 'Not relevant'}
                </button>
              ))}
            </div>
          </div>
          <div className='flex flex-col gap-2'>
            <p className='text-body-md font-medium text-carbon-black'>
              Feedback (Optional)
            </p>
            <p className='text-body-sm text-gray-500'>
              What made this match relevant or not relevant?
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder='Share your thoughts about this match...'
              rows={4}
              className='w-full rounded-xl border border-gray-300 bg-white p-4 text-body-md text-carbon-black placeholder:text-gray-400 focus:border-teal-charcoal focus:outline-none'
            />
          </div>
          <button
            type='button'
            disabled={relevant === null}
            onClick={() => toast.success('Feedback submitted')}
            className={cn(
              'inline-flex w-fit items-center rounded-lg px-5 py-3 text-base font-semibold shadow-xs',
              relevant === null
                ? 'cursor-not-allowed bg-stone-grey text-gray-400'
                : 'bg-primary text-mineral-white',
            )}
          >
            Submit feedback
          </button>
        </Card>

        <LenderDisclaimer />
      </div>
    </LenderShell>
  );
}
