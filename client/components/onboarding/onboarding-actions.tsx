import { Button } from '@/components/ui/button';

/** Save-and-Exit / Save-and-Continue footer buttons for an onboarding step. */
export function OnboardingActions({
  formId,
  loading = false,
  disabled = false,
  onSaveExit,
}: {
  formId: string;
  loading?: boolean;
  /** Disables Save-and-Continue until the step's required fields are valid. */
  disabled?: boolean;
  onSaveExit: () => void;
}) {
  return (
    <>
      <Button
        type='button'
        variant='outline'
        onClick={onSaveExit}
        className='h-14 w-full lg:w-55 cursor-pointer rounded-lg border-gray-300 text-base font-semibold text-gray-700'
      >
        Save and Exit
      </Button>
      <Button
        type='submit'
        form={formId}
        loading={loading}
        disabled={disabled}
        className='h-14 w-full lg:w-55 cursor-pointer rounded-lg text-base font-semibold'
      >
        Save and Continue
      </Button>
    </>
  );
}
