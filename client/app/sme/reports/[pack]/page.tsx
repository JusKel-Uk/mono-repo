import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ROUTES } from '@/lib/routes';
import { REPORT_PACKS } from '@/lib/dashboard/report-packs';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardEmptyState } from '@/components/dashboard/empty-state';

export function generateStaticParams() {
  return REPORT_PACKS.map((p) => ({ pack: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pack: string }>;
}): Promise<Metadata> {
  const { pack } = await params;
  const cfg = REPORT_PACKS.find((p) => p.slug === pack);
  return { title: cfg?.name ?? 'Report' };
}

export default async function ReportPackPage({
  params,
}: {
  params: Promise<{ pack: string }>;
}) {
  const { pack } = await params;
  const cfg = REPORT_PACKS.find((p) => p.slug === pack);
  if (!cfg) notFound();

  return (
    <DashboardShell title={cfg.name} subtitle={cfg.pageSubtitle}>
      <DashboardEmptyState
        icon={cfg.icon}
        title='Locked until review completes'
        body={cfg.lockedBody}
        action={{ label: 'View review status', href: ROUTES.sme.dashboard }}
      />
    </DashboardShell>
  );
}
