'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { useLenderMe } from '@/lib/hooks/use-lender-me';
import { useLenderOnboardingStore } from '@/stores/lenderOnboardingStore';
import { LenderShell } from '@/components/lender/lender-shell';

const LENDER_TYPES = [
  'Challenger bank',
  'High-street bank',
  'Specialist lender',
  'Debt fund',
  'Community lender / CDFI',
  'Equity investor',
  'Grant provider',
];
const SECTORS = [
  'Manufacturing',
  'Textiles',
  'Retail',
  'Logistics',
  'Food & drink',
  'Construction',
  'Professional services',
  'Technology',
  'Agriculture',
];

const inputCls =
  'h-14 w-full rounded-xl border border-gray-300 bg-white px-4 text-body-md text-carbon-black placeholder:text-gray-400 focus:border-teal-charcoal focus:outline-none';

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-1 flex-col gap-4'>
      <label className='text-body-md font-medium text-carbon-black'>
        {label}
      </label>
      {children}
    </div>
  );
}

/** Lender onboarding step 2 — create the organisation profile. */
export function LenderSetupOrgView() {
  const router = useRouter();
  const { data } = useLenderMe();
  const setStage = useLenderOnboardingStore((s) => s.setStage);
  const completeOrganisation = useLenderOnboardingStore(
    (s) => s.completeOrganisation,
  );

  const [orgName, setOrgName] = useState(
    data?.organisation.name ?? 'JusKel Technology Ltd',
  );
  const [type, setType] = useState('Challenger bank');
  const [sectors, setSectors] = useState<string[]>(['Manufacturing']);
  const [market, setMarket] = useState('United Kingdom');
  const [contact, setContact] = useState(
    data && (data.firstName || data.lastName)
      ? `${data.firstName} ${data.lastName}`.trim()
      : 'Flourish Ralph',
  );
  const [email, setEmail] = useState(data?.email ?? 'flo@juskel.co.uk');

  const toggleSector = (s: string) =>
    setSectors((cur) =>
      cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s],
    );

  const save = () => {
    completeOrganisation();
    toast.success('Organisation profile created');
    router.push(ROUTES.lender.dashboard);
  };

  const back = () => {
    setStage('terms');
    router.push(ROUTES.lender.terms);
  };

  return (
    <LenderShell
      title='Set up your organisation'
      subtitle='Create your lender profile to establish your organisation’s workspace. Your products, matched SMEs, applications and pipeline are managed within your organisation and are not visible to other lenders.'
    >
      <div className='flex max-w-233 flex-col gap-10'>
        <div className='flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-6 lg:p-7'>
          <Field label='Organisation name'>
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label='Type of lender / capital provider'>
            <div className='relative'>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={cn(inputCls, 'appearance-none pr-11')}
              >
                {LENDER_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <ChevronDown className='pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-gray-500' />
            </div>
          </Field>

          {/* Focus sectors */}
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col'>
              <p className='text-body-md font-semibold text-carbon-black'>
                Focus sectors (Optional)
              </p>
              <p className='text-body-sm text-gray-500'>
                Select the sectors you’re most interested in funding.
              </p>
            </div>
            <div className='flex flex-wrap gap-4'>
              {SECTORS.map((s) => {
                const on = sectors.includes(s);
                return (
                  <button
                    key={s}
                    type='button'
                    onClick={() => toggleSector(s)}
                    aria-pressed={on}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-2xl border py-1 text-body-sm font-medium transition-colors',
                      on
                        ? 'border-teal-charcoal bg-primary pl-3 pr-2.5 text-mineral-white'
                        : 'border-gray-300 bg-gray-200 px-3 text-gray-800 hover:border-gray-400',
                    )}
                  >
                    {s}
                    {on && <Check className='size-3' />}
                  </button>
                );
              })}
            </div>
            <p className='text-body-sm text-gray-500'>
              Leave empty to receive matches across all sectors.
            </p>
          </div>

          <div className='flex flex-col gap-4 sm:flex-row'>
            <Field label='Primary market / Markets served'>
              <input
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label='Primary contact name'>
              <input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label='Primary contact email'>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        {/* Actions */}
        <div className='flex items-center justify-between'>
          <button
            type='button'
            onClick={back}
            className='inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-base font-semibold text-gray-700 shadow-xs hover:bg-muted'
          >
            <ChevronLeft className='size-5' />
            Back
          </button>
          <button
            type='button'
            disabled={orgName.trim() === '' || type === ''}
            onClick={save}
            className={cn(
              'rounded-lg px-5 py-3 text-base font-semibold shadow-xs',
              orgName.trim() && type
                ? 'bg-primary text-mineral-white'
                : 'cursor-not-allowed bg-stone-grey text-gray-400',
            )}
          >
            Save
          </button>
        </div>
      </div>
    </LenderShell>
  );
}
