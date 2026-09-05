import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

/**
 * The dashed empty / locked state used across dashboard nav pages (Scorecard,
 * Evidence, Funding matches, Recommendations, report packs): centered icon +
 * title + body + a single CTA.
 */
export function DashboardEmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action: { label: string; href?: string };
}) {
  const cta =
    'inline-flex h-14 min-w-[220px] items-center justify-center rounded-lg bg-primary px-5 text-base font-semibold text-white shadow-xs transition-opacity hover:opacity-90';
  return (
    <div className='flex min-h-120 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-6'>
      <div className='flex w-full max-w-137.5 flex-col items-center gap-5 text-center'>
        <Icon
          className='size-16 shrink-0 text-carbon-black'
          strokeWidth={1.5}
        />
        <div className='flex flex-col gap-2'>
          <p className='text-h3 font-semibold text-carbon-black'>{title}</p>
          <p className='text-body-lg text-gray-500'>{body}</p>
        </div>
        {action.href ? (
          <Link href={action.href} className={cta}>
            {action.label}
          </Link>
        ) : (
          <button type='button' className={cta}>
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
