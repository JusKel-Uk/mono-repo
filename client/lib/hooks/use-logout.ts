'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { ROUTES } from '@/lib/routes';
import { logout } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useReviewStore } from '@/stores/reviewStore';

/**
 * Full sign-out for this browser: best-effort server logout + clear the JWT,
 * wipe the persisted auth and onboarding stores, and drop the entire React
 * Query cache. Clearing the cache is what stops a fresh login from briefly
 * showing the previous account's data (application status, org, profiles)
 * until a manual refresh. Redirects to the login page.
 */
export function useLogout() {
  const router = useRouter();
  const qc = useQueryClient();
  return useCallback(() => {
    logout(); // best-effort server session revoke + clears the JWT
    useAuthStore.getState().clearUser();
    useOnboardingStore.getState().reset();
    useReviewStore.getState().reset(); // temporary submit-for-review gate
    qc.clear(); // drop all cached queries so the next account starts clean
    router.push(ROUTES.auth.login);
  }, [qc, router]);
}
