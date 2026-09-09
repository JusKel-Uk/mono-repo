import { redirect } from 'next/navigation';

import { ROUTES } from '@/lib/routes';

// Onboarding now lives under the Assessment hub; keep the old entry point
// working by redirecting to it.
export default function OnboardingPage() {
  redirect(ROUTES.sme.assessment);
}
