'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { useAuthStore, displayName, initials } from '@/stores/authStore';
import { useReviewStore } from '@/stores/reviewStore';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useLogout } from '@/lib/hooks/use-logout';
import { JusKelLogo } from '@/components/brand/juskel-logo';
import { OrgSwitcher } from '@/components/dashboard/org-switcher';
import { Skeleton } from '@/components/ui/skeleton';

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
 * The single SME sidebar (logo + org context + nav + account footer). It reads
 * onboarding state itself and adapts:
 *  - loading  → skeleton nav while the application status resolves.
 *  - locked   → onboarding incomplete: only "Assessment" is reachable, the rest
 *    are disabled, and an unlock callout appears.
 *  - unlocked → onboarding complete: route-aware links.
 */
export function AppSidebar() {
  const pathname = usePathname();

  // Persisted store rehydrates client-side only — gate on mount to avoid a
  // hydration mismatch, then show the real signed-in user.
  const mounted = useMounted();
  const authUser = useAuthStore((s) => s.user);
  const user = mounted ? authUser : null;
  const name = user ? displayName(user) : 'Your account';
  const email = user?.email ?? '';

  // Submit-for-review gate drives the nav: skeleton until the persisted flag
  // rehydrates (on mount), then locked (not yet submitted) or unlocked. The
  // flag is a temporary frontend stand-in — see reviewStore.
  const submitted = useReviewStore((s) => s.submitted);
  const locked = mounted && !submitted;
  const navLoading = !mounted;

  const handleLogout = useLogout();

  return (
    <div className='flex h-full flex-col bg-white'>
      <div className='flex flex-1 flex-col gap-8 overflow-y-auto pt-8'>
        <JusKelLogo className='mx-auto text-carbon-black' />

        {/* Context block — active organisation + role. */}
        <div className='border-y border-gray-200 px-6 py-6'>
          <OrgSwitcher />
        </div>

        {/* Unlock callout while onboarding is incomplete. */}
        {locked && (
          <div className='px-6'>
            <div className='rounded-xl border border-warning-200 bg-warning-50 p-4'>
              <p className='text-xs font-semibold text-gray-700'>
                Complete onboarding to unlock
              </p>
              <p className='mt-2 text-xs text-muted-foreground'>
                Dashboard, scorecard, matches, reports and integrations open
                once you complete every step.
              </p>
            </div>
          </div>
        )}

        {navLoading ? (
          <nav className='flex flex-col gap-2 px-6 pb-6'>
            {SME_NAV.map(({ label }) => (
              <div
                key={label}
                className='flex items-center gap-3 rounded-xl px-3 py-3.5'
              >
                <Skeleton className='size-6 shrink-0 rounded-md' />
                <Skeleton className='h-4 w-28' />
              </div>
            ))}
          </nav>
        ) : locked ? (
          <nav className='flex flex-col gap-2 px-6 pb-6'>
            {SME_NAV.map(({ label, icon: Icon, href }) => {
              // Only Assessment is reachable while onboarding is incomplete;
              // every other item is shown disabled.
              const enabled = label === 'Assessment';
              const inner = (
                <>
                  <Icon className='size-6 shrink-0' />
                  <span
                    className={cn(
                      'text-base',
                      enabled ? 'font-semibold' : 'font-normal',
                    )}
                  >
                    {label}
                  </span>
                </>
              );
              return enabled ? (
                <Link
                  key={label}
                  href={href}
                  className='flex items-center gap-3 rounded-xl bg-primary px-3 py-3.5 text-mineral-white'
                >
                  {inner}
                </Link>
              ) : (
                <div
                  key={label}
                  aria-disabled
                  className='flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-3.5 text-gray-300'
                >
                  {inner}
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
        {mounted ? (
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
              className='rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-carbon-black'
            >
              <LogOut className='size-5 text-destructive' />
            </button>
          </div>
        ) : (
          <div className='flex items-center gap-3'>
            <Skeleton className='size-10 shrink-0 rounded-full' />
            <div className='flex min-w-0 flex-col gap-1.5'>
              <Skeleton className='h-4 w-28' />
              <Skeleton className='h-3 w-36' />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
