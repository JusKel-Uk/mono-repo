'use client';

import type { ReactNode } from 'react';
import { Bell, Menu } from 'lucide-react';

import { useAuthStore, displayName, initials } from '@/stores/authStore';
import { useMounted } from '@/lib/hooks/use-mounted';
import { JusKelLogo } from '@/components/brand/juskel-logo';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

/**
 * Shared frame for every SME dashboard screen: sidebar (desktop) / hamburger
 * drawer (mobile), a title + supporting-text header with bell + avatar.
 */
export function DashboardShell({
  title,
  subtitle,
  notifications = 0,
  children,
}: {
  title: string;
  subtitle: string;
  /** Unread count shown as a badge on the bell. */
  notifications?: number;
  children: ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const mounted = useMounted();
  const avatar = mounted && user ? initials(displayName(user)) : '';

  return (
    <div className='min-h-screen bg-mineral-white lg:flex'>
      {/* Mobile top bar */}
      <header className='flex items-center justify-between border-b border-border bg-white px-6 py-4 lg:hidden'>
        <JusKelLogo className='text-carbon-black' />
        <div className='flex items-center gap-3'>
          <span className='relative flex size-11 items-center justify-center rounded-xl bg-muted-foreground/10'>
            <Bell className='size-5 text-carbon-black' />
            {notifications > 0 && (
              <span className='absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-semibold text-white'>
                {notifications}
              </span>
            )}
          </span>
          <Sheet>
            <SheetTrigger
              aria-label='Open menu'
              className='flex size-11 items-center justify-center rounded-xl bg-muted-foreground/10'
            >
              <Menu className='size-5 text-carbon-black' />
            </SheetTrigger>
            <SheetContent side='left' className='w-78 p-0'>
              <SheetTitle className='sr-only'>Navigation</SheetTitle>
              <DashboardSidebar />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className='sticky top-0 hidden h-screen w-78 shrink-0 border-r border-border lg:block'>
        <DashboardSidebar />
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
                <span className='relative flex size-12 items-center justify-center rounded-xl bg-muted-foreground/10'>
                  <Bell className='size-6 text-carbon-black' />
                  {notifications > 0 && (
                    <span className='absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-semibold text-white'>
                      {notifications}
                    </span>
                  )}
                </span>
                <span className='flex size-14 items-center justify-center rounded-full bg-muted text-base font-semibold text-carbon-black'>
                  {avatar || '—'}
                </span>
              </div>
            </div>
            <div className='hidden h-px w-full bg-gray-200 lg:block' />
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
