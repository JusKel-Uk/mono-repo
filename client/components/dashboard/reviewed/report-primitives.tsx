'use client';

import Link from 'next/link';
import { ArrowLeft, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import type { Pill, PillTone } from '@/lib/dashboard/report-packs';

/* ---- status pill tones (exact Figma bg/text per status) ---- */
export const PILL_TONE: Record<PillTone, string> = {
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-800',
  teal: 'bg-[#effaf9] text-primary',
  error: 'bg-error-100 text-error-600',
  errorSoft: 'bg-error-50 text-error-600',
};

/** Evidence/status pill. 12px on mobile, 14px on desktop (Figma). */
export function StatusPill({ label, tone }: Pill) {
  return (
    <span
      className={cn(
        'inline-flex h-8 shrink-0 items-center rounded-full px-3 text-label-md font-medium lg:text-body-sm',
        PILL_TONE[tone],
      )}
    >
      {label}
    </span>
  );
}

/** Abyssal callout banner (disclaimer / "N items missing"). 12px mobile / 16px desktop. */
export function ReportBanner({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className='flex items-start gap-3 rounded-2xl border border-mineral-white bg-abyssal p-6 text-mineral-white'>
      <Icon className='size-4 shrink-0 lg:size-6' />
      <div className='flex flex-col gap-0.5'>
        <p className='text-label-md font-semibold lg:text-body-md'>{title}</p>
        <p className='text-label-md lg:text-body-md'>{body}</p>
      </div>
    </div>
  );
}

/** "Back to reports" link. 14px mobile / 16px desktop (Figma). */
export function ReportBackLink() {
  return (
    <Link
      href={ROUTES.sme.reports}
      className='inline-flex w-fit items-center gap-2 text-body-sm text-gray-700 lg:text-body-md'
    >
      <ArrowLeft className='size-4.5 lg:size-5.5' />
      Back to reports
    </Link>
  );
}

/**
 * Report action button (Download / Preview / Export pack). 14px on mobile,
 * 16px on desktop. Pass `mobile` for the `lg:hidden` in-body copy.
 */
export function ReportButton({
  icon: Icon,
  label,
  variant = 'primary',
  mobile = false,
  className,
}: {
  icon: LucideIcon;
  label: string;
  variant?: 'primary' | 'secondary';
  mobile?: boolean;
  className?: string;
}) {
  return (
    <button
      type='button'
      className={cn(
        'inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-5 font-semibold shadow-xs transition',
        mobile ? 'text-body-sm' : 'text-body-md',
        variant === 'primary'
          ? 'bg-primary text-mineral-white hover:opacity-90'
          : 'border border-gray-300 bg-mineral-white text-carbon-black hover:bg-muted',
        className,
      )}
    >
      <Icon className='size-5' />
      {label}
    </button>
  );
}
