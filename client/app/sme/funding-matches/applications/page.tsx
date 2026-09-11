import type { Metadata } from 'next';

import { FundingApplicationsView } from './funding-applications-view';

export const metadata: Metadata = { title: 'My applications' };

export default function FundingApplicationsPage() {
  return <FundingApplicationsView />;
}
