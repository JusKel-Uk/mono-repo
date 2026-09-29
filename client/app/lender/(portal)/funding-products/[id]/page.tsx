import type { Metadata } from 'next';

import { LenderProductFormView } from '@/components/lender/lender-product-form';

export const metadata: Metadata = { title: 'Edit funding product' };

export default async function LenderEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LenderProductFormView productId={id} />;
}
