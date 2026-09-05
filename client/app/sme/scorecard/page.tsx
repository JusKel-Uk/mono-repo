import type { Metadata } from 'next';
import { Info } from 'lucide-react';

import { ROUTES } from '@/lib/routes';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardEmptyState } from '@/components/dashboard/empty-state';

export const metadata: Metadata = { title: 'Scorecard' };

export default function ScorecardPage() {
  return (
    <DashboardShell
      title='Scorecard'
      subtitle='Your score will appear here once a Sustainability Expert has reviewed your submission.'
    >
      <DashboardEmptyState
        icon={Info}
        title='No score yet (awaiting review)'
        body="ESG scores are confirmed by a Sustainability Expert. You'll see the assessment outcome on your dashboard as soon as it's published."
        action={{ label: 'Back to Dashboard', href: ROUTES.sme.dashboard }}
      />
    </DashboardShell>
  );
}
