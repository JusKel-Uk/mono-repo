'use client';

import { cn } from '@/lib/utils';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useReviewStore, type ReviewPhase } from '@/stores/reviewStore';

/**
 * TEMPORARY dev control — a floating switcher for the review phase, so the
 * phase-dependent UIs (dashboard: submitted / in review / published scorecard,
 * plus the locked vs unlocked states on the other pages) can be toggled without
 * a backend. Rendered once from DashboardShell, so it appears on every page.
 * Hidden until the assessment is submitted (phase !== 'none').
 *
 * TODO(backend): remove alongside reviewStore once review status is server-driven.
 */
const OPTIONS: { phase: ReviewPhase; label: string }[] = [
  { phase: 'submitted', label: 'Submitted' },
  { phase: 'review', label: 'In review' },
  { phase: 'published', label: 'Published' },
];

export function ReviewPhaseSwitcher() {
  const mounted = useMounted();
  const phase = useReviewStore((s) => s.phase);
  const setPhase = useReviewStore((s) => s.setPhase);

  if (!mounted || phase === 'none') return null;

  return (
    <div className='fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col gap-1.5 rounded-xl border border-gray-300 bg-white p-2 shadow-lg'>
      <span className='px-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400'>
        Dev · review phase
      </span>
      <div className='flex flex-col gap-1 sm:flex-row'>
        {OPTIONS.map((o) => (
          <button
            key={o.phase}
            type='button'
            onClick={() => setPhase(o.phase)}
            className={cn(
              'rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors sm:text-center',
              phase === o.phase
                ? 'bg-primary text-mineral-white'
                : 'text-gray-700 hover:bg-muted',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
