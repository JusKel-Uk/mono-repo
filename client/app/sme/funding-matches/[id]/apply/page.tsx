import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { FUNDING_MATCHES } from '@/lib/dashboard/funding-matches';
import { FundingApplyView } from './funding-apply-view';

export function generateStaticParams() {
  return FUNDING_MATCHES.map((m) => ({ id: m.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const match = FUNDING_MATCHES.find((m) => m.id === id);
  return { title: match ? `Apply — ${match.product}` : 'Apply for funding' };
}

export default async function FundingApplyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!FUNDING_MATCHES.some((m) => m.id === id)) notFound();
  return <FundingApplyView id={id} />;
}
