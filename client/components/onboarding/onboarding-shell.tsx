'use client';

import type { ReactNode } from 'react';
import { Bell, CircleCheckBig, Menu } from 'lucide-react';

import { JusKelLogo } from '@/components/brand/juskel-logo';
import { OnboardingSidebar } from '@/components/onboarding/onboarding-sidebar';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

/**
 * Shared frame for every onboarding screen (steps + landing): sidebar,
 * header, optional "Why we ask" banner and optional footer actions.
 * The banner and footer render only when their props are supplied, so the
 * landing/timeline page can reuse the same chrome without them.
 */
export function OnboardingShell({
  currentStepTitle,
  title,
  subtitle,
  whyWeAsk,
  actions,
  children,
}: {
  /** Step name shown as the sidebar's current-step context. */
  currentStepTitle: string;
  title: string;
  subtitle: string;
  whyWeAsk?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className='min-h-screen bg-muted lg:flex'>
      {/* Mobile top bar */}
      <header className='flex items-center justify-between border-b border-border bg-white px-6 py-4 lg:hidden'>
        <JusKelLogo className='text-carbon-black' />
        <div className='flex items-center gap-3'>
          <span className='flex size-11 items-center justify-center rounded-xl bg-muted-foreground/10'>
            <Bell className='size-5 text-carbon-black' />
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
              <OnboardingSidebar currentStepTitle={currentStepTitle} />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className='sticky top-0 hidden h-screen w-78 shrink-0 border-r border-border lg:block'>
        <OnboardingSidebar currentStepTitle={currentStepTitle} />
      </aside>

      {/* Main */}
      <main className='flex-1 px-6 py-8 lg:px-12 lg:py-11 bg-mineral-white'>
        <div className='mx-auto flex max-w-354 flex-col gap-8'>
          {/* Header */}
          <div className='flex flex-col gap-6'>
            <div className='flex items-start justify-between gap-6'>
              <div className='flex flex-col gap-1'>
                <h1 className='text-[28px] font-semibold leading-9 text-carbon-black lg:text-[32px] lg:leading-11'>
                  {title}
                </h1>
                <p className='text-base text-muted-foreground lg:text-lg lg:leading-7'>
                  {subtitle}
                </p>
              </div>
              {/* Desktop-only header actions */}
              <div className='hidden items-center gap-6 lg:flex'>
                <span className='flex size-12 items-center justify-center rounded-xl bg-muted-foreground/10'>
                  <Bell className='size-6 text-carbon-black' />
                </span>
                <span className='flex size-14 items-center justify-center rounded-full bg-muted text-base font-semibold text-carbon-black'>
                  FR
                </span>
              </div>
            </div>
            <div className='hidden h-px w-full bg-border lg:block' />
          </div>

          {/* Step content */}
          {children}

          {/* Why we ask */}
          {whyWeAsk && (
            <div className='flex gap-3 rounded-2xl border border-mineral-white bg-abyssal p-6'>
              <CircleCheckBig className='size-6 shrink-0 text-mineral-white' />
              <div className='flex flex-col gap-1 text-mineral-white'>
                <p className='text-lg font-semibold'>Why we ask</p>
                <p>{whyWeAsk}</p>
              </div>
            </div>
          )}

          {/* Footer actions */}
          {actions && (
            <div className='flex flex-col-reverse gap-4 lg:flex-row lg:justify-end lg:gap-10'>
              {actions}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
