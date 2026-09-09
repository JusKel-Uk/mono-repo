import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * TEMPORARY frontend stand-in for "the assessment has been submitted for
 * review". It gates access to the dashboard pages: they open only once
 * `submitted` is true. Persisted so it survives a reload, and cleared on
 * logout (see `useLogout`).
 *
 * TODO(backend): replace with the server's submission status
 * (ApplicationProgress.submittedAt / status) once it's reliably wired, then
 * delete this store and its call sites.
 */
type ReviewState = {
  submitted: boolean;
  setSubmitted: (value: boolean) => void;
  reset: () => void;
};

export const useReviewStore = create<ReviewState>()(
  persist(
    (set) => ({
      submitted: false,
      setSubmitted: (value) => set({ submitted: value }),
      reset: () => set({ submitted: false }),
    }),
    {
      name: 'juskel-review',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ submitted: s.submitted }),
    },
  ),
);
