import type { Metadata } from 'next';

import { AssessmentView } from './assessment-view';

export const metadata: Metadata = { title: 'Assessment' };

export default function AssessmentPage() {
  return <AssessmentView />;
}
