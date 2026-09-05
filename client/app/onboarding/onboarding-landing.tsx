'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Circle, CircleCheck, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { ONBOARDING_STEPS, stepRoute } from '@/lib/onboarding/steps';
import {
  useApplication,
  useSubmitApplication,
  stepStatusOf,
} from '@/lib/hooks/use-onboarding';
import { ApiError } from '@/lib/api/client';
import { useAuthStore, displayName } from '@/stores/authStore';
import { useMounted } from '@/lib/hooks/use-mounted';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';

export function OnboardingLanding() {
  const router = useRouter();
  const { data: app } = useApplication();
  const submit = useSubmitApplication();
  const user = useAuthStore((s) => s.user);
  const mounted = useMounted();

  const total = app?.totalSteps ?? ONBOARDING_STEPS.length;
  const doneCount = app?.completedCount ?? 0;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const stepsLeft = total - doneCount;
  const canSubmit = Boolean(app?.canSubmit);
  const submitted = app?.status === 1;
  const firstIncomplete =
    ONBOARDING_STEPS.find((s) => stepStatusOf(app, s.slug) !== 2) ??
    ONBOARDING_STEPS[0];

  const greeting =
    mounted && user
      ? `Welcome, ${user.firstName || displayName(user)}`
      : 'Welcome';

  const onSubmit = () => {
    submit.mutate(undefined, {
      onSuccess: () => {
        toast.success('Application submitted for review');
        // Submission unlocks the SME dashboard — take them straight there.
        router.push(ROUTES.sme.dashboard);
      },
      onError: (err) =>
        toast.error(
          err instanceof ApiError && err.status === 409
            ? 'Please complete every step before submitting.'
            : 'Unable to submit right now. Please try again.',
        ),
    });
  };

  return (
    <OnboardingShell
      currentStepTitle={firstIncomplete.title}
      title={greeting}
      subtitle='Complete every section and then submit for an Assessment Specialist review to unlock your Sustainability Finance score.'
    >
      {/* Progress card */}
      <div className='flex flex-col gap-6 rounded-2xl border border-border bg-white p-6 lg:p-7'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div className='flex flex-col gap-1'>
            <p className='text-sm text-muted-foreground'>Onboarding progress</p>
            <p className='text-2xl font-semibold text-carbon-black'>
              {doneCount} of {total} complete
            </p>
          </div>
          <div className='flex flex-col gap-1 sm:text-right'>
            <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
              Assessment status
            </p>
            {submitted ? (
              <p className='text-base font-medium text-success-600'>
                Submitted for review
              </p>
            ) : canSubmit ? (
              <p className='text-base font-medium text-success-600'>
                Ready to submit
              </p>
            ) : (
              <p className='text-base font-medium text-carbon-black'>
                {`${stepsLeft} step${stepsLeft === 1 ? '' : 's'} left to generate your Sustainability Finance Score.`}
              </p>
            )}
          </div>
        </div>
        <div className='h-2 w-full overflow-hidden rounded-full bg-gray-300'>
          <div
            className='h-full rounded-full bg-primary transition-all'
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Ready-to-submit card — shown once the backend reports canSubmit */}
        {canSubmit && !submitted && (
          <div className='flex flex-col gap-6 rounded-2xl border border-primary/50 bg-primary p-6 text-mineral-white'>
            <div className='flex items-start gap-3'>
              <CircleCheck className='size-6 shrink-0' />
              <div className='flex flex-col gap-1'>
                <p className='text-lg font-semibold'>
                  You&apos;re ready to submit
                </p>
                <p className='text-base'>
                  A JusKel Assessment Specialist will review your submission and
                  your evidence. Expect feedback in 5 working days. You&apos;ll
                  be notified when they begin, if they need clarification, and
                  when your score is published.
                </p>
              </div>
            </div>
            <button
              type='button'
              onClick={onSubmit}
              disabled={submit.isPending}
              className='inline-flex h-14 w-fit cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-5 text-base font-semibold text-primary shadow-xs transition-opacity hover:opacity-90 disabled:opacity-70'
            >
              {submit.isPending ? 'Submitting…' : 'Submit for review'}
              {submit.isPending ? (
                <Loader2 className='size-5 animate-spin' />
              ) : (
                <Send className='size-5' />
              )}
            </button>
          </div>
        )}

        {/* Already submitted — the dashboard is unlocked; give them the way in. */}
        {submitted && (
          <div className='flex flex-col gap-6 rounded-2xl border border-primary/50 bg-primary p-6 text-mineral-white'>
            <div className='flex items-start gap-3'>
              <CircleCheck className='size-6 shrink-0' />
              <div className='flex flex-col gap-1'>
                <p className='text-lg font-semibold'>Submitted for review</p>
                <p className='text-base'>
                  Your application is with a JusKel Assessment Specialist. Track
                  its status on your dashboard.
                </p>
              </div>
            </div>
            <Link
              href={ROUTES.sme.dashboard}
              className='inline-flex h-14 w-fit items-center justify-center gap-2 rounded-lg bg-white px-5 text-base font-semibold text-primary shadow-xs transition-opacity hover:opacity-90'
            >
              Go to your dashboard
              <ArrowRight className='size-5' />
            </Link>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className='flex flex-col gap-5'>
        <div className='flex flex-col gap-1'>
          <h2 className='text-xl font-semibold text-carbon-black'>
            Your onboarding timeline
          </h2>
          <p className='text-base text-muted-foreground'>
            Every step, its current state, what to do, and where to go.
          </p>
        </div>

        <ol className='flex flex-col'>
          {ONBOARDING_STEPS.map((step, i) => {
            const status = stepStatusOf(app, step.slug);
            const isDone = status === 2;
            const isLast = i === ONBOARDING_STEPS.length - 1;
            const Icon = step.icon;
            return (
              <li key={step.slug} className='flex gap-4 lg:gap-5'>
                {/* Rail */}
                <div className='flex flex-col items-center'>
                  {isDone ? (
                    <CircleCheck className='text-success-600' />
                  ) : (
                    <Circle className='text-gray-600' />
                  )}
                  {!isLast && <span className='w-0.5 flex-1 bg-gray-300' />}
                </div>

                {/* Card */}
                <div className='mb-4 flex-1'>
                  <div className='flex flex-col gap-3 rounded-2xl border border-border bg-white p-6'>
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
                        <span className='flex items-center gap-2'>
                          <Icon className='size-5 text-muted-foreground' />
                          <span className='text-base font-semibold text-carbon-black'>
                            {step.title}
                          </span>
                        </span>
                        <StatusBadge status={status} />
                      </div>
                      <span className='shrink-0 text-sm text-muted-foreground'>
                        {step.time}
                      </span>
                    </div>
                    <p className='text-base text-muted-foreground'>
                      {step.shortDescription}
                    </p>
                    <Link
                      href={stepRoute(step.slug)}
                      className='inline-flex w-fit items-center gap-2 text-base font-medium text-carbon-black transition-colors hover:text-primary'
                    >
                      {isDone ? 'Review' : 'Start'}
                      <ArrowRight className='size-4' />
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </OnboardingShell>
  );
}

function StatusBadge({ status }: { status: 0 | 1 | 2 }) {
  const map = {
    0: { label: 'Not Started', cls: 'bg-gray-200 text-gray-500' },
    1: { label: 'In Progress', cls: 'bg-warning-50 text-warning' },
    2: { label: 'Complete', cls: 'bg-success-50 text-success-600' },
  } as const;
  const { label, cls } = map[status];
  return (
    <span
      className={cn(
        'rounded-full px-3 py-1 text-[11px] font-normal leading-3.5',
        cls,
      )}
    >
      {label}
    </span>
  );
}
