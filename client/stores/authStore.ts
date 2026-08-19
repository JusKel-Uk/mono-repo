import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Authenticated user profile. The JWT itself stays in the api client
 * (`lib/api/auth.ts`) since the fetch layer needs it synchronously; this store
 * holds the display profile and is the source of truth for "who is signed in".
 */
export type AuthUser = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email: string;
};

type AuthState = {
  user: AuthUser | null;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set((s) => ({ user: { ...s.user, ...user } })),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'juskel-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user }),
    },
  ),
);

/** Full name if we have it, otherwise the email's local part. */
export function displayName(user: AuthUser | null): string {
  if (!user) return '';
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return full || user.email.split('@')[0];
}
