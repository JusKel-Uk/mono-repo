'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';

/**
 * TEMPORARY demo control — a floating switcher that links through every lender
 * auth screen, so the whole flow can be cycled during a demo while the backend
 * integration is still pending. Rendered once from the lender (auth) layout, so
 * it appears on every auth screen.
 *
 * TODO(backend): delete this file and its mount in app/lender/(auth)/layout.tsx
 * once lender auth is server-driven.
 */
const DEMO_EMAIL = 'lender@company.co.uk';

const SCREENS: { label: string; href: string }[] = [
  { label: 'Access hub', href: ROUTES.lender.root },
  { label: 'Sign in', href: ROUTES.lender.login },
  { label: 'Request access', href: ROUTES.lender.requestAccess },
  { label: 'Create account', href: ROUTES.lender.createAccount },
  { label: 'Forgot password', href: ROUTES.lender.forgotPassword },
  {
    label: 'Verify code',
    href: `${ROUTES.lender.verifyResetCode}?email=${encodeURIComponent(DEMO_EMAIL)}`,
  },
  { label: 'Set new password', href: ROUTES.lender.resetPassword },
  { label: 'Password updated', href: `${ROUTES.lender.resetPassword}?done=1` },
];

function LenderAuthSwitcherInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(true);

  const done = searchParams.get('done') === '1';
  const isActive = (href: string) => {
    const [path] = href.split('?');
    if (path !== pathname) return false;
    // Distinguish the two /reset-password entries by the `done` flag.
    if (path === ROUTES.lender.resetPassword) {
      return href.includes('done=1') ? done : !done;
    }
    return true;
  };

  return (
    <div className='fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col gap-1.5 rounded-xl border border-gray-300 bg-white p-2 shadow-lg'>
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        className='flex items-center justify-between gap-3 px-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400'
      >
        <span>Demo · lender screens</span>
        <span className='text-gray-400'>{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className='flex flex-col gap-1'>
          {SCREENS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className={cn(
                'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                isActive(s.href)
                  ? 'bg-primary text-mineral-white'
                  : 'text-gray-700 hover:bg-muted',
              )}
            >
              {s.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function LenderAuthSwitcher() {
  return (
    <Suspense fallback={null}>
      <LenderAuthSwitcherInner />
    </Suspense>
  );
}
