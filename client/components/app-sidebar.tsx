'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
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

/** The context block under the logo — identical layout for onboarding + dashboard. */
export type SidebarContext = { title: string; badge: string; subtitle: string };

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { logout } from '@/lib/api/auth';
import { useAuthStore, displayName, initials } from '@/stores/authStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useMounted } from '@/lib/hooks/use-mounted';
import { JusKelLogo } from '@/components/brand/juskel-logo';

/** The SME app nav. "Assessment" is the active item while onboarding is locked. */
export const SME_NAV: { label: string; icon: LucideIcon; href: string }[] = [
  { label: 'Dashboard', icon: LayoutGrid, href: ROUTES.sme.dashboard },
  { label: 'Assessment', icon: FileText, href: ROUTES.sme.assessment },
  { label: 'Scorecard', icon: BarChart3, href: ROUTES.sme.scorecard },
  { label: 'Evidence', icon: Building2, href: ROUTES.sme.evidence },
  { label: 'Funding matches', icon: Sparkles, href: ROUTES.sme.fundingMatches },
  {
    label: 'Recommendations',
    icon: SquarePen,
    href: ROUTES.sme.recommendations,
  },
  { label: 'Integrations', icon: Link2, href: ROUTES.sme.integrations },
  { label: 'Reports', icon: BookOpen, href: ROUTES.sme.reports },
  { label: 'Settings', icon: Settings, href: ROUTES.sme.settings },
];

/**
 * Shared SME sidebar (logo + context + nav + account footer). One source of
 * truth for both phases:
 *  - `locked` (onboarding): nav items are non-navigable, "Assessment" highlighted.
 *  - unlocked (dashboard): nav items are route-aware links.
 * `top` is the mode-specific context block rendered under the logo.
 */
export function AppSidebar({
  locked = false,
  context,
  callout,
}: {
  locked?: boolean;
  /** Icon + title / badge + subtitle block — same styling in both modes. */
  context: SidebarContext;
  /** Onboarding-only extra rendered under the context block (unlock callout). */
  callout?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Persisted store rehydrates client-side only — gate on mount to avoid a
  // hydration mismatch, then show the real signed-in user.
  const mounted = useMounted();
  const authUser = useAuthStore((s) => s.user);
  const user = mounted ? authUser : null;
  const name = user ? displayName(user) : 'Your account';
  const email = user?.email ?? '';

  function handleLogout() {
    logout(); // clears the JWT
    useAuthStore.getState().clearUser();
    // Drop the onboarding draft so the next person on this browser can't see it.
    useOnboardingStore.getState().reset();
    router.push(ROUTES.auth.login);
  }

  return (
    <div className='flex h-full flex-col bg-white'>
      <div className='flex flex-1 flex-col gap-8 overflow-y-auto pt-8'>
        <JusKelLogo className='mx-auto text-carbon-black' />

        {/* Context block — identical for both; only the text differs */}
        <div className='border-y border-gray-200 px-6 py-6'>
          <div className='flex items-center gap-2'>
            <Building2 className='size-4.5 text-gray-600' />
            <span className='text-body-sm font-medium text-gray-600'>
              {context.title}
            </span>
          </div>
          <div className='mt-3 flex items-center gap-2'>
            <span className='flex h-7 items-center rounded-full bg-gray-200 px-3 text-label-md font-semibold text-gray-600'>
              {context.badge}
            </span>
            <span className='text-body-sm text-gray-600'>
              {context.subtitle}
            </span>
          </div>
        </div>

        {callout && <div className='px-6'>{callout}</div>}

        {locked ? (
          <nav className='flex flex-col gap-2 px-6 pb-6'>
            {SME_NAV.map(({ label, icon: Icon }) => {
              const active = label === 'Assessment';
              return (
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
              );
            })}
          </nav>
        ) : (
          <nav className='flex flex-col gap-4 px-3.5'>
            {SME_NAV.map(({ label, icon: Icon, href }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <div key={label} className={cn(active ? '' : 'px-2.5')}>
                  <Link
                    href={href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl',
                      active
                        ? 'bg-primary px-2.5 py-3.5 text-mineral-white'
                        : 'text-gray-800',
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
                  </Link>
                </div>
              );
            })}
          </nav>
        )}
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
