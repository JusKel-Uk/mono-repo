'use client';

import { Info } from 'lucide-react';

import { ROUTES } from '@/lib/routes';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useReviewStore } from '@/stores/reviewStore';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardEmptyState } from '@/components/dashboard/empty-state';
import { ScorecardScored } from '@/components/dashboard/reviewed/scorecard-scored';

export function ScorecardView() {
  const mounted = useMounted();
  const published = useReviewStore((s) => s.phase === 'published');

  // Review complete → the full scored scorecard.
  if (mounted && published) return <ScorecardScored />;

  // Otherwise the awaiting-review empty state.
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
