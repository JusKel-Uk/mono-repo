'use client';

import { useEffect } from 'react';

import { getMe, getToken } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/authStore';

/**
 * Restores the signed-in user into the auth store when a session token exists
 * but the store has no profile yet — e.g. a page reload after the persisted
 * store was cleared, a different browser, or arriving via the token cookie
 * without going through the login form's onSuccess.
 *
 * Runs once, after the persisted store has finished hydrating (so we don't
 * fetch when localStorage already has the user). A failed/expired token is a
 * no-op here — the route guard handles access separately.
 */
export function AuthHydrator() {
  useEffect(() => {
    const restore = () => {
      if (!getToken()) return; // not signed in
      if (useAuthStore.getState().user) return; // already known
      getMe()
        .then((me) =>
          useAuthStore.getState().setUser({
            id: me.id,
            email: me.email,
            firstName: me.firstName,
            lastName: me.lastName,
          }),
        )
        .catch(() => {
          /* invalid/expired token or API unreachable — leave store empty */
        });
    };

    if (useAuthStore.persist.hasHydrated()) {
      restore();
      return;
    }
    return useAuthStore.persist.onFinishHydration(restore);
  }, []);

  return null;
}
