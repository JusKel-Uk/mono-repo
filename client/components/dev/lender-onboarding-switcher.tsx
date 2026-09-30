'use client';

import { useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { useMounted } from '@/lib/hooks/use-mounted';
import {
  useLenderOnboardingStore,
  type LenderStage,
  type LenderUserType,
} from '@/stores/lenderOnboardingStore';

/**
 * TEMPORARY dev control — a floating switcher for the lender onboarding stage,
 * so the gated states (Terms → Set up organisation → verified portal) can be
 * toggled without a backend. Rendered once from LenderShell, so it appears on
 * every lender page. Mirrors ReviewPhaseSwitcher / the lender auth switcher.
 *
 * TODO(backend): remove alongside lenderOnboardingStore once onboarding status
 * is server-driven.
 */
type Option = {
  key: string;
  label: string;
  stage: LenderStage;
  userType?: LenderUserType;
  href: string;
};

const OPTIONS: Option[] = [
  { key: 'terms', label: 'Terms', stage: 'terms', href: ROUTES.lender.terms },
  {
    key: 'organisation',
    label: 'Organisation',
    stage: 'organisation',
    href: ROUTES.lender.setUpOrganisation,
  },
  {
    key: 'new',
    label: 'New user',
    stage: 'verified',
    userType: 'new',
    href: ROUTES.lender.dashboard,
  },
  {
    key: 'existing',
    label: 'Existing user',
    stage: 'verified',
    userType: 'existing',
    href: ROUTES.lender.dashboard,
  },
];

export function LenderOnboardingSwitcher() {
  const mounted = useMounted();
  const router = useRouter();
  const stage = useLenderOnboardingStore((s) => s.stage);
  const userType = useLenderOnboardingStore((s) => s.userType);
  const setStage = useLenderOnboardingStore((s) => s.setStage);
  const setUserType = useLenderOnboardingStore((s) => s.setUserType);

  if (!mounted) return null;

  return (
    <div className='fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col gap-1.5 rounded-xl border border-gray-300 bg-white p-2 shadow-lg'>
      <span className='px-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400'>
        Dev · lender onboarding
      </span>
      <div className='flex flex-col gap-1 items-start'>
        {OPTIONS.map((o) => {
          const active = o.userType
            ? stage === 'verified' && userType === o.userType
            : stage === o.stage;
          return (
            <button
              key={o.key}
              type='button'
              onClick={() => {
                setStage(o.stage);
                if (o.userType) setUserType(o.userType);
                router.push(o.href);
              }}
              className={cn(
                'rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors sm:text-center',
                active
                  ? 'bg-primary text-mineral-white'
                  : 'text-gray-700 hover:bg-muted',
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
