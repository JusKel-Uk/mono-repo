import type { Metadata } from 'next';

import { ScorecardView } from './scorecard-view';

export const metadata: Metadata = { title: 'Scorecard' };

export default function ScorecardPage() {
  return <ScorecardView />;
}
