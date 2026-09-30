'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Loader2, Menu } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { initials } from '@/stores/authStore';
import { useLenderMe } from '@/lib/hooks/use-lender-me';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useLenderOnboardingStore } from '@/stores/lenderOnboardingStore';
import { JusKelLogo } from '@/components/brand/juskel-logo';
import { LenderSidebar } from '@/components/lender/lender-sidebar';
import { LenderOnboardingSwitcher } from '@/components/dev/lender-onboarding-switcher';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

/** Portal sections that require completed onboarding. */
const LOCKED_ROUTES = [
  ROUTES.lender.dashboard,
  ROUTES.lender.fundingProducts,
  ROUTES.lender.matchedSmes,
  ROUTES.lender.pipeline,
  ROUTES.lender.settings,
];
const ONBOARDING_ROUTES: string[] = [
  ROUTES.lender.terms,
  ROUTES.lender.setUpOrganisation,
];

/** Notifications bell (no lender notifications surface yet — inert placeholder). */
function NotificationBell({
  boxClass,
  iconClass,
}: {
  boxClass: string;
  iconClass: string;
}) {
  return (
    <button
      type='button'
      aria-label='Notifications'
      className={cn(
        'flex items-center justify-center rounded-xl bg-muted-foreground/10 transition-colors hover:bg-muted-foreground/20',
        boxClass,
      )}
    >
      <Bell className={cn(iconClass, 'text-carbon-black')} />
    </button>
  );
}

/**
 * Shared frame for every lender portal screen: sidebar (desktop) / hamburger
 * drawer (mobile), a title + supporting-text header with an optional action,
 * bell + avatar. Mirrors the SME `DashboardShell`.
 */
export function LenderShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  /** Optional header action, shown left of the bell (desktop only). */
  action?: ReactNode;
  children: ReactNode;
}) {
  const { data } = useLenderMe();
  const name =
    data && (data.firstName || data.lastName)
      ? `${data.firstName} ${data.lastName}`.trim()
      : '';
  const avatar = name ? initials(name) : '';

  // Onboarding gate: keep the portal locked until verified, redirecting to the
  // current onboarding step; once verified, keep the onboarding screens out.
  const mounted = useMounted();
  const router = useRouter();
  const pathname = usePathname();
  const stage = useLenderOnboardingStore((s) => s.stage);
  const onLocked = LOCKED_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );
  const onOnboarding = ONBOARDING_ROUTES.includes(pathname);
  const blocked = mounted && stage !== 'verified' && onLocked;

  useEffect(() => {
    if (!mounted) return;
    if (stage !== 'verified' && onLocked) {
      router.replace(
        stage === 'terms' ? ROUTES.lender.terms : ROUTES.lender.setUpOrganisation,
      );
    } else if (stage === 'verified' && onOnboarding) {
      router.replace(ROUTES.lender.dashboard);
    }
  }, [mounted, stage, onLocked, onOnboarding, router]);

  return (
    <div className='min-h-screen bg-mineral-white lg:flex'>
      {/* TEMP dev control (no backend driver yet) — floats over every page. */}
      <LenderOnboardingSwitcher />
      {/* Mobile top bar */}
      <header className='flex items-center justify-between border-b border-border bg-white px-6 py-4 lg:hidden'>
        <JusKelLogo className='text-carbon-black' />
        <div className='flex items-center gap-3'>
          <NotificationBell boxClass='size-11' iconClass='size-5' />
          <Sheet>
            <SheetTrigger
              aria-label='Open menu'
              className='flex size-11 items-center justify-center rounded-xl bg-muted-foreground/10'
            >
              <Menu className='size-5 text-carbon-black' />
            </SheetTrigger>
            <SheetContent side='left' className='w-78 p-0'>
              <SheetTitle className='sr-only'>Navigation</SheetTitle>
              <LenderSidebar />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className='sticky top-0 hidden h-screen w-78 shrink-0 border-r border-border lg:block'>
        <LenderSidebar />
      </aside>

      {/* Main */}
      <main className='flex-1 px-6 py-8 lg:px-10 lg:py-8'>
        <div className='mx-auto flex max-w-334 flex-col gap-8'>
          {/* Header */}
          <div className='flex flex-col gap-8'>
            <div className='flex items-start justify-between gap-6'>
              <div className='flex min-w-0 flex-col gap-1'>
                <h1 className='text-[28px] font-semibold leading-9 text-carbon-black lg:text-h2'>
                  {title}
                </h1>
                <p className='text-base text-gray-500 lg:text-body-lg'>
                  {subtitle}
                </p>
              </div>
              {/* Desktop-only header actions */}
              <div className='hidden items-center gap-6 lg:flex'>
                {action}
                <NotificationBell boxClass='size-12' iconClass='size-6' />
                <span className='flex size-14 items-center justify-center rounded-full bg-muted text-base font-semibold text-carbon-black'>
                  {avatar || '—'}
                </span>
              </div>
            </div>
            <div className='hidden h-px w-full bg-gray-200 lg:block' />
          </div>

          {blocked ? (
            <div className='flex min-h-60 items-center justify-center'>
              <Loader2 className='size-6 animate-spin text-muted-foreground' />
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}
