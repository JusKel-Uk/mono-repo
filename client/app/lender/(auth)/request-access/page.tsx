import type { Metadata } from 'next';

import { LenderRequestAccessForm } from './lender-request-access-form';

export const metadata: Metadata = { title: 'Request lender access' };

export default function LenderRequestAccessPage() {
  return <LenderRequestAccessForm />;
}
