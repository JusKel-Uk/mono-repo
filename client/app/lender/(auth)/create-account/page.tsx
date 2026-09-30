import { Suspense } from 'react';
import type { Metadata } from 'next';

import { LenderCreateAccountForm } from './lender-create-account-form';

export const metadata: Metadata = { title: 'Create lender account' };

export default function LenderCreateAccountPage() {
  return (
    <Suspense>
      <LenderCreateAccountForm />
    </Suspense>
  );
}
