import type { Metadata } from 'next';
import { TrendingUp } from 'lucide-react';

import { ROUTES } from '@/lib/routes';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardEmptyState } from '@/components/dashboard/empty-state';

export const metadata: Metadata = { title: 'Recommendations' };

export default function RecommendationsPage() {
  return (
    <DashboardShell
      title='Recommendations'
      subtitle='See a variety of actions you can implement to improve your Sustainability Finance readiness and underlying assessment areas.'
    >
      <DashboardEmptyState
        icon={TrendingUp}
        title='Locked until review completes'
        body='Recommendations appear once a Sustainability Expert has reviewed your evidence.'
        action={{ label: 'View review status', href: ROUTES.sme.dashboard }}
      />
    </DashboardShell>
  );
}
