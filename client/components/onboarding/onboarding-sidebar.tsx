'use client';

import { useRouter } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  Building2,
  FileText,
  LayoutGrid,
  Link2,
  LogOut,
  Settings,
  Sparkles,
  SquarePen,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { logout } from '@/lib/api/auth';
import { useAuthStore, displayName } from '@/stores/authStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useMounted } from '@/lib/hooks/use-mounted';
import { JusKelLogo } from '@/components/brand/juskel-logo';

// The full SME app nav — locked during onboarding except "Assessment".
const NAV: { label: string; icon: LucideIcon; active?: boolean }[] = [
  { label: 'Dashboard', icon: LayoutGrid },
  { label: 'Assessment', icon: FileText, active: true },
  { label: 'Scorecard', icon: BarChart3 },
  { label: 'Evidence', icon: Building2 },
  { label: 'Funding matches', icon: Sparkles },
  { label: 'Recommendations', icon: SquarePen },
  { label: 'Integrations', icon: Link2 },
  { label: 'Reports', icon: BookOpen },
  { label: 'Settings', icon: Settings },
];

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function OnboardingSidebar({
  currentStepTitle,
}: {
  currentStepTitle: string;
}) {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);

  // Persisted store rehydrates client-side only — gate on mount to avoid a
  // hydration mismatch, then show the real signed-in user.
  const mounted = useMounted();
  const current = mounted ? authUser : null;
  const name = current ? displayName(current) : 'Your account';
  const email = current?.email ?? '';

  function handleLogout() {
    logout(); // clears the JWT
    useAuthStore.getState().clearUser();
    // Drop the onboarding draft so the next person on this browser can't see it.
    useOnboardingStore.getState().reset();
    router.push(ROUTES.auth.login);
  }

  return (
    <div className='flex h-full flex-col bg-white'>
      <div className='flex flex-1 flex-col gap-8 overflow-y-auto px-6 pt-8'>
        <JusKelLogo className='mx-auto text-carbon-black' />

        {/* Current step context + role */}
        <div className='border-y border-border py-6'>
          <div className='flex items-center gap-2'>
            <Building2 className='size-4.5 text-foreground-secondary' />
            <span className='text-sm font-medium text-foreground-secondary'>
              {currentStepTitle}
            </span>
          </div>
          <div className='mt-3 flex items-center gap-2'>
            <span className='rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-foreground-secondary'>
              ROLE
            </span>
            <span className='text-sm text-foreground-secondary'>
              SME team member
            </span>
          </div>
        </div>

        {/* Unlock callout */}
        <div className='rounded-xl border border-warning-200 bg-warning-50 p-4'>
          <p className='text-xs font-semibold text-gray-700'>
            Complete onboarding to unlock
          </p>
          <p className='mt-2 text-xs text-muted-foreground'>
            Dashboard, scorecard, matches, reports and integrations open once
            you submit for review.
          </p>
        </div>

        {/* Locked app nav (Assessment active) */}
        <nav className='flex flex-col gap-2 pb-6'>
          {NAV.map(({ label, icon: Icon, active }) => (
            <div
              key={label}
              aria-disabled={!active}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-3.5',
                active ? 'bg-primary text-mineral-white' : 'text-gray-300',
              )}
            >
              <Icon className='size-6 shrink-0' />
              <span
                className={cn(
                  'text-base',
                  active ? 'font-semibold' : 'font-normal',
                )}
              >
                {label}
              </span>
            </div>
          ))}
        </nav>
      </div>

      {/* Account footer */}
      <div className='border-t border-border px-6 py-4'>
        <div className='flex items-center justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <span className='flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-carbon-black'>
              {initials(name) || '—'}
            </span>
            <div className='min-w-0'>
              <p className='truncate text-sm font-semibold text-carbon-black'>
                {name}
              </p>
              {email && (
                <p className='truncate text-sm text-foreground-secondary'>
                  {email}
                </p>
              )}
            </div>
          </div>
          <button
            type='button'
            onClick={handleLogout}
            aria-label='Log out'
            className='rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-carbon-black cursor-pointer'
          >
            <LogOut className='size-5 text-destructive' />
          </button>
        </div>
      </div>
    </div>
  );
}
