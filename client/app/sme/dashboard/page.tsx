'use client';

import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Check,
  Clock,
  MessageSquareText,
  UserCheck,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuthStore, displayName } from '@/stores/authStore';
import { useMounted } from '@/lib/hooks/use-mounted';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardOverview } from '@/components/dashboard/reviewed/dashboard-overview';

type InfoRequest = { label: string; description: string };

type ReviewState = {
  status: string;
  statusNote: string;
  reviewer: { value: string; sub: string };
  requests: { value: string; sub: string; items: InfoRequest[] };
  /** How many of the "What happens next" steps are complete. */
  completedSteps: number;
};

const PENDING: ReviewState = {
  status: 'Submitted (awaiting review)',
  statusNote: 'Your application is in the queue for a Sustainability Expert to review.',
  reviewer: { value: 'Not yet assigned', sub: 'Queued for a Sustainability Expert' },
  requests: { value: 'None', sub: 'None from the reviewer yet', items: [] },
  completedSteps: 1,
};

const IN_REVIEW: ReviewState = {
  status: 'In Review',
  statusNote: 'A Sustainability Expert is reviewing your application.',
  reviewer: { value: 'Chloé Bennett', sub: 'Sustainability Expert, JusKel' },
  requests: {
    value: '2 open',
    sub: 'Information requests from the reviewer',
    items: [
      {
        label: 'ENERGY USAGE REPORT',
        description:
          'The annual kWh figure on page 3 looks like a monthly total, please re-upload with the annual figure or add a clarifying note.',
      },
      {
        label: 'BOARD SIGN-OFF',
        description:
          'Your Business Continuity Plan is unsigned. Please upload a version signed by a director.',
      },
    ],
  },
  completedSteps: 2,
};

// TODO: derive from the backend review status. PENDING is the post-submit
// default; the reviewer/info-requests populate once a Specialist picks it up.
// Toggle while there's no backend driver for the review phase.
const SHOW_IN_REVIEW = true;
const state: ReviewState = SHOW_IN_REVIEW ? IN_REVIEW : PENDING;

// Once a Sustainability Expert publishes the score, the dashboard switches from
// the review-status view to the full scored overview. Toggle while there's no
// backend driver for the review phase.
const SHOW_PUBLISHED = true;

const STEPS = [
  {
    title: 'Submitted',
    desc: "You've submitted all 5 onboarding sections plus supporting evidence.",
  },
  {
    title: 'Sustainability Expert reviews',
    desc: 'A Sustainability Expert reviews your submission and supporting evidence. AI-assisted checks help identify items requiring review.',
  },
  {
    title: 'Clarifications, if needed',
    desc: "If anything needs to be clarified or if additional information is required, you'll get an information request here.",
  },
  {
    title: 'Your Sustainability Finance Score is published',
    desc: 'Your sustainability finance score and readiness tier appear on your dashboard and your funding matches get unlocked.',
  },
];

export default function SmeDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const mounted = useMounted();
  const greeting =
    mounted && user ? `Welcome, ${user.firstName || displayName(user)}` : 'Welcome';

  if (SHOW_PUBLISHED) return <DashboardOverview greeting={greeting} />;

  return (
    <DashboardShell
      title={greeting}
      subtitle="Here’s what your Sustainability Finance assessment status currently looks like."
      notifications={state.requests.items.length}
    >
      {/* Assessment status card */}
      <section className='rounded-2xl border border-gray-200 bg-primary p-7 text-mineral-white'>
        <div className='flex flex-col gap-8'>
          <div className='flex flex-col gap-7'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
              <div className='flex flex-col gap-2'>
                <p className='text-body-lg text-gray-400'>
                  YOUR SUSTAINABILITY FINANCE ASSESSMENT
                </p>
                <p className='text-h3 font-semibold text-mineral-white'>
                  {state.status}
                </p>
                <p className='text-body-lg text-gray-400'>{state.statusNote}</p>
              </div>
              <div className='flex flex-col gap-0.5 sm:items-end sm:text-right'>
                <p className='text-body-lg text-success-600'>Submitted</p>
                <p className='text-h5 font-bold text-mineral-white'>
                  July 20, 2026
                </p>
              </div>
            </div>

            <div className='grid gap-4 sm:grid-cols-3'>
              <StatusTile
                icon={Clock}
                label='Target turnaround'
                value='5 working days'
                sub='ETA ~ July 27, 2026'
              />
              <StatusTile
                icon={UserCheck}
                label='Assigned reviewer'
                value={state.reviewer.value}
                sub={state.reviewer.sub}
              />
              <StatusTile
                icon={MessageSquareText}
                label='Information requests'
                value={state.requests.value}
                sub={state.requests.sub}
              />
            </div>
          </div>

          {state.requests.items.length > 0 && (
            <ReviewerInput items={state.requests.items} />
          )}
        </div>
      </section>

      {/* What happens next + While you wait */}
      <div className='grid gap-6 lg:grid-cols-[minmax(0,696fr)_minmax(0,616fr)]'>
        <div className='rounded-2xl border border-gray-200 bg-white p-7'>
          <div className='flex flex-col gap-6'>
            <h2 className='text-h5 font-semibold text-carbon-black'>
              What happens next?
            </h2>
            <ol className='flex flex-col gap-4'>
              {STEPS.map((s, i) => (
                <Step
                  key={s.title}
                  done={i + 1 <= state.completedSteps}
                  index={i + 1}
                  title={s.title}
                  desc={s.desc}
                />
              ))}
            </ol>
          </div>
        </div>

        <div className='rounded-2xl border border-gray-200 bg-white p-7'>
          <div className='flex flex-col gap-5'>
            <div className='flex flex-col'>
              <h2 className='text-h5 font-semibold text-carbon-black'>
                While you wait...
              </h2>
              <p className='text-body-md text-gray-600'>
                Here are some optional actions that can help to strengthen your
                file if the reviewer comes back with questions.
              </p>
            </div>
            <div className='flex flex-col gap-2'>
              <WaitAction
                title='Add more supporting evidence'
                desc='Policies, certifications, and your latest accounts.'
              />
              <WaitAction
                title='Connect Open Banking / Xero / QuickBooks'
                desc='Open Banking supports Banking Intelligence while Xero/QuickBooks support Financial Intelligence.'
              />
              <WaitAction
                title='Invite team members'
                desc='Add a Contributor or Viewer from your company.'
              />
              <WaitAction
                title='Review your submitted answers'
                desc='This is in read-only mode until your review is completed.'
              />
            </div>
          </div>
        </div>
      </div>

      {/* Locked outputs */}
      <div className='grid gap-5 sm:grid-cols-3'>
        <LockedCard
          title='FUNDING READINESS INDEX'
          sub='Published after review'
        />
        <LockedCard
          title='MATCHED FUNDING OPTIONS'
          sub='Available once the required assessment outputs are published'
        />
        <LockedCard
          title='SECTOR BENCHMARK'
          sub='Available where sufficient comparable benchmark data exists'
        />
      </div>
    </DashboardShell>
  );
}

function StatusTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className='flex gap-4 rounded-2xl border border-carbon-black/50 bg-mineral-white p-5'>
      <Icon className='mt-0.5 size-6 shrink-0 text-carbon-black' />
      <div className='flex flex-col gap-1'>
        <p className='text-body-md text-gray-600'>{label}</p>
        <p className='text-h6 font-semibold text-carbon-black'>{value}</p>
        <p className='text-body-md text-gray-600'>{sub}</p>
      </div>
    </div>
  );
}

/** "Your reviewer needs your input" — the open information-request cards. */
function ReviewerInput({ items }: { items: InfoRequest[] }) {
  return (
    <div className='rounded-2xl border border-warning-200 bg-warning-50 px-5 py-6'>
      <div className='flex flex-col gap-4'>
        <div className='flex items-center gap-2'>
          <MessageSquareText className='size-6 shrink-0 text-warning-800' />
          <p className='text-h6 font-medium text-warning-800'>
            Your reviewer needs your input
          </p>
        </div>
        <div className='flex flex-col gap-3'>
          {items.map((item) => (
            <div
              key={item.label}
              className='rounded-2xl border border-gray-300 bg-white p-5'
            >
              <div className='flex flex-col gap-2'>
                <div className='flex flex-col gap-1'>
                  <p className='text-body-md text-gray-600'>{item.label}</p>
                  <p className='text-h6 font-medium text-carbon-black'>
                    {item.description}
                  </p>
                </div>
                <button
                  type='button'
                  className='flex w-fit items-center gap-2 text-gray-600 hover:text-carbon-black'
                >
                  <span className='text-body-md'>Provide response</span>
                  <ArrowRight className='size-6' />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step({
  done = false,
  index,
  title,
  desc,
}: {
  done?: boolean;
  index: number;
  title: string;
  desc: string;
}) {
  return (
    <li className='flex gap-4'>
      <span className='flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-200'>
        {done ? (
          <Check className='size-6 text-success-600' />
        ) : (
          <span className='text-base text-gray-400'>{index}</span>
        )}
      </span>
      <div className='flex flex-col'>
        <p
          className={cn(
            'text-h6 font-semibold',
            done ? 'text-carbon-black' : 'text-gray-400',
          )}
        >
          {title}
        </p>
        <p className={cn('text-body-md', done ? 'text-carbon-black' : 'text-gray-400')}>
          {desc}
        </p>
      </div>
    </li>
  );
}

function WaitAction({ title, desc }: { title: string; desc: string }) {
  return (
    <button
      type='button'
      className='flex w-full items-start gap-3 rounded-xl bg-abyssal p-4 text-left transition-opacity hover:opacity-90'
    >
      <ArrowRight className='mt-0.5 size-6 shrink-0 text-mineral-white' />
      <div className='flex flex-col'>
        <p className='text-body-md font-semibold text-mineral-white'>{title}</p>
        <p className='text-body-sm text-gray-300'>{desc}</p>
      </div>
    </button>
  );
}

function LockedCard({ title, sub }: { title: string; sub: string }) {
  return (
    <div className='flex h-40 flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-gray-300 bg-white px-6 text-center'>
      <p className='text-body-md text-gray-600'>{title}</p>
      <div className='h-[3px] w-14 shrink-0 bg-gray-400' />
      <p className='text-body-sm text-gray-600'>{sub}</p>
    </div>
  );
}
