'use client';

import { useRouter } from 'next/navigation';

import { ONBOARDING_BASE, nextStepRoute } from '@/lib/onboarding/steps';
import { useAssessmentLocked } from '@/lib/hooks/use-onboarding';
import { Button } from '@/components/ui/button';

const BTN = 'h-14 w-full lg:w-55 rounded-lg text-base font-semibold';

/**
 * Footer buttons for an onboarding step. While the assessment is editable these
 * save the step (Save and Exit / Save and Continue). Once it's submitted the
 * answers are read-only, so they become plain navigation — Exit / Next — that
 * make no API calls.
 */
export function OnboardingActions({
  formId,
  slug,
  loading = false,
  disabled = false,
  onSaveExit,
}: {
  formId: string;
  /** Current step slug — used to route "Next" without submitting. */
  slug: string;
  loading?: boolean;
  /** Disables Save-and-Continue until the step's required fields are valid. */
  disabled?: boolean;
  onSaveExit: () => void;
}) {
  const router = useRouter();
  const locked = useAssessmentLocked();

  if (locked) {
    const nextHref = nextStepRoute(slug) ?? ONBOARDING_BASE;
    return (
      <>
        <Button
          type='button'
          variant='outline'
          onClick={() => router.push(ONBOARDING_BASE)}
          className={`${BTN} border-gray-300 text-gray-700`}
        >
          Exit
        </Button>
        <Button
          type='button'
          onClick={() => router.push(nextHref)}
          className={BTN}
        >
          Next
        </Button>
      </>
    );
  }

  return (
    <>
      <Button
        type='button'
        variant='outline'
        onClick={onSaveExit}
        className={`${BTN} border-gray-300 text-gray-700`}
      >
        Save and Exit
      </Button>
      <Button
        type='submit'
        form={formId}
        loading={loading}
        disabled={disabled}
        className={BTN}
      >
        Save and Continue
      </Button>
    </>
  );
}
