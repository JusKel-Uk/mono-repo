import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * TEMPORARY frontend stand-in for the assessment review lifecycle, used while
 * there's no backend driver for it. Phases:
 *  - `none`      — not submitted; dashboard pages are locked.
 *  - `submitted` — submitted, awaiting a reviewer.
 *  - `review`    — a Sustainability Expert is reviewing.
 *  - `published` — review complete; the scored dashboard + outputs are unlocked.
 * Any phase other than `none` unlocks the dashboard pages (see the gate in
 * DashboardShell / AppSidebar). Persisted, and cleared on logout.
 *
 * TODO(backend): replace with the server's review status once it's wired, then
 * delete this store, the ReviewPhaseSwitcher, and their call sites.
 */
export type ReviewPhase = 'none' | 'submitted' | 'review' | 'published';

type ReviewState = {
  phase: ReviewPhase;
  setPhase: (phase: ReviewPhase) => void;
  /** Enter the "submitted, awaiting review" phase (set on assessment submit). */
  markSubmitted: () => void;
  reset: () => void;
};

export const useReviewStore = create<ReviewState>()(
  persist(
    (set) => ({
      phase: 'none',
      setPhase: (phase) => set({ phase }),
      markSubmitted: () => set({ phase: 'submitted' }),
      reset: () => set({ phase: 'none' }),
    }),
    {
      name: 'juskel-review',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ phase: s.phase }),
    },
  ),
);
