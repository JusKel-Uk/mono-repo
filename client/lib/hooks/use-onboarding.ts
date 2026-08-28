'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/lib/api/client';
import {
  createApplication,
  getCurrentApplication,
  getLookups,
  submitApplication,
  type ApplicationProgress,
  type StepNumber,
  type StepStatus,
} from '@/lib/api/onboarding';
import {
  ONBOARDING_STEP,
  type EnumOption,
  type LookupSpec,
} from '@/lib/onboarding/enums';

/**
 * Server-authoritative onboarding state. TanStack Query owns the draft
 * application; the dashboard and step pages read from it, and mutations
 * invalidate it so progress (ticks, completion count, submit enablement)
 * always reflects the backend.
 */

export const onboardingKeys = {
  application: ['onboarding', 'application'] as const,
  step: (slug: string) => ['onboarding', 'step', slug] as const,
  lookups: ['onboarding', 'lookups'] as const,
};

/**
 * Backend-authoritative enum option sets (GET /lookups). Reference data, so it
 * is cached hard — one fetch per session.
 */
export function useLookups() {
  return useQuery({
    queryKey: onboardingKeys.lookups,
    queryFn: getLookups,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/**
 * Returns a getter for a lookup's options: the live backend set once loaded,
 * the hardcoded fallback until then (so selects render immediately, never empty).
 */
export function useLookupOptions() {
  const { data } = useLookups();
  return (spec: LookupSpec): EnumOption[] => {
    const fromApi = data?.options?.[spec.key];
    return fromApi && fromApi.length ? fromApi : spec.fallback;
  };
}

/** slug ⇆ backend OnboardingStep number. */
const SLUG_TO_STEP: Record<string, StepNumber> = {
  'company-setup': ONBOARDING_STEP.company,
  'business-profile': ONBOARDING_STEP.business,
  'financial-profile': ONBOARDING_STEP.financial,
  'sustainability-profile': ONBOARDING_STEP.sustainability,
  'funding-profile': ONBOARDING_STEP.funding,
};

/**
 * The draft application progress. Lazily creates the draft the first time
 * (GET current → 404 → POST applications → GET current), so a freshly
 * registered user gets one without an explicit bootstrap step.
 */
export function useApplication() {
  return useQuery({
    queryKey: onboardingKeys.application,
    queryFn: async (): Promise<ApplicationProgress> => {
      try {
        return await getCurrentApplication();
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          await createApplication();
          return getCurrentApplication();
        }
        throw err;
      }
    },
  });
}

/** Status for one step's slug (NotStarted when the app hasn't loaded yet). */
export function stepStatusOf(
  app: ApplicationProgress | undefined,
  slug: string,
): StepStatus {
  const step = SLUG_TO_STEP[slug];
  return app?.steps.find((s) => s.step === step)?.status ?? 0;
}

/** Submit the completed application, then refresh progress. */
export function useSubmitApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitApplication,
    onSuccess: (data) => {
      qc.setQueryData(onboardingKeys.application, data);
    },
  });
}
