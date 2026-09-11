import type { Metadata } from 'next';

import { FundingSavedView } from './funding-saved-view';

export const metadata: Metadata = { title: 'Saved funding matches' };

export default function SavedFundingMatchesPage() {
  return <FundingSavedView />;
}
