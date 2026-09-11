'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  CircleCheck,
  Pencil,
  ShieldCheck,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { type FundingMatch } from '@/lib/dashboard/funding-matches';
import { useFundingStore } from '@/stores/fundingStore';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

const STEPS = [
  'Amount & purpose',
  'Company',
  'Required documents',
  'Review & submit',
];

const USE_OPTIONS = [
  'Equipment / machinery',
  'Working capital',
  'Premises / expansion',
  'Sustainability upgrade',
];
const URGENCY_OPTIONS = ['Within 3 months', '3–6 months', '6–12 months'];

const DOC_ROWS = [
  'Last 12 months of management accounts',
  'Latest filed statutory accounts',
  '6 months of business bank statements',
  'Provide 12-month cashflow forecast',
];
const EVIDENCE_FILES = [
  'Management_Accounts_2025.pdf',
  'Financial_Statements_2024.pdf',
  'Cashflow_Report_Q1.pdf',
];

const COMPANY_FIELDS = [
  { key: 'name', label: 'Company name', value: 'Juskel Technology Ltd' },
  { key: 'ch', label: 'Companies House number', value: '1234567890' },
  { key: 'contact', label: 'Primary contact name', value: 'Flourish Ralph' },
  { key: 'role', label: 'Role', value: 'Founder & Managing Director' },
  { key: 'email', label: 'Email', value: 'Flo@juskel.co.uk' },
  { key: 'phone', label: 'Phone', value: '+44 117 000 0000' },
] as const;

const FINANCIALS = [
  { label: 'TURNOVER', value: '£4.2M' },
  { label: 'EBITDA', value: '£512k' },
  { label: 'EMPLOYEES', value: '34' },
  { label: 'YEARS TRADING', value: '7' },
];

const INPUT =
  'h-13 w-full rounded-xl border border-gray-300 bg-white px-4 text-body-sm text-carbon-black outline-none placeholder:text-gray-400 focus:border-primary lg:h-14 lg:text-body-md';

/* ---------- shared field bits ---------- */
function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col gap-2'>
      <span className='text-body-sm font-medium text-carbon-black lg:text-body-md'>
        {label}
      </span>
      {children}
      {helper && (
        <p className='text-label-md text-gray-500 lg:text-body-sm'>{helper}</p>
      )}
    </div>
  );
}

