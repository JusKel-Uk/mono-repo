import { AppSidebar } from '@/components/app-sidebar';

/** Onboarding sidebar: locked app nav + current-step context and unlock callout. */
export function OnboardingSidebar({
  currentStepTitle,
}: {
  currentStepTitle: string;
}) {
  return (
    <AppSidebar
      locked={false}
      context={{
        title: currentStepTitle,
        badge: 'ROLE',
        subtitle: 'SME team member',
      }}
      callout={
        <div className='rounded-xl border border-warning-200 bg-warning-50 p-4'>
          <p className='text-xs font-semibold text-gray-700'>
            Complete onboarding to unlock
          </p>
          <p className='mt-2 text-xs text-muted-foreground'>
            Dashboard, scorecard, matches, reports and integrations open once
            you submit for review.
          </p>
        </div>
      }
    />
  );
}
