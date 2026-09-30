import type { Metadata } from 'next';

import { LenderSetupOrgView } from '@/components/lender/lender-setup-organisation';

export const metadata: Metadata = { title: 'Set up your organisation' };

export default function LenderSetUpOrganisationPage() {
  return <LenderSetupOrgView />;
}
