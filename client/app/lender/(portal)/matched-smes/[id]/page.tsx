import type { Metadata } from 'next';

import { LenderSmeSummaryView } from '@/components/lender/lender-sme-summary';

export const metadata: Metadata = { title: 'SME summary' };

export default async function LenderSmeSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LenderSmeSummaryView smeId={id} />;
}
