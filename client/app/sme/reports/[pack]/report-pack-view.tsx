'use client';

import { ROUTES } from '@/lib/routes';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useReviewStore } from '@/stores/reviewStore';
import {
  BUILT_REPORTS,
  REPORT_CONTENT,
  REPORT_PACKS,
  type ReportPack,
} from '@/lib/dashboard/report-packs';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardEmptyState } from '@/components/dashboard/empty-state';
import { ReportPackReviewed } from '@/components/dashboard/reviewed/report-pack-reviewed';
import { DisclosureReviewed } from '@/components/dashboard/reviewed/disclosure-reviewed';
import { AuditAssuranceReviewed } from '@/components/dashboard/reviewed/audit-assurance-reviewed';
import { ComplianceReviewed } from '@/components/dashboard/reviewed/compliance-reviewed';

export function ReportPackView({ slug }: { slug: string }) {
  const mounted = useMounted();
  const published = useReviewStore((s) => s.phase === 'published');

  const pack = REPORT_PACKS.find((p) => p.slug === slug) as ReportPack;

  // Review complete and this pack's report is built → the populated report.
  if (mounted && published && BUILT_REPORTS.has(slug)) {
    switch (slug) {
      case 'esg-intelligence':
        return <ReportPackReviewed pack={pack} sections={REPORT_CONTENT[slug]} />;
      case 'disclosure':
        return <DisclosureReviewed pack={pack} />;
      case 'audit-assurance':
        return <AuditAssuranceReviewed pack={pack} />;
      case 'compliance-regulatory':
        return <ComplianceReviewed pack={pack} />;
    }
  }

  // Otherwise the locked/awaiting empty state.
  return (
    <DashboardShell title={pack.name} subtitle={pack.pageSubtitle}>
      <DashboardEmptyState
        icon={pack.icon}
        title='Locked until review completes'
        body={pack.lockedBody}
        action={{ label: 'View review status', href: ROUTES.sme.dashboard }}
      />
    </DashboardShell>
  );
}
