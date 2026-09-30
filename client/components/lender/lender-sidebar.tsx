'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  AlignLeft,
  LayoutGrid,
  Package,
  LogOut,
  Settings,
  Users,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { initials } from '@/stores/authStore';
import { lenderSignOut } from '@/lib/api/lender-auth';
import { useLenderMe } from '@/lib/hooks/use-lender-me';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useLenderOnboardingStore } from '@/stores/lenderOnboardingStore';
import { JusKelLogo } from '@/components/brand/juskel-logo';
import { LenderBadge } from '@/components/lender/lender-badge';
import { Skeleton } from '@/components/ui/skeleton';

/** Lender portal nav — the five verified-portal sections. */
export const LENDER_NAV: { label: string; icon: LucideIcon; href: string }[] = [
  { label: 'Dashboard', icon: LayoutGrid, href: ROUTES.lender.dashboard },
  {
    label: 'Funding products',
    icon: Package,
    href: ROUTES.lender.fundingProducts,
  },
  { label: 'Matched SMEs', icon: Users, href: ROUTES.lender.matchedSmes },
  { label: 'Pipeline', icon: AlignLeft, href: ROUTES.lender.pipeline },
  { label: 'Settings', icon: Settings, href: ROUTES.lender.settings },
];

/**
 * The single lender sidebar: logo, organisation context (name + LENDER tag +
 * email), route-aware nav, and an account footer with sign-out. Mirrors the SME
 * `AppSidebar` structure so both portals feel identical.
 */
export function LenderSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading } = useLenderMe();

  const name =
    data && (data.firstName || data.lastName)
      ? `${data.firstName} ${data.lastName}`.trim()
      : 'Your account';
  const email = data?.email ?? '';
  const orgName = data?.organisation.name ?? '';

  // Onboarding gate: until verified, the nav is locked and a callout is shown.
  const mounted = useMounted();
  const stage = useLenderOnboardingStore((s) => s.stage);
  const locked = mounted && stage !== 'verified';

  const signOut = () => {
    lenderSignOut();
    qc.clear();
    router.push(ROUTES.lender.login);
  };

  return (
    <div className='flex h-full flex-col bg-white'>
      <div className='flex flex-1 flex-col gap-8 overflow-y-auto pt-8'>
        <JusKelLogo className='mx-auto text-carbon-black' />

        {/* Organisation context */}
        <div className='border-y border-gray-200 px-6 py-6'>
          {isLoading ? (
            <div className='flex flex-col gap-3'>
              <Skeleton className='h-4 w-40' />
              <Skeleton className='h-6 w-52' />
            </div>
          ) : (
            <div className='flex flex-col gap-3'>
              <p className='text-body-sm font-medium text-gray-600'>
                {locked ? 'Set up your organisation' : orgName || 'Your organisation'}
              </p>
              <div className='flex items-center gap-2'>
                <LenderBadge>{locked ? 'ROLE' : 'LENDER'}</LenderBadge>
                {email && (
                  <span className='truncate text-body-sm text-gray-600'>
                    {email}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Onboarding callout while locked */}
        {locked && (
          <div className='px-6'>
            <div className='rounded-xl border border-warning-200 bg-warning-50 p-4'>
              <p className='text-label-md font-semibold text-gray-700'>
                Finish setup to unlock
              </p>
              <p className='mt-2 text-label-md text-gray-500'>
                Kindly accept the lender terms and complete your organisation
                profile.
              </p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className='flex flex-col gap-4 px-3.5'>
          {LENDER_NAV.map(({ label, icon: Icon, href }) => {
            if (locked) {
              return (
                <div
                  key={label}
                  aria-disabled
                  className='flex cursor-not-allowed items-center gap-3 rounded-xl px-2.5 text-gray-300'
                >
                  <Icon className='size-6 shrink-0' />
                  <span className='text-base'>{label}</span>
                </div>
              );
            }
            const active = pathname === href || pathname.startsWith(`${href}/`);
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
      </div>

      {/* Account footer */}
      <div className='border-t border-border px-6 py-4'>
        {isLoading ? (
          <div className='flex items-center gap-3'>
            <Skeleton className='size-10 shrink-0 rounded-full' />
            <div className='flex min-w-0 flex-col gap-1.5'>
              <Skeleton className='h-4 w-28' />
              <Skeleton className='h-3 w-36' />
            </div>
          </div>
        ) : (
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
              onClick={signOut}
              aria-label='Sign out'
              className='rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-carbon-black'
            >
              <LogOut className='size-5 text-destructive' />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
