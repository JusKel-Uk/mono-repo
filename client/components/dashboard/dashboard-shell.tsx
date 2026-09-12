'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Loader2, Menu } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { useAuthStore, displayName, initials } from '@/stores/authStore';
import { useReviewStore } from '@/stores/reviewStore';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useUnreadCount } from '@/lib/dashboard/notifications';
import { JusKelLogo } from '@/components/brand/juskel-logo';
import { AppSidebar } from '@/components/app-sidebar';
import { ReviewPhaseSwitcher } from '@/components/dev/review-phase-switcher';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

/** Bell that links to the Notifications page, with an unread-count badge. */
function NotificationBell({
  boxClass,
  iconClass,
  unread,
}: {
  boxClass: string;
  iconClass: string;
  unread: number;
}) {
  return (
    <Link
      href={ROUTES.sme.notifications}
      aria-label='Notifications'
      className={cn(
        'relative flex items-center justify-center rounded-xl bg-muted-foreground/10 transition-colors hover:bg-muted-foreground/20',
        boxClass,
      )}
    >
      <Bell className={cn(iconClass, 'text-carbon-black')} />
      {unread > 0 && (
        <span className='absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-semibold text-white'>
          {unread}
        </span>
      )}
    </Link>
  );
}

/**
 * Shared frame for every SME dashboard screen: sidebar (desktop) / hamburger
 * drawer (mobile), a title + supporting-text header with an optional action,
 * bell + avatar.
 */
export function DashboardShell({
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
  const user = useAuthStore((s) => s.user);
  const mounted = useMounted();
  const avatar = mounted && user ? initials(displayName(user)) : '';
  const unread = useUnreadCount();

  // Submit-for-review gate: only once the assessment has been submitted are the
  // dashboard pages reachable; until then only the Assessment page (+ its step
  // sub-routes) is. `submitted` is a temporary frontend flag (see reviewStore);
  // we don't lock or redirect until mounted, to avoid a wrong-state flash.
  const router = useRouter();
  const pathname = usePathname();
  const unlocked = useReviewStore((s) => s.phase !== 'none');
  const locked = mounted && !unlocked;
  const onAssessment =
    pathname === ROUTES.sme.assessment ||
    pathname.startsWith(`${ROUTES.sme.assessment}/`);
  const blocked = locked && !onAssessment;

  useEffect(() => {
    if (blocked) router.replace(ROUTES.sme.assessment);
  }, [blocked, router]);

  return (
    <div className='min-h-screen bg-mineral-white lg:flex'>
      {/* TEMP dev control (no backend driver yet) — floats over every page. */}
      <ReviewPhaseSwitcher />

      {/* Mobile top bar */}
      <header className='flex items-center justify-between border-b border-border bg-white px-6 py-4 lg:hidden'>
        <JusKelLogo className='text-carbon-black' />
        <div className='flex items-center gap-3'>
          <NotificationBell boxClass='size-11' iconClass='size-5' unread={unread} />
          <Sheet>
            <SheetTrigger
              aria-label='Open menu'
              className='flex size-11 items-center justify-center rounded-xl bg-muted-foreground/10'
            >
              <Menu className='size-5 text-carbon-black' />
            </SheetTrigger>
            <SheetContent side='left' className='w-78 p-0'>
              <SheetTitle className='sr-only'>Navigation</SheetTitle>
              <AppSidebar />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className='sticky top-0 hidden h-screen w-78 shrink-0 border-r border-border lg:block'>
        <AppSidebar />
      </aside>

      {/* Main */}
      <main className='flex-1 px-6 py-8 lg:px-10 lg:py-8'>
        <div className='mx-auto flex max-w-334 flex-col gap-8'>
          {/* Header */}
          <div className='flex flex-col gap-8'>
            <div className='flex items-start justify-between gap-6'>
              <div className='flex flex-col gap-1'>
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
                <NotificationBell boxClass='size-12' iconClass='size-6' unread={unread} />
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
