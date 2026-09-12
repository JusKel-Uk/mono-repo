import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { REPORT_PACKS } from '@/lib/dashboard/report-packs';
import { ReportPackView } from './report-pack-view';

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

  return <ReportPackView slug={pack} />;
}
