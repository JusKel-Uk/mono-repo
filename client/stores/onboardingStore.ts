import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type {
  CompanySetupInput,
  BusinessProfileInput,
  FinancialProfileInput,
  SustainabilityProfileInput,
  FundingProfileInput,
} from '@/lib/validations/onboarding';

/**
 * Draft state for the multi-step onboarding wizard. Each step saves its values
 * here on Save-and-Continue / Save-and-Exit, so data carries across steps and
 * survives a reload (persisted to localStorage). Add a slice per new step.
 */
type OnboardingData = {
  companySetup?: CompanySetupInput;
  businessProfile?: BusinessProfileInput;
  financialProfile?: FinancialProfileInput;
  sustainabilityProfile?: SustainabilityProfileInput;
  fundingProfile?: FundingProfileInput;
};

type OnboardingState = {
  data: OnboardingData;
  /** step slug → whether it has been completed (valid + saved). */
  completed: Record<string, boolean>;
  saveStep: <K extends keyof OnboardingData>(
    key: K,
    values: OnboardingData[K],
  ) => void;
  markComplete: (slug: string) => void;
  isComplete: (slug: string) => boolean;
  reset: () => void;
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      data: {},
      completed: {},
      saveStep: (key, values) =>
        set((s) => ({ data: { ...s.data, [key]: values } })),
      markComplete: (slug) =>
        set((s) => ({ completed: { ...s.completed, [slug]: true } })),
      isComplete: (slug) => Boolean(get().completed[slug]),
      reset: () => set({ data: {}, completed: {} }),
    }),
    {
      name: 'juskel-onboarding',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ data: s.data, completed: s.completed }),
    },
  ),
);
