'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Inbox, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useLenderOnboardingStore } from '@/stores/lenderOnboardingStore';
import { LenderShell } from '@/components/lender/lender-shell';
import { LenderDisclaimer } from '@/components/lender/lender-disclaimer';

/* ---------------------------------------------------------------- demo data */

type Stage =
  | 'New match'
  | 'Reviewing'
  | 'Interested'
  | 'Not interested'
  | 'On hold';

const STAGES: { stage: Stage; tileSub: string; sectionSub: string }[] = [
  {
    stage: 'New match',
    tileSub: 'Unreviewed matches',
    sectionSub: 'Surfaced by the matching engine, not yet reviewed.',
  },
  {
    stage: 'Reviewing',
    tileSub: 'Currently being assessed',
    sectionSub: 'Being assessed internally.',
  },
  {
    stage: 'Interested',
    tileSub: 'Matches you want to pursue',
    sectionSub: 'Worth exploring — non-binding.',
  },
  {
    stage: 'Not interested',
    tileSub: "Matches you won't pursue",
    sectionSub: 'Outside your current funding appetite.',
  },
  {
    stage: 'On hold',
    tileSub: "Matches you're keeping for later",
    sectionSub: 'Kept for later consideration.',
  },
];

type PipelineItem = {
  id: string;
  name: string;
  meta: string;
  stage: Stage;
};

const NO_ITEMS: PipelineItem[] = [];

const INITIAL_ITEMS: PipelineItem[] = [
  {
    id: 'pennine-print-co',
    name: 'Pennine Print Co',
    meta: 'Retail · £25k – £250k · matched August 13, 2026, 13:19',
    stage: 'New match',
  },
  {
    id: 'honesty-foods-ltd',
    name: 'Honesty Foods Ltd',
    meta: 'Food & drink · £50k – £500k · matched August 1, 2026, 13:14',
    stage: 'Reviewing',
  },
  {
    id: 'flo-technologies',
    name: 'Flo Technologies',
    meta: 'Technology · £25k – £250k · matched August 13, 2026, 12:50',
    stage: 'Interested',
  },
  {
    id: 'cobalt-logistics-ltd',
    name: 'Cobalt Logistics Ltd',
    meta: 'Logistics · £100k – £250k · matched August 5, 2026, 20:20',
    stage: 'Not interested',
  },
  {
    id: 'hartley-companies',
    name: 'Hartley Companies',
    meta: 'Retail · £25k – £250k · matched August 5, 2026, 20:20',
    stage: 'On hold',
  },
];

/* ------------------------------------------------------------- primitives */

function StageSelect({
  value,
  onChange,
}: {
  value: Stage;
  onChange: (s: Stage) => void;
}) {
  return (
    <div className='relative w-full sm:w-59'>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Stage)}
        aria-label='Internal pipeline stage'
        className='h-12 w-full appearance-none rounded-xl border border-gray-200 bg-muted px-4 pr-10 text-body-md text-carbon-black focus:border-teal-charcoal focus:outline-none'
      >
        {STAGES.map((s) => (
          <option key={s.stage} value={s.stage}>
            {s.stage}
          </option>
        ))}
      </select>
      <ChevronDown className='pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-gray-500' />
    </div>
  );
}

function ItemCard({
  item,
  onStage,
}: {
  item: PipelineItem;
  onStage: (s: Stage) => void;
}) {
  return (
    <div className='flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white px-7 py-5 lg:flex-row lg:items-center lg:justify-between'>
      <div className='flex min-w-0 flex-col gap-0.5'>
        <p className='text-h4 font-semibold text-carbon-black'>{item.name}</p>
        <p className='text-body-md text-gray-600'>{item.meta}</p>
      </div>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-end lg:items-center'>
        <div className='flex flex-col gap-2'>
          <p className='text-body-md font-medium text-carbon-black'>
            Internal pipeline stage
          </p>
          <StageSelect value={item.stage} onChange={onStage} />
        </div>
        <Link
          href={`${ROUTES.lender.matchedSmes}/${item.id}`}
          className='inline-flex h-9 w-fit items-center rounded-lg bg-primary px-3.5 text-body-sm font-semibold text-mineral-white shadow-xs'
        >
          Open
        </Link>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- view */

/**
 * Pipeline board. Internal, non-binding stages tracked client-side (no backend).
 * Moving an SME's stage re-buckets it across the sections below.
 */
export function LenderPipelineView() {
  const [items, setItems] = useState<PipelineItem[]>(INITIAL_ITEMS);

  // A newly-onboarded lender has an empty pipeline.
  const mounted = useMounted();
  const userType = useLenderOnboardingStore((s) => s.userType);
  const shown = mounted && userType === 'new' ? NO_ITEMS : items;

  const move = (id: string, stage: Stage) => {
    setItems((cur) => cur.map((i) => (i.id === id ? { ...i, stage } : i)));
    toast.success(`Moved to ${stage}`);
  };

  const countFor = (stage: Stage) =>
    shown.filter((i) => i.stage === stage).length;

  return (
    <LenderShell
      title='Pipeline'
      subtitle='Lightweight internal tracking for your SME conversations. Statuses are non-binding and never visible to SMEs.'
    >
      <div className='flex flex-col gap-6'>
        {/* Summary tiles */}
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5'>
          {STAGES.map((s) => (
            <div
              key={s.stage}
              className='flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-5'
            >
              <p className='text-body-sm text-gray-700'>
                {s.stage.toUpperCase()}
              </p>
              <p className='text-[44px] font-semibold leading-[56px] text-carbon-black'>
                {countFor(s.stage)}
              </p>
              <p className='text-body-sm text-gray-700'>{s.tileSub}</p>
            </div>
          ))}
        </div>

        {/* Overall empty state (new lender) */}
        {shown.length === 0 && (
          <div className='flex flex-col items-center gap-5 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-20 text-center'>
            <Inbox className='size-12 text-gray-500' />
            <div className='flex max-w-137 flex-col gap-2'>
              <p className='text-h3 font-semibold text-carbon-black'>
                No SMEs in your pipeline yet
              </p>
              <p className='text-body-lg text-gray-500'>
                As SMEs are matched to your active funding products, track them
                here across your funding journey.
              </p>
            </div>
            <Link
              href={`${ROUTES.lender.fundingProducts}/new`}
              className='inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-base font-semibold text-mineral-white shadow-xs'
            >
              <Plus className='size-5' />
              Add a funding product
            </Link>
          </div>
        )}

        {/* Stage sections */}
        {shown.length > 0 &&
          STAGES.map((s) => {
          const stageItems = shown.filter((i) => i.stage === s.stage);
          return (
            <section key={s.stage} className='flex flex-col gap-4'>
              <div className='flex flex-col gap-1'>
                <h2 className='text-h5 font-semibold text-carbon-black'>
                  {s.stage} ({stageItems.length})
                </h2>
                <p className='text-body-md text-gray-500'>{s.sectionSub}</p>
              </div>
              {stageItems.length === 0 ? (
                <p
                  className={cn(
                    'rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-body-md text-gray-500',
                  )}
                >
                  No SMEs in this stage.
                </p>
              ) : (
                <div className='flex flex-col gap-3'>
                  {stageItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onStage={(stage) => move(item.id, stage)}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}

        <LenderDisclaimer />
      </div>
    </LenderShell>
  );
}
