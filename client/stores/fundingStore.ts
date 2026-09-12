import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * TEMPORARY frontend stand-in for funding-match shortlisting + applications,
 * used while there's no backend for it. Holds the ids of saved matches and of
 * matches the user has submitted an application for. Persisted, cleared on
 * logout.
 *
 * TODO(backend): replace with server state once the funding endpoints exist.
 */
type FundingState = {
  saved: string[];
  applied: string[];
  toggleSaved: (id: string) => void;
  addApplication: (id: string) => void;
  reset: () => void;
};

export const useFundingStore = create<FundingState>()(
  persist(
    (set) => ({
      saved: [],
      applied: [],
      toggleSaved: (id) =>
        set((s) => ({
          saved: s.saved.includes(id)
            ? s.saved.filter((x) => x !== id)
            : [...s.saved, id],
        })),
      addApplication: (id) =>
        set((s) => ({
          applied: s.applied.includes(id) ? s.applied : [...s.applied, id],
        })),
      reset: () => set({ saved: [], applied: [] }),
    }),
    {
      name: 'juskel-funding',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ saved: s.saved, applied: s.applied }),
    },
  ),
);
