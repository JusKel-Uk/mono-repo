'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { LenderShell } from '@/components/lender/lender-shell';
import { LenderDisclaimer } from '@/components/lender/lender-disclaimer';
import { PRODUCTS } from '@/components/lender/lender-funding-products';

const TYPES = [
  'Loan',
  'Green Loan',
  'Asset Finance',
  'Revolving Credit',
  'Grant',
  'Equity',
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
const STAGES = [
  'Early (0–2 years trading)',
  'Growing (3–5 years trading)',
  'Established (6+ years trading)',
];
const READINESS = ['Developing', 'Ready', 'Advanced'];
const SCORE_BANDS = ['41 and above', '61 and above', '81 and above'];
const GRANT_PURPOSES = [
  'Capital equipment',
  'Energy efficiency upgrades',
  'Decarbonisation projects',
  'R&D / innovation',
  'Training & skills',
  'Working capital',
];
const INVESTMENT_STAGES = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Growth'];

/** Which financial fields a product type shows. */
function categoryFor(type: string): 'debt' | 'grant' | 'equity' {
  if (type === 'Grant') return 'grant';
  if (type === 'Equity') return 'equity';
  return 'debt';
}

/* ------------------------------------------------------------- primitives */

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

const inputCls =
  'h-14 w-full rounded-xl border border-gray-300 bg-white px-4 text-body-md text-carbon-black placeholder:text-gray-400 focus:border-teal-charcoal focus:outline-none';

function SelectField({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <Field label={label}>
      <div className='relative'>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            inputCls,
            'appearance-none pr-11',
            value ? 'text-carbon-black' : 'text-gray-400',
          )}
        >
          <option value=''>{placeholder}</option>
          {options.map((o) => (
            <option key={o} value={o} className='text-carbon-black'>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown className='pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-gray-500' />
      </div>
    </Field>
  );
}

/* -------------------------------------------------------------------- view */

/**
 * Add / edit a funding product. No products endpoint yet — submitting shows a
 * toast and returns to the list. `productId` prefills name + type for edit.
 */
export function LenderProductFormView({ productId }: { productId?: string }) {
  const router = useRouter();
  const existing = productId
    ? PRODUCTS.find((p) => p.id === productId)
    : undefined;
  const editing = Boolean(existing);

  const [name, setName] = useState(existing?.name ?? '');
  const [type, setType] = useState(existing?.type ?? '');
  const [minFunding, setMinFunding] = useState('');
  const [maxFunding, setMaxFunding] = useState('');
  const [minTerm, setMinTerm] = useState('');
  const [maxTerm, setMaxTerm] = useState('');
  const [minApr, setMinApr] = useState('');
  const [maxApr, setMaxApr] = useState('');
  const [grantDuration, setGrantDuration] = useState('');
  const [grantPurpose, setGrantPurpose] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [minStake, setMinStake] = useState('');
  const [maxStake, setMaxStake] = useState('');
  const [investStage, setInvestStage] = useState('');
  const [investCriteria, setInvestCriteria] = useState('');
  const [sectors, setSectors] = useState<string[]>([]);
  const [stage, setStage] = useState('');
  const [readiness, setReadiness] = useState('');
  const [scoreBand, setScoreBand] = useState('');

  const category = categoryFor(type);
  const amountLabel = category === 'equity' ? 'investment' : 'funding';
  const canActivate =
    name.trim() !== '' && type !== '' && minFunding !== '' && maxFunding !== '';

  const toggleSector = (s: string) =>
    setSectors((cur) =>
      cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s],
    );

  const submit = (action: 'draft' | 'activate') => {
    toast.success(
      action === 'draft'
        ? `“${name || 'Product'}” saved as draft`
        : `“${name}” is now active`,
    );
    router.push(ROUTES.lender.fundingProducts);
  };

  return (
    <LenderShell
      title={editing ? 'Edit funding product' : 'Add a funding product'}
      subtitle='Set your criteria to control which SMEs the matching engine surfaces. Tighter criteria mean fewer, more relevant matches.'
    >
      <div className='flex flex-col gap-6'>
        <Link
          href={ROUTES.lender.fundingProducts}
          className='flex w-fit items-center gap-2 text-body-md text-gray-700'
        >
          <ArrowLeft className='size-5.5' />
          Back to funding products
        </Link>

        <div className='flex flex-col gap-6'>
          <div className='flex max-w-233 flex-col gap-10'>
            {/* Product details card */}
            <div className='flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-6 lg:p-7'>
              <div className='flex flex-col gap-1'>
                <h2 className='text-h5 font-semibold text-carbon-black'>
                  Product details
                </h2>
                <p className='text-body-md text-gray-500'>
                  Define what matched SMEs will see about your funding product
                  and why it may be relevant to them.
                </p>
              </div>

              <div className='flex flex-col gap-5'>
                <div className='flex flex-col gap-4 sm:flex-row'>
                  <Field label='Product name'>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder='Enter product name'
                      className={inputCls}
                    />
                  </Field>
                  <SelectField
                    label='Product type'
                    value={type}
                    onChange={setType}
                    placeholder='Select type'
                    options={TYPES}
                  />
                </div>

                <div className='flex flex-col gap-4 sm:flex-row'>
                  <Field label={`Minimum ${amountLabel} (£)`}>
                    <input
                      inputMode='numeric'
                      value={minFunding}
                      onChange={(e) => setMinFunding(e.target.value)}
                      placeholder='£'
                      className={inputCls}
                    />
                  </Field>
                  <Field label={`Maximum ${amountLabel} (£)`}>
                    <input
                      inputMode='numeric'
                      value={maxFunding}
                      onChange={(e) => setMaxFunding(e.target.value)}
                      placeholder='£'
                      className={inputCls}
                    />
                  </Field>
                </div>

                {category === 'debt' && (
                  <>
                    <div className='flex flex-col gap-4 sm:flex-row'>
                      <Field label='Minimum term (months)'>
                        <input
                          inputMode='numeric'
                          value={minTerm}
                          onChange={(e) => setMinTerm(e.target.value)}
                          placeholder='e.g. 24 months'
                          className={inputCls}
                        />
                      </Field>
                      <Field label='Maximum term (months)'>
                        <input
                          inputMode='numeric'
                          value={maxTerm}
                          onChange={(e) => setMaxTerm(e.target.value)}
                          placeholder='e.g. 60 months'
                          className={inputCls}
                        />
                      </Field>
                    </div>

                    <div className='flex flex-col gap-2'>
                      <div className='flex flex-col gap-4 sm:flex-row'>
                        <Field label='Minimum Indicative APR (%)'>
                          <input
                            inputMode='decimal'
                            value={minApr}
                            onChange={(e) => setMinApr(e.target.value)}
                            placeholder='%'
                            className={inputCls}
                          />
                        </Field>
                        <Field label='Maximum Indicative APR (%)'>
                          <input
                            inputMode='decimal'
                            value={maxApr}
                            onChange={(e) => setMaxApr(e.target.value)}
                            placeholder='%'
                            className={inputCls}
                          />
                        </Field>
                      </div>
                      <p className='text-body-sm text-gray-500'>
                        The expected APR range for this funding product. Final
                        pricing is subject to your underwriting and approval
                        process.
                      </p>
                    </div>
                  </>
                )}

                {category === 'grant' && (
                  <>
                    <div className='flex flex-col gap-4 sm:flex-row'>
                      <Field label='Grant duration (Optional)'>
                        <input
                          value={grantDuration}
                          onChange={(e) => setGrantDuration(e.target.value)}
                          placeholder='e.g. 24 months'
                          className={inputCls}
                        />
                      </Field>
                      <SelectField
                        label='Grant purpose'
                        value={grantPurpose}
                        onChange={setGrantPurpose}
                        placeholder='Select the purposes this grant can support'
                        options={GRANT_PURPOSES}
                      />
                    </div>

                    <div className='flex flex-col gap-2'>
                      <Field label='Eligibility criteria'>
                        <textarea
                          rows={3}
                          value={eligibility}
                          onChange={(e) => setEligibility(e.target.value)}
                          placeholder='Describe any key eligibility requirements SMEs should meet'
                          className={cn(inputCls, 'h-auto resize-none')}
                        />
                      </Field>
                      <p className='text-body-sm text-gray-500'>
                        Grant eligibility and awards are subject to your
                        organisation’s assessment and approval process. JusKel
                        matching information is informational and does not
                        guarantee eligibility or funding.
                      </p>
                    </div>
                  </>
                )}

                {category === 'equity' && (
                  <>
                    <div className='flex flex-col gap-4 sm:flex-row'>
                      <Field label='Minimum equity stake (%)'>
                        <input
                          inputMode='decimal'
                          value={minStake}
                          onChange={(e) => setMinStake(e.target.value)}
                          placeholder='%'
                          className={inputCls}
                        />
                      </Field>
                      <Field label='Maximum equity stake (%)'>
                        <input
                          inputMode='decimal'
                          value={maxStake}
                          onChange={(e) => setMaxStake(e.target.value)}
                          placeholder='%'
                          className={inputCls}
                        />
                      </Field>
                    </div>

                    <SelectField
                      label='Investment stage'
                      value={investStage}
                      onChange={setInvestStage}
                      placeholder='Select the stages you invest in'
                      options={INVESTMENT_STAGES}
                    />

                    <div className='flex flex-col gap-2'>
                      <Field label='Investment criteria'>
                        <textarea
                          rows={3}
                          value={investCriteria}
                          onChange={(e) => setInvestCriteria(e.target.value)}
                          placeholder='Describe the key criteria your organisation considers when assessing investment opportunities'
                          className={cn(inputCls, 'h-auto resize-none')}
                        />
                      </Field>
                      <p className='text-body-sm text-gray-500'>
                        Equity investments are subject to your organisation’s
                        investment assessment, due diligence and approval
                        process. JusKel matching information is informational and
                        does not guarantee investment.
                      </p>
                    </div>
                  </>
                )}

                {/* Preferred sectors */}
                <div className='flex flex-col gap-4'>
                  <div className='flex flex-col'>
                    <p className='text-body-md font-semibold text-carbon-black'>
                      Preferred sectors (Optional)
                    </p>
                    <p className='text-body-sm text-gray-500'>
                      Select the sectors you’re most interested in funding. Leave
                      empty to see matches across all sectors.
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
                            'rounded-2xl border px-3 py-1 text-body-sm font-medium transition-colors',
                            on
                              ? 'border-teal-charcoal bg-primary text-mineral-white'
                              : 'border-gray-300 bg-gray-200 text-gray-800 hover:border-gray-400',
                          )}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Matching bands */}
                <div className='flex flex-col gap-2'>
                  <div className='flex flex-col gap-4 lg:flex-row'>
                    <SelectField
                      label='Preferred SME stage'
                      value={stage}
                      onChange={setStage}
                      placeholder='Select stage'
                      options={STAGES}
                    />
                    <SelectField
                      label='Minimum readiness band'
                      value={readiness}
                      onChange={setReadiness}
                      placeholder='Select band'
                      options={READINESS}
                    />
                    <SelectField
                      label='Minimum SFS score band'
                      value={scoreBand}
                      onChange={setScoreBand}
                      placeholder='Select band'
                      options={SCORE_BANDS}
                    />
                  </div>
                  <p className='text-body-sm text-gray-500'>
                    Score bands reflect sustainability readiness, not
                    creditworthiness. Use them to prioritise conversations, not
                    make lending decisions.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className='flex flex-wrap justify-end gap-6'>
              <button
                type='button'
                onClick={() => submit('draft')}
                className='rounded-lg border border-gray-300 bg-white px-5 py-3 text-base font-semibold text-gray-700 shadow-xs hover:bg-muted'
              >
                Save as draft
              </button>
              <button
                type='button'
                disabled={!canActivate}
                onClick={() => submit('activate')}
                className={cn(
                  'rounded-lg px-5 py-3 text-base font-semibold shadow-xs',
                  canActivate
                    ? 'bg-primary text-mineral-white'
                    : 'cursor-not-allowed bg-stone-grey text-gray-400',
                )}
              >
                Activate product
              </button>
            </div>
          </div>

          <LenderDisclaimer />
        </div>
      </div>
    </LenderShell>
  );
}
