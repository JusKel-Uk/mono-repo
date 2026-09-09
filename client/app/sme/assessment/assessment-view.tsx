'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Briefcase,
  Building2,
  Circle,
  CircleCheck,
  Coins,
  Landmark,
  Leaf,
  Loader2,
  Lock,
} from 'lucide-react';

import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { stepRoute } from '@/lib/onboarding/steps';
import {
  useApplication,
  useSubmitApplication,
} from '@/lib/hooks/use-onboarding';
import type { StepNumber, StepStatus } from '@/lib/api/onboarding';
import { useReviewStore } from '@/stores/reviewStore';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

type TimelineStep = {
  step: StepNumber;
  icon: LucideIcon;
  title: string;
  desc: string;
  time: string;
  href: string;
};

const STEPS: TimelineStep[] = [
  {
    step: 1,
    icon: Building2,
    title: 'Company setup',
    desc: 'Legal name, registration, your role, and business basics.',
    time: '3 mins',
    href: stepRoute('company-setup'),
  },
  {
    step: 2,
    icon: Briefcase,
    title: 'Business profile',
    desc: 'Sector, location, employees, and years in operation.',
    time: '3 mins',
    href: stepRoute('business-profile'),
  },
  {
    step: 3,
    icon: Landmark,
    title: 'Financial profile',
    desc: 'Revenue, profitability, existing debt, cash position, and key financial information.',
    time: '4 mins',
    href: stepRoute('financial-profile'),
  },
  {
    step: 4,
    icon: Leaf,
    title: 'Sustainability profile',
    desc: 'Environmental, Social, and Governance.',
    time: '5 mins',
    href: stepRoute('sustainability-profile'),
  },
  {
    step: 5,
    icon: Coins,
    title: 'Funding profile',
    desc: 'Amount needed, purpose, term, urgency.',
    time: '2 mins',
    href: stepRoute('funding-profile'),
  },
];

const STATUS_META: Record<
  StepStatus,
  { label: string; badge: string; cta: string }
> = {
  0: {
    label: 'Not started',
    badge: 'bg-gray-100 text-gray-500',
    cta: 'Start',
  },
  1: {
    label: 'In progress',
    badge: 'bg-warning-50 text-warning-600',
    cta: 'Continue',
  },
  2: {
    label: 'Complete',
    badge: 'bg-success-50 text-success-600',
    cta: 'Review answers',
  },
};

