import { Suspense } from 'react';

import { FinancialProfileForm } from './financial-profile-form';

export default function FinancialProfilePage() {
  // FinancialProfileForm reads the OAuth callback params via useSearchParams,
  // which must sit under a Suspense boundary.
  return (
    <Suspense>
      <FinancialProfileForm />
    </Suspense>
  );
}
