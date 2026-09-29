import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * TEMPORARY frontend stand-in for the lender onboarding gate, used while there's
 * no backend driver for it. Stages:
 *  - `terms`        — first entry; must accept the lender Terms of Use.
 *  - `organisation` — terms accepted; must complete the organisation profile.
 *  - `verified`     — onboarding complete; the portal nav is unlocked.
 * Anything other than `verified` keeps the sidebar locked and routes the lender
 * to the current onboarding step (see the gate in LenderShell / LenderSidebar).
 * Persisted, so it survives reloads; cleared on sign-out.
 *
 * TODO(backend): replace with the server's onboarding status once wired, then
 * delete this store, the LenderOnboardingSwitcher, and their call sites.
 */
export type LenderStage = 'terms' | 'organisation' | 'verified';
/**
 * Once verified, which dashboard the lender sees:
 *  - `new`      — just onboarded: empty-state dashboard (no products/matches yet).
 *  - `existing` — an established lender: the populated dashboard.
 */
export type LenderUserType = 'new' | 'existing';

type LenderOnboardingState = {
  stage: LenderStage;
  userType: LenderUserType;
  setStage: (stage: LenderStage) => void;
  setUserType: (userType: LenderUserType) => void;
  acceptTerms: () => void;
  completeOrganisation: () => void;
  reset: () => void;
};

export const useLenderOnboardingStore = create<LenderOnboardingState>()(
  persist(
    (set) => ({
      stage: 'terms',
      userType: 'existing',
      setStage: (stage) => set({ stage }),
      setUserType: (userType) => set({ userType }),
      acceptTerms: () => set({ stage: 'organisation' }),
      // Finishing onboarding makes them a brand-new lender (empty dashboard).
      completeOrganisation: () => set({ stage: 'verified', userType: 'new' }),
      reset: () => set({ stage: 'terms', userType: 'existing' }),
    }),
    {
      name: 'juskel-lender-onboarding',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ stage: s.stage, userType: s.userType }),
    },
  ),
);
