import type { Metadata } from 'next';
import { Hourglass } from 'lucide-react';

import { ROUTES } from '@/lib/routes';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardEmptyState } from '@/components/dashboard/empty-state';

export const metadata: Metadata = { title: 'Funding matches' };

export default function FundingMatchesPage() {
  return (
    <DashboardShell
      title='Funding matches'
      subtitle='Your funding matches will appear here when your Sustainability Finance assessment is reviewed and published.'
    >
      <DashboardEmptyState
        icon={Hourglass}
        title='Locked until review completes'
        body="Matches are held back until your ESG Specialist review is complete as we won't surface funders before your assessment review is complete."
        action={{ label: 'View review status', href: ROUTES.sme.dashboard }}
      />
    </DashboardShell>
  );
}