function RadioPills({
  options,
  value,
  onChange,
  cols,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  cols: string;
}) {
  return (
    <div className={cn('grid gap-3', cols)}>
      {options.map((opt) => {
        const sel = value === opt;
        return (
          <button
            key={opt}
            type='button'
            onClick={() => onChange(opt)}
            className={cn(
              'flex h-13 items-center gap-3 rounded-xl border px-4 text-left text-body-sm lg:h-14 lg:text-body-md',
              sel ? 'border-primary' : 'border-gray-300',
            )}
          >
            <span
              className={cn(
                'flex size-4 shrink-0 items-center justify-center rounded-full border',
                sel ? 'border-primary' : 'border-carbon-black',
              )}
            >
              {sel && <span className='size-2 rounded-full bg-primary' />}
            </span>
            <span className='text-carbon-black'>{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- stepper ---------- */
function Stepper({ current }: { current: number }) {
  return (
    <div className='grid grid-cols-2 gap-x-10 gap-y-6 lg:grid-cols-4 lg:gap-x-5'>
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const teal = done || active;
        return (
          <div key={label} className='flex flex-col gap-3'>
            <div className='flex items-center gap-3'>
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium lg:size-7 lg:text-body-sm',
                  teal
                    ? 'bg-primary text-mineral-white'
                    : 'bg-gray-300 text-gray-500',
                )}
              >
                {done ? <Check className='size-3.5 lg:size-4' /> : i + 1}
              </span>
              <span
                className={cn(
                  'text-body-sm lg:text-body-md',
                  teal ? 'text-primary' : 'text-carbon-black',
                )}
              >
                {label}
              </span>
            </div>
            <div
              className={cn(
                'h-0.5 w-full rounded-full',
                teal ? 'bg-primary' : 'bg-gray-200',
              )}
            />
          </div>
        );
      })}
    </div>
  );
}

/* ---------- attach-document modal ---------- */
function AttachModal({
  onClose,
  onAttach,
}: {
  onClose: () => void;
  onAttach: (file: string) => void;
}) {
  const [selected, setSelected] = useState('');
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,10,10,0.7)] p-4 backdrop-blur-sm'>
      <div className='flex w-full max-w-100 flex-col overflow-hidden rounded-2xl bg-white shadow-xl'>
        <div className='flex items-start justify-between gap-4 px-6 pt-6'>
          <div className='flex flex-col gap-1'>
            <p className='text-body-lg font-semibold text-carbon-black'>
              Attach document
            </p>
            <p className='text-body-sm text-gray-600'>
              Choose how you’d like to attach this requirement.
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            aria-label='Close'
            className='shrink-0 text-gray-500 hover:text-carbon-black'
          >
            <X className='size-6' />
          </button>
        </div>

        <div className='flex flex-col gap-3 px-6 pt-5'>
          <p className='text-body-md font-medium text-carbon-black'>
            From your Documents
          </p>
          {EVIDENCE_FILES.map((f) => {
            const sel = selected === f;
            return (
              <button
                key={f}
                type='button'
                onClick={() => setSelected(f)}
                className='flex items-center justify-between gap-3 text-left'
              >
                <span className='flex items-center gap-3'>
                  {sel ? (
                    <CircleCheck className='size-4 shrink-0 text-success-600' />
                  ) : (
                    <span className='size-4 shrink-0 rounded-full border border-primary' />
                  )}
                  <span className='text-body-sm font-medium text-gray-700'>
                    {f}
                  </span>
                </span>
                <span className='inline-flex items-center rounded-2xl border border-success-200 bg-success-50 px-2 py-0.5 text-label-sm font-medium text-success-600 uppercase'>
                  Validated
                </span>
              </button>
            );
          })}
          <button
            type='button'
            className='w-fit text-body-sm font-semibold text-primary underline'
          >
            Upload a new file
          </button>
        </div>

        <div className='flex gap-3 px-6 pt-4 pb-6'>
          <button
            type='button'
            onClick={onClose}
            className='h-11 flex-1 rounded-lg border border-gray-300 bg-white text-body-sm font-semibold text-gray-700 shadow-xs'
          >
            Cancel
          </button>
          <button
            type='button'
            disabled={!selected}
            onClick={() => onAttach(selected)}
            className={cn(
              'h-11 flex-1 rounded-lg text-body-sm font-semibold shadow-xs',
              selected
                ? 'bg-primary text-mineral-white'
                : 'bg-[#d6ded9] text-gray-400',
            )}
          >
            Attach document
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- summary (review) ---------- */
function SummarySection({
  title,
  onEdit,
  rows,
}: {
  title: string;
  onEdit: () => void;
  rows: { label: string; value: string; block?: boolean }[];
}) {
  return (
    <div className='flex flex-col gap-3 py-5 first:pt-0 last:pb-0'>
      <div className='flex items-center justify-between gap-4'>
        <p className='text-body-sm font-medium text-carbon-black uppercase lg:text-body-md'>
          {title}
        </p>
        <button
          type='button'
          onClick={onEdit}
          className='inline-flex items-center gap-1.5 text-label-md text-primary lg:text-body-sm'
        >
          <Pencil className='size-4' />
          Edit
        </button>
      </div>
      <div className='flex flex-col gap-2'>
        {rows.map((r) => (
          <div
            key={r.label}
            className={cn(
              'text-label-md lg:text-body-sm',
              r.block ? 'flex flex-col gap-1' : 'flex justify-between gap-4',
            )}
          >
            <span className='text-gray-500'>{r.label}</span>
            <span
              className={cn('text-carbon-black', !r.block && 'text-right')}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= wizard ================= */
export function FundingApplyReviewed({ match }: { match: FundingMatch }) {
  const router = useRouter();
  const addApplication = useFundingStore((s) => s.addApplication);

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('');
  const [use, setUse] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('');
  const [attached, setAttached] = useState<Record<number, string>>({});
  const [modalRow, setModalRow] = useState<number | null>(null);
  const [agreed, setAgreed] = useState(false);

  const attachedCount = Object.keys(attached).length;
  const exit = () => router.push(ROUTES.sme.fundingMatches);

  const stepValid = [
    Boolean(amount && term && use && urgency),
    true,
    attachedCount === DOC_ROWS.length,
    agreed,
  ][step];

  const submit = () => {
    addApplication(match.id);
    setSubmitted(true);
  };

  /* ---- submitted confirmation ---- */
  if (submitted) {
    return (
      <DashboardShell
        title='Application submitted'
        subtitle='Your application has been submitted successfully.'
      >
        <div className='flex min-h-108 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-6'>
          <div className='flex max-w-137.5 flex-col items-center gap-5 text-center'>
            <CircleCheck
              className='size-10 text-primary lg:size-16'
              strokeWidth={1.5}
            />
            <div className='flex flex-col gap-2'>
              <p className='text-body-lg font-semibold text-carbon-black lg:text-h3'>
                Your application has been submitted successfully
              </p>
              <p className='text-body-sm text-gray-500 lg:text-body-lg'>
                You can track your application status and view updates from your
                Applications page.
              </p>
            </div>
            <Link
              href={`${ROUTES.sme.fundingMatches}/applications`}
              className='inline-flex h-14 items-center justify-center rounded-lg bg-primary px-5 text-body-sm font-semibold text-mineral-white shadow-xs transition-opacity hover:opacity-90 lg:text-body-md'
            >
              View applications
            </Link>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const isReview = step === 3;

  return (
    <DashboardShell
      title={`${match.product} application`}
      subtitle={match.provider}
    >
      <Link
        href={ROUTES.sme.fundingMatches}
        className='inline-flex w-fit items-center gap-2 text-body-sm text-gray-700 lg:text-body-md'
      >
        <ArrowLeft className='size-4.5 lg:size-5.5' />
        Back to matches
      </Link>

      <Stepper current={step} />

      {/* ---- step card ---- */}
      <div className='rounded-2xl border border-gray-200 bg-white p-5 lg:p-7'>
        {step === 0 && (
          <div className='flex flex-col gap-6'>
            <div className='flex flex-col gap-1'>
              <h2 className='text-body-md font-semibold text-carbon-black lg:text-h5'>
                How much would you like to borrow?
              </h2>
              <p className='text-body-sm text-gray-500 lg:text-body-md'>
                Fill in your information to tell the lender about your company
                and reasons for applying for this fund.
              </p>
            </div>
            <div className='grid gap-5 lg:grid-cols-2'>
              <Field label='Amount (GBP)' helper={`Amount: ${match.amount}`}>
                <div className='relative'>
                  <span className='absolute top-1/2 left-4 -translate-y-1/2 text-body-sm text-carbon-black lg:text-body-md'>
                    £
                  </span>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode='numeric'
                    placeholder=''
                    className={cn(INPUT, 'pl-8')}
                  />
                </div>
              </Field>
              <Field label='Preferred term (months)' helper={`Term: ${match.term}`}>
                <input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  inputMode='numeric'
                  placeholder='e.g. 36'
                  className={INPUT}
                />
              </Field>
            </div>
            <Field label='Primary use of funds'>
              <RadioPills
                options={USE_OPTIONS}
                value={use}
                onChange={setUse}
                cols='lg:grid-cols-2'
              />
            </Field>
            <Field
              label="Tell us more about how you'll use the funding"
              helper='Give a brief explanation of how you intend to make use of the funding.'
            >
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Describe the sustainability action you plan to take, including what will change and its expected environmental impact.'
                className='min-h-30 w-full rounded-xl border border-gray-300 bg-white p-4 text-body-sm text-carbon-black outline-none placeholder:text-gray-400 focus:border-primary lg:text-body-md'
              />
            </Field>
            <Field label='How urgently do you need the funds?'>
              <RadioPills
                options={URGENCY_OPTIONS}
                value={urgency}
                onChange={setUrgency}
                cols='lg:grid-cols-3'
              />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className='flex flex-col gap-6'>
            <div className='flex flex-col gap-1'>
              <h2 className='text-body-md font-semibold text-carbon-black lg:text-h5'>
                Confirm your company information
              </h2>
              <p className='text-body-sm text-gray-500 lg:text-body-md'>
                We have pre-filled this from your JusKel profile, you can update
                anything that is out of date.
              </p>
            </div>
            <div className='grid gap-5 lg:grid-cols-2'>
              {COMPANY_FIELDS.map((f) => (
                <Field key={f.key} label={f.label}>
                  <input defaultValue={f.value} className={INPUT} />
                </Field>
              ))}
            </div>
            <div className='flex flex-col gap-4 rounded-lg border border-gray-200 p-4 lg:p-5'>
              <p className='text-body-sm font-medium text-carbon-black'>
                Financial information to be included with this application
              </p>
              <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
                {FINANCIALS.map((s) => (
                  <div key={s.label} className='flex flex-col'>
                    <span className='text-label-md text-gray-500 lg:text-body-sm'>
                      {s.label}
                    </span>
                    <span className='text-body-sm font-semibold text-carbon-black lg:font-normal'>
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
              <p className='text-label-sm text-gray-700 lg:text-label-md'>
                Do you need to update these?{' '}
                <Link
                  href={`${ROUTES.sme.assessment}/financial-profile`}
                  className='text-primary underline'
                >
                  Edit your financial profile
                </Link>
                .
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className='flex flex-col gap-6'>
            <div className='flex flex-col gap-1'>
              <h2 className='text-body-md font-semibold text-carbon-black lg:text-h5'>
                Upload the required documents
              </h2>
              <p className='text-body-sm text-gray-500 lg:text-body-md'>
                Attach the following documents for the lender to review your
                application.
              </p>
            </div>
            <div className='flex flex-col gap-4'>
              {DOC_ROWS.map((doc, i) => {
                const done = Boolean(attached[i]);
                return (
                  <div
                    key={doc}
                    className='flex items-center justify-between gap-3 rounded-xl border border-gray-300 px-4 py-3'
                  >
                    <div className='flex items-center gap-3'>
                      {done ? (
                        <CircleCheck className='size-5 shrink-0 text-success-600 lg:size-6' />
                      ) : (
                        <span className='size-5 shrink-0 rounded-full border border-carbon-black lg:size-6' />
                      )}
                      <span
                        className={cn(
                          'text-body-sm text-carbon-black lg:text-body-md',
                          done && 'line-through',
                        )}
                      >
                        {doc}
                      </span>
                    </div>
                    <button
                      type='button'
                      onClick={() => setModalRow(i)}
                      className='inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-primary px-4 text-body-sm font-medium text-mineral-white lg:h-11 lg:rounded-xl lg:text-body-md'
                    >
                      {done ? 'Attached' : 'Attach'}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className='flex items-start gap-3 rounded-2xl border border-mineral-white bg-abyssal p-6 text-mineral-white'>
              <ShieldCheck className='size-4 shrink-0 lg:size-6' />
              <p className='text-label-md lg:text-body-md'>
                Your documents are encrypted at rest and will be shared securely
                with {match.provider} when you submit your application and
                provide the required consent.
              </p>
            </div>
          </div>
        )}

        {isReview && (
          <div className='flex flex-col gap-6'>
            <div className='flex flex-col gap-1'>
              <h2 className='text-body-md font-semibold text-carbon-black lg:text-h5'>
                Review your application
              </h2>
              <p className='text-body-sm text-gray-500 lg:text-body-md'>
                Review the information you are preparing to submit with this
                application.
              </p>
            </div>
            <div className='divide-y divide-gray-200 rounded-2xl border border-gray-200 p-5 lg:p-6'>
              <SummarySection
                title='Amount & purpose'
                onEdit={() => setStep(0)}
                rows={[
                  { label: 'Amount', value: amount ? `£${amount}` : '—' },
                  { label: 'Term', value: term ? `${term} months` : '—' },
                  { label: 'Use of funds', value: use || '—' },
                  { label: 'Urgency', value: urgency || '—' },
                  {
                    label: 'Reason for loan:',
                    value: description || '—',
                    block: true,
                  },
                ]}
              />
              <SummarySection
                title='Company & contact'
                onEdit={() => setStep(1)}
                rows={[
                  { label: 'Company', value: 'Juskel Technology Ltd (1234567890)' },
                  {
                    label: 'Contact',
                    value: 'Flourish Ralph · Founder & Managing Director',
                  },
                  {
                    label: 'Reachable at',
                    value: 'Flo@juskel.co.uk · +44 117 000 0000',
                  },
                ]}
              />
              <SummarySection
                title='Documents'
                onEdit={() => setStep(2)}
                rows={[
                  {
                    label: 'Attached',
                    value: `${attachedCount} of ${DOC_ROWS.length}`,
                  },
                ]}
              />
            </div>
            <label className='flex cursor-pointer items-start gap-3 rounded-2xl border border-mineral-white bg-abyssal p-6 text-mineral-white'>
              <input
                type='checkbox'
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className='mt-0.5 size-4 shrink-0 accent-primary'
              />
              <span className='text-label-md lg:text-body-md'>
                I confirm the information above is accurate and I authorise
                JusKel to share it with {match.provider} for the sole purpose of
                assessing this funding application. I’ve read the{' '}
                <span className='underline'>Data Sharing Notice</span>.
              </span>
            </label>
          </div>
        )}
      </div>

      {/* ---- footer nav ---- */}
      <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-between gap-3'>
          <button
            type='button'
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className={cn(
              'inline-flex h-12 items-center gap-1.5 rounded-lg border bg-white px-5 text-body-sm font-semibold shadow-xs lg:h-14 lg:text-body-md',
              step === 0
                ? 'border-gray-200 text-gray-300'
                : 'border-gray-300 text-gray-700',
            )}
          >
            <ChevronLeft className='size-5' />
            Back
          </button>
          <div className='flex items-center gap-3 lg:gap-10'>
            <button
              type='button'
              onClick={exit}
              className='hidden h-14 items-center rounded-lg border border-gray-300 bg-white px-5 text-body-md font-semibold text-gray-700 shadow-xs lg:inline-flex'
            >
              Save and Exit
            </button>
            <button
              type='button'
              disabled={!stepValid}
              onClick={() => (isReview ? submit() : setStep((s) => s + 1))}
              className={cn(
                'inline-flex h-12 items-center justify-center rounded-lg px-5 text-body-sm font-semibold shadow-xs lg:h-14 lg:text-body-md',
                stepValid
                  ? 'bg-primary text-mineral-white'
                  : 'bg-[#d6ded9] text-gray-400',
              )}
            >
              {isReview ? 'Submit application' : 'Continue'}
            </button>
          </div>
        </div>
        <button
          type='button'
          onClick={exit}
          className='self-end text-body-sm font-semibold text-primary underline lg:hidden'
        >
          Save and Exit
        </button>
      </div>

      {modalRow !== null && (
        <AttachModal
          onClose={() => setModalRow(null)}
          onAttach={(file) => {
            setAttached((a) => ({ ...a, [modalRow]: file }));
            setModalRow(null);
          }}
        />
      )}
    </DashboardShell>
  );
}
