import { Suspense } from 'react';
import type { Metadata } from 'next';

import { AcceptInvite } from './accept-invite';

export const metadata: Metadata = { title: 'Accept invite' };

export default function AcceptInvitePage() {
  // AcceptInvite reads the ?token via useSearchParams — needs a Suspense boundary.
  return (
    <Suspense>
      <AcceptInvite />
    </Suspense>
  );
}
