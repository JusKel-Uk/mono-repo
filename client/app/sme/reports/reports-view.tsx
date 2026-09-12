'use client';

import { Folder } from 'lucide-react';

import { ROUTES } from '@/lib/routes';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useReviewStore } from '@/stores/reviewStore';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardEmptyState } from '@/components/dashboard/empty-state';
import { ReportsReviewed } from '@/components/dashboard/reviewed/reports-reviewed';

export function ReportsView() {
  const mounted = useMounted();
  const published = useReviewStore((s) => s.phase === 'published');

  // Review complete → the populated reports hub.
  if (mounted && published) return <ReportsReviewed />;

  // Otherwise the locked empty state.
  return (
    <DashboardShell
      title='Reports & disclosures'
      subtitle='Generate structured reports and disclosure outputs using the information and evidence already in your profile.'
    >
      <DashboardEmptyState
        icon={Folder}
        title='Locked until review completes'
        body='Reports appear once your Sustainability Finance assessment is published.'
        action={{ label: 'View review status', href: ROUTES.sme.dashboard }}
      />
    </DashboardShell>
  );
}