export function AssessmentView() {
  const { data: app, isLoading } = useApplication();
  const submit = useSubmitApplication();

  // Temporary submit-for-review gate (see reviewStore). Purely frontend for
  // now: set only when the user submits here, and reset on logout so the submit
  // can be triggered again. It is NOT synced from the backend's submittedAt yet.
  // TODO(backend): drive this from the server's submission status.
  const submitted = useReviewStore((s) => s.submitted);
  const setSubmittedForReview = useReviewStore((s) => s.setSubmitted);

  const totalSteps = app?.totalSteps ?? STEPS.length;
  const completedCount = app?.completedCount ?? 0;
  const allComplete = totalSteps > 0 && completedCount >= totalSteps;
  const statusOf = (step: StepNumber): StepStatus =>
    app?.steps?.find((s) => s.step === step)?.status ?? 0;

  const title = submitted
    ? 'Your onboarding submission'
    : 'Complete your onboarding';
  const subtitle = submitted
    ? 'Your answers are locked while an Assessment Specialist reviews, however, you can still upload your documents as evidence.'
    : 'Complete each step below. You can leave and pick up where you left off at any time.';

  async function onSubmit() {
    // Temporary: the local gate is the source of truth for now, so unlock
    // regardless of the backend result (which may 409 once already submitted).
    // The backend submit is fired best-effort until the server is the source.
    setSubmittedForReview(true);
    toast.success('Submitted for review', {
      description: 'A Sustainability Expert will review your application.',
    });
    try {
      await submit.mutateAsync();
    } catch {
      /* best-effort — the local gate has already unlocked the dashboard */
    }
  }

  const pct = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  return (
    <DashboardShell title={title} subtitle={subtitle}>
      {isLoading && !app ? (
        <div className='flex min-h-60 items-center justify-center'>
          <Loader2 className='size-6 animate-spin text-muted-foreground' />
        </div>
      ) : (
        <>
          {/* Progress + status */}
          <section className='rounded-2xl border border-gray-200 bg-white p-7'>
            <div className='flex flex-col gap-7'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                <div className='flex flex-col gap-2'>
                  <p className='text-body-lg text-gray-500'>
                    Onboarding progress
                  </p>
                  <p className='text-h3 font-semibold text-carbon-black'>
                    {completedCount} of {totalSteps} complete
                  </p>
                </div>
                <div className='flex flex-col gap-2 sm:items-end sm:text-right'>
                  <p className='text-body-lg text-gray-500'>
                    ASSESSMENT STATUS
                  </p>
                  <p
                    className={cn(
                      'text-body-lg font-medium',
                      submitted || allComplete
                        ? 'text-success-600'
                        : 'text-carbon-black',
                    )}
                  >
                    {submitted
                      ? 'Submitted (awaiting review)'
                      : allComplete
                        ? 'Ready to submit'
                        : 'In progress'}
                  </p>
                </div>
              </div>

              <div className='h-2 w-full overflow-hidden rounded-lg border border-primary/50 bg-gray-300'>
                <div
                  className='h-full rounded-lg bg-primary transition-[width]'
                  style={{ width: `${pct}%` }}
                />
              </div>

              {submitted ? (
                <div className='flex gap-3 rounded-2xl border border-primary/50 bg-primary p-6 text-mineral-white'>
                  <Lock className='size-6 shrink-0' />
                  <div className='flex flex-col gap-1'>
                    <p className='text-h6 font-semibold'>Submission locked</p>
                    <p className='text-body-md'>
                      Your answers are being reviewed. If the reviewer needs
                      further clarification, you&apos;ll see an information
                      request on your dashboard.
                    </p>
                  </div>
                </div>
              ) : allComplete ? (
                <div className='flex flex-col gap-4 rounded-2xl border border-gray-200 bg-muted/40 p-6 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='flex flex-col gap-1'>
                    <p className='text-h6 font-semibold text-carbon-black'>
                      All steps complete
                    </p>
                    <p className='text-body-md text-gray-500'>
                      Submit your application for a Sustainability Expert to
                      review.
                    </p>
                  </div>
                  <button
                    type='button'
                    onClick={onSubmit}
                    disabled={submit.isPending}
                    className='inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-base font-semibold text-mineral-white transition-opacity hover:opacity-90 disabled:opacity-60'
                  >
                    {submit.isPending && (
                      <Loader2 className='size-4 animate-spin' />
                    )}
                    Submit for review
                  </button>
                </div>
              ) : (
                <div className='rounded-2xl border border-gray-200 bg-muted/40 p-6'>
                  <p className='text-body-md text-gray-500'>
                    Complete every step below to submit your application for
                    review.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Assessment timeline */}
          <section className='flex flex-col gap-5'>
            <div className='flex flex-col gap-0.5'>
              <h2 className='text-h4 font-semibold text-carbon-black'>
                Your assessment timeline
              </h2>
              <p className='text-body-lg text-gray-500'>
                Track your assessment progress, review completed steps, and
                continue where you left off.
              </p>
            </div>

            <ol className='flex flex-col'>
              {STEPS.map((step, i) => {
                const isLast = i === STEPS.length - 1;
                const status = statusOf(step.step);
                const meta = STATUS_META[status];
                const complete = status === 2;
                const Icon = step.icon;
                return (
                  <li key={step.title} className='flex gap-4 lg:gap-6'>
                    {/* Rail */}
                    <div className='flex flex-col items-center'>
                      {complete ? (
                        <CircleCheck className='size-6 shrink-0 text-success-600' />
                      ) : (
                        <Circle
                          className={cn(
                            'size-6 shrink-0',
                            status === 1 ? 'text-primary' : 'text-gray-300',
                          )}
                        />
                      )}
                      {!isLast && (
                        <span
                          className={cn(
                            'w-px flex-1',
                            complete ? 'bg-success-600/40' : 'bg-gray-300',
                          )}
                        />
                      )}
                    </div>

                    {/* Card */}
                    <div className='mb-4 flex-1'>
                      <div className='rounded-2xl border border-gray-200 bg-white p-5'>
                        <div className='flex items-center justify-between gap-4'>
                          <div className='flex items-center gap-4'>
                            <Icon className='size-4.5 shrink-0 text-carbon-black' />
                            <div className='flex flex-wrap items-center gap-2'>
                              <p className='text-h5 font-medium text-carbon-black'>
                                {step.title}
                              </p>
                              <span
                                className={cn(
                                  'inline-flex h-6 items-center rounded-full px-3 text-label-sm',
                                  meta.badge,
                                )}
                              >
                                {meta.label}
                              </span>
                            </div>
                          </div>
                          <p className='shrink-0 text-body-md font-medium text-gray-500'>
                            {step.time}
                          </p>
                        </div>
                        <div className='mt-4 flex flex-col gap-4 pl-[34px]'>
                          <p className='text-body-lg text-gray-500'>
                            {step.desc}
                          </p>
                          <Link
                            href={step.href}
                            className='flex w-fit items-center gap-2 text-carbon-black transition-colors hover:text-primary'
                          >
                            <span className='text-body-lg font-semibold'>
                              {submitted ? 'Review answers' : meta.cta}
                            </span>
                            <ArrowRight className='size-4.5' />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </>
      )}
    </DashboardShell>
  );
}
