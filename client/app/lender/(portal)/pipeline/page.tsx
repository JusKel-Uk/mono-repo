import type { Metadata } from 'next';

import { LenderPipelineView } from '@/components/lender/lender-pipeline';

export const metadata: Metadata = { title: 'Pipeline' };

export default function LenderPipelinePage() {
  return <LenderPipelineView />;
}
