import type { Metadata } from 'next';

import { LenderProductFormView } from '@/components/lender/lender-product-form';

export const metadata: Metadata = { title: 'Add a funding product' };

export default function LenderAddProductPage() {
  return <LenderProductFormView />;
}
