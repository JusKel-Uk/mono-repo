import type { LucideIcon } from 'lucide-react';
import { Briefcase, Building2, Coins, Landmark, Leaf } from 'lucide-react';

/**
 * Onboarding step registry — the multi-step SME assessment wizard.
 * Order here drives the timeline, sidebar context, progress, and
 * Save-and-Continue navigation. Add a step + a page under
 * app/onboarding/<slug> to build it.
 */

export type OnboardingStep = {
  slug: string;
  /** Header title + sidebar current-step label. */
  title: string;
  subtitle: string;
  /** "Why we ask" banner copy — omitted on steps that don't use the banner. */
  whyWeAsk?: string;
  /** One-line summary for the landing timeline. */
  shortDescription: string;
  /** Estimated time, e.g. "3 mins". */
  time: string;
  icon: LucideIcon;
  /** Whether the step's page exists yet. */
  built: boolean;
};

export const ONBOARDING_BASE = '/onboarding';

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    slug: 'company-setup',
    title: 'Set up your company',
    subtitle:
      "Enter your Companies House number to auto-fill and verify your information or fill the form manually.",
    whyWeAsk:
      'We use these details to verify your organisation and personalise your Sustainability Finance Assessment.',
    shortDescription: 'Legal name, registration, your role, and business basics.',
    time: '3 mins',
    icon: Building2,
    built: true,
  },
  {
    slug: 'business-profile',
    title: 'Business profile',
    subtitle: 'Tell us about your company so we can match you with the right funding.',
    whyWeAsk:
      'Sector determines which sustainability topics are relevant to your business.',
    shortDescription: 'Sector, location, employees, and years in operation.',
    time: '3 mins',
    icon: Briefcase,
    built: true,
  },
  {
    slug: 'financial-profile',
    title: 'Financial profile',
    subtitle:
      'Connect a source for evidence-backed data or self-declare bands with supporting documents.',
    shortDescription: 'Revenue, EBITDA band, existing debt, and cash reserves.',
    time: '4 mins',
    icon: Landmark,
    built: true,
  },
  {
    slug: 'sustainability-profile',
    title: 'Sustainability profile',
    subtitle:
      'Answering this helps us to know what your sustainability practices are currently.',
    shortDescription: 'Emissions, energy, waste, and ESG policy and certifications.',
    time: '5 mins',
    icon: Leaf,
    built: true,
  },
  {
    slug: 'funding-profile',
    title: 'Funding profile',
    subtitle:
      "Tell us what you're looking for and we'll match this against real eligibility.",
    shortDescription: 'Amount needed, purpose, term, urgency.',
    time: '2 mins',
    icon: Coins,
    built: true,
  },
];

export function stepRoute(slug: string): string {
  return `${ONBOARDING_BASE}/${slug}`;
}

export function getStep(slug: string): OnboardingStep | undefined {
  return ONBOARDING_STEPS.find((s) => s.slug === slug);
}

export function stepIndex(slug: string): number {
  return ONBOARDING_STEPS.findIndex((s) => s.slug === slug);
}

/** Route of the next step, or null if this is the last step. */
export function nextStepRoute(slug: string): string | null {
  const i = stepIndex(slug);
  const next = ONBOARDING_STEPS[i + 1];
  return next ? stepRoute(next.slug) : null;
}
