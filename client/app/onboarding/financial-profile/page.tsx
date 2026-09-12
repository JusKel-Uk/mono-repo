'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { ROUTES } from '@/lib/routes';

/**
 * Backward-compat: older integration OAuth callbacks redirected here. The
 * financial-profile step now lives at `/sme/assessment/financial-profile`, so
 * forward there preserving the `?integration&status` query (that page owns the
 * callback handling, including any `oauthReturn` hand-off).
 */
export default function FinancialProfileOAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace(
      `${ROUTES.sme.assessment}/financial-profile${window.location.search}`,
    );
  }, [router]);

  return null;
}
