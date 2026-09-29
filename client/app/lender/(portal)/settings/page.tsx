import { Suspense } from 'react';
import type { Metadata } from 'next';

import { LenderSettingsView } from '@/components/lender/lender-settings';

export const metadata: Metadata = { title: 'Settings' };

export default function LenderSettingsPage() {
  return (
    <Suspense>
      <LenderSettingsView />
    </Suspense>
  );
}
