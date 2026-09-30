import type { Metadata } from 'next';

import { LenderTermsView } from '@/components/lender/lender-terms';

export const metadata: Metadata = { title: 'Terms & agreements' };

export default function LenderTermsPage() {
  return <LenderTermsView />;
}
