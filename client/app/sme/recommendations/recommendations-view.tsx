'use client';

import { TrendingUp } from 'lucide-react';

import { ROUTES } from '@/lib/routes';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useReviewStore } from '@/stores/reviewStore';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardEmptyState } from '@/components/dashboard/empty-state';
import { RecommendationsReviewed } from '@/components/dashboard/reviewed/recommendations-reviewed';

export function RecommendationsView() {
  const mounted = useMounted();
  const published = useReviewStore((s) => s.phase === 'published');

  // Review complete → the tabbed recommendations list.
  if (mounted && published) return <RecommendationsReviewed />;

  // Otherwise the locked empty state.
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
