import { Suspense } from 'react';
import type { Metadata } from 'next';

import { LenderDashboardView } from '@/components/lender/lender-dashboard';

export const metadata: Metadata = { title: 'Lender Dashboard' };

export default function LenderDashboardPage() {
  return (
    <Suspense>
      <LenderDashboardView />
    </Suspense>
  );
}
