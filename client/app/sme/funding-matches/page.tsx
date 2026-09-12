import type { Metadata } from 'next';

import { FundingMatchesView } from './funding-matches-view';

export const metadata: Metadata = { title: 'Funding matches' };

export default function FundingMatchesPage() {
  return <FundingMatchesView />;
}
