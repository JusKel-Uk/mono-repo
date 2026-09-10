'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Info } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

type Priority = 'High' | 'Medium' | 'Low';
type Status = 'open' | 'in-progress' | 'completed';

type Rec = {
  title: string;
  priority: Priority;
  why: string;
  impact: string;
  linkedTo: string;
};

/* ---- static placeholder data (backend later) ---- */
const RECOMMENDATIONS: (Rec & { status: Status })[] = [
  {
    title: 'Publish a formal ESG policy',
    priority: 'High',
    why: 'Your assessment identified a gap in your documented sustainability practices. Creating an ESG or sustainability policy could strengthen your sustainability profile and support relevant funding opportunities.',
    impact: 'Est. +4 pts Governance score.',
    linkedTo: 'Governance score',
    status: 'in-progress',
  },
  {
    title: 'Complete Scope 3 emissions survey',
    priority: 'High',
    why: 'Your Environmental score currently relies on self-declared bands.',
    impact: 'Est. +4 pts Environmental score.',
    linkedTo: 'Environmental score',
    status: 'open',
  },
  {
    title: 'Formalise Diversity, Equity, and Inclusion (DEI) commitment',
    priority: 'Medium',
    why: 'Your assessment indicates an opportunity to strengthen your documented DEI practices. Formalising your DEI commitment can strengthen your Social capability and evidence position.',
    impact: 'Est. +3 pts Social score.',
    linkedTo: 'Social score',
    status: 'open',
  },
  {
    title: 'Add supplier sustainability check evidence',
    priority: 'Low',
    why: 'You confirmed supplier checks but no evidence attached.',
    impact: 'Est. +2 pts ESG score.',
    linkedTo: 'ESG score',
    status: 'open',
  },
];

const PRIORITY_CLS: Record<Priority, string> = {
  High: 'bg-error-50 text-error-700',
  Medium: 'bg-warning-50 text-warning-700',
  Low: 'bg-gray-100 text-gray-600',
};

const TABS = ['All', 'Open', 'In Progress', 'Completed'] as const;
type Tab = (typeof TABS)[number];

const TAB_STATUS: Record<Exclude<Tab, 'All'>, Status> = {
  Open: 'open',
  'In Progress': 'in-progress',
  Completed: 'completed',
};

const EMPTY_COPY: Record<Tab, { title: string; body: string }> = {
  All: {
    title: 'No recommendations yet',
    body: 'Recommendations appear once a Sustainability Expert has reviewed your evidence.',
  },
  Open: {
    title: 'No open recommendations',
    body: "You've started or completed every recommended action — nice work.",
  },
  'In Progress': {
    title: 'Nothing in progress',
    body: 'Start a recommended action to track it here as you work through it.',
  },
  Completed: {
    title: 'No completed recommendations yet',
    body: 'Complete the recommended actions assigned to your business to track your progress and improve your ESG score over time.',
  },
};

export function RecommendationsReviewed() {
  const [tab, setTab] = useState<Tab>('All');
  // Local status overrides so the CTAs move cards between tabs (frontend only).
  const [statuses, setStatuses] = useState<Record<string, Status>>(() =>
    Object.fromEntries(RECOMMENDATIONS.map((r) => [r.title, r.status])),
  );

  const items = useMemo(
    () => RECOMMENDATIONS.map((r) => ({ ...r, status: statuses[r.title] })),
    [statuses],
  );

  const filtered =
    tab === 'All' ? items : items.filter((r) => r.status === TAB_STATUS[tab]);

  const advance = (title: string, to: Status, msg: string) => {
    setStatuses((s) => ({ ...s, [title]: to }));
    toast.success(msg);
  };

  return (
    <DashboardShell
      title='Recommendations'
      subtitle='Personalised improvement actions based on your assessment, evidence, and priority gaps.'
    >
      {/* Tabs */}
      <div className='flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-primary p-1.5'>
        {TABS.map((t) => (
          <button
            key={t}
            type='button'
            onClick={() => setTab(t)}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-body-sm font-medium transition-colors',
              tab === t
                ? 'bg-mineral-white text-carbon-black'
                : 'text-gray-300 hover:text-mineral-white',
            )}
          >
            {t}
            {t === 'All' ? ` (${items.length})` : ''}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className='flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-6'>
          <div className='flex max-w-125 flex-col items-center gap-4 text-center'>
            <Info className='size-14 text-carbon-black' strokeWidth={1.5} />
            <div className='flex flex-col gap-2'>
              <p className='text-h4 font-semibold text-carbon-black'>
                {EMPTY_COPY[tab].title}
              </p>
              <p className='text-body-md text-gray-500'>{EMPTY_COPY[tab].body}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          {filtered.map((r) => (
            <div
              key={r.title}
              className='flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6'
            >
              <div className='flex flex-wrap items-center gap-3'>
                <h3 className='text-h6 font-semibold text-carbon-black'>
                  {r.title}
                </h3>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-3 py-0.5 text-label-md font-medium',
                    PRIORITY_CLS[r.priority],
                  )}
                >
                  {r.priority} priority
                </span>
              </div>

              <div className='flex flex-col gap-2'>
                <p className='text-body-md text-gray-500'>
                  <span className='font-semibold text-carbon-black'>Why: </span>
                  {r.why}
                </p>
                <p className='text-body-md text-gray-500'>
                  <span className='font-semibold text-carbon-black'>
                    Impact:{' '}
                  </span>
                  {r.impact}
                </p>
                <p className='text-body-sm text-gray-500'>
                  Linked to: {r.linkedTo}
                </p>
              </div>

              {r.status === 'completed' ? (
                <span className='inline-flex w-fit items-center gap-2 text-body-sm font-medium text-success-600'>
                  <CheckCircle2 className='size-5' />
                  Completed
                </span>
              ) : r.status === 'in-progress' ? (
                <button
                  type='button'
                  onClick={() =>
                    advance(r.title, 'completed', 'Marked as completed')
                  }
                  className='inline-flex h-11 w-fit items-center gap-2 rounded-lg bg-primary px-5 text-body-sm font-semibold text-mineral-white transition-opacity hover:opacity-90'
                >
                  Mark as completed
                  <CheckCircle2 className='size-4.5' />
                </button>
              ) : (
                <button
                  type='button'
                  onClick={() =>
                    advance(r.title, 'in-progress', 'Action started')
                  }
                  className='inline-flex h-11 w-fit items-center rounded-lg bg-primary px-5 text-body-sm font-semibold text-mineral-white transition-opacity hover:opacity-90'
                >
                  Start this action
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
