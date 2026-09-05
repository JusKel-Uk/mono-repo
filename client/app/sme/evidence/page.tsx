import type { Metadata } from 'next';
import { FileText } from 'lucide-react';

import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardEmptyState } from '@/components/dashboard/empty-state';

export const metadata: Metadata = { title: 'Evidence' };

export default function EvidencePage() {
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
