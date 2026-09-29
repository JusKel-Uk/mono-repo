import { Suspense } from 'react';
import type { Metadata } from 'next';

import { LenderFundingProductsView } from '@/components/lender/lender-funding-products';

export const metadata: Metadata = { title: 'Funding products' };

export default function LenderFundingProductsPage() {
  return (
    <Suspense>
      <LenderFundingProductsView />
    </Suspense>
  );
}
