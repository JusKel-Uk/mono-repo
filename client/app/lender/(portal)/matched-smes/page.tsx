import type { Metadata } from 'next';

import { LenderMatchedSmesView } from '@/components/lender/lender-matched-smes';

export const metadata: Metadata = { title: 'Matched SMEs' };

export default function LenderMatchedSmesPage() {
  return <LenderMatchedSmesView />;
}
