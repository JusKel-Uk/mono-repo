'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowRight, Circle, CircleCheck } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ONBOARDING_STEPS, stepRoute } from '@/lib/onboarding/steps';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';

const EMPTY: Record<string, boolean> = {};

/** False during SSR + the first client (hydration) render, true thereafter. */
function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function OnboardingLanding() {
  const storeCompleted = useOnboardingStore((s) => s.completed);
  const mounted = useMounted();
  const completed = mounted ? storeCompleted : EMPTY;
  const total = ONBOARDING_STEPS.length;
  const doneCount = ONBOARDING_STEPS.filter((s) => completed[s.slug]).length;
  const pct = Math.round((doneCount / total) * 100);
  const stepsLeft = total - doneCount;
  const firstIncomplete =
    ONBOARDING_STEPS.find((s) => !completed[s.slug]) ?? ONBOARDING_STEPS[0];

  return (
    <OnboardingShell
      currentStepTitle={firstIncomplete.title}
      title='Welcome, Flourish'
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
            <p className='text-base font-medium text-carbon-black'>
              {stepsLeft === 0
                ? 'All steps complete — submit for review.'
                : `${stepsLeft} step${stepsLeft === 1 ? '' : 's'} left to generate your Sustainability Finance Score.`}
            </p>
          </div>
        </div>
        <div className='h-2 w-full overflow-hidden rounded-full bg-gray-300'>
          <div
            className='h-full rounded-full bg-primary transition-all'
            style={{ width: `${pct}%` }}
          />
        </div>
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
            const isDone = Boolean(completed[step.slug]);
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
                        <StatusBadge done={isDone} />
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

function StatusBadge({ done }: { done: boolean }) {
  return (
    <span
      className={cn(
        'rounded-full px-3 py-1 text-[11px] font-normal leading-3.5',
        done ? 'bg-success-50 text-success-600' : 'bg-gray-200 text-gray-500',
      )}
    >
      {done ? 'Complete' : 'Not Started'}
    </span>
  );
}
