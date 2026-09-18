import { Suspense } from 'react';
import type { Metadata } from 'next';

import { LenderResetPasswordForm } from './lender-reset-password-form';

export const metadata: Metadata = { title: 'Set a new password' };

export default function LenderResetPasswordPage() {
  return (
    <Suspense>
      <LenderResetPasswordForm />
    </Suspense>
  );
}
