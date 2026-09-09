'use client';

import { FileText } from 'lucide-react';

import { useMounted } from '@/lib/hooks/use-mounted';
import { useReviewStore } from '@/stores/reviewStore';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardEmptyState } from '@/components/dashboard/empty-state';
import { EvidenceReviewed } from '@/components/dashboard/reviewed/evidence-reviewed';

export function EvidenceView() {
  const mounted = useMounted();
  const published = useReviewStore((s) => s.phase === 'published');

  // Review complete → the populated documents view.
  if (mounted && published) return <EvidenceReviewed />;

  // Otherwise the empty upload state.
  return (
    <DashboardShell
      title='Documents & evidence'
      subtitle='Upload evidence to support information requests and validate evidence. AI-assisted extraction identifies relevant information for review.'
    >
      <DashboardEmptyState
        icon={FileText}
        title='No documents yet'
        body='Upload your accounts, policies, certifications and other evidence to back up your self-declared information. Files up to 10 MB. PDF, DOC, PNG, JPG.'
        action={{ label: 'Upload your documents' }}
      />
    </DashboardShell>
  );
}
