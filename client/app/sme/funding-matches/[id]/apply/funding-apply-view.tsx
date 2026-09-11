'use client';

import { Hourglass } from 'lucide-react';

import { ROUTES } from '@/lib/routes';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useReviewStore } from '@/stores/reviewStore';
import { findMatch } from '@/lib/dashboard/funding-matches';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardEmptyState } from '@/components/dashboard/empty-state';
import { FundingApplyReviewed } from '@/components/dashboard/reviewed/funding-apply-reviewed';

export function FundingApplyView({ id }: { id: string }) {
  const mounted = useMounted();
  const published = useReviewStore((s) => s.phase === 'published');
  const match = findMatch(id);

  if (mounted && published && match) {
    return <FundingApplyReviewed match={match} />;
  }

  return (
    <DashboardShell
      title='Apply for funding'
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
