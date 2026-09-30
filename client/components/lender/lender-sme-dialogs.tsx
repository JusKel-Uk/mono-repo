'use client';

import { useState } from 'react';
import { AlertOctagon, Calendar, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { useLenderMe } from '@/lib/hooks/use-lender-me';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const fieldCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-body-md text-carbon-black placeholder:text-gray-400 focus:border-teal-charcoal focus:outline-none';

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className='text-body-sm font-medium text-gray-700'>{children}</span>
  );
}

function ModalAlert({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex items-start gap-3 rounded-2xl border border-mineral-white bg-abyssal p-4'>
      <AlertOctagon className='mt-0.5 size-4 shrink-0 text-mineral-white' />
      <p className='text-label-md text-mineral-white'>{children}</p>
    </div>
  );
}

function useOrgContext() {
  const { data } = useLenderMe();
  const org = data?.organisation.name ?? 'your organisation';
  const contact =
    data && (data.firstName || data.lastName)
      ? `${data.firstName} ${data.lastName}`.trim()
      : 'you';
  return { org, contact };
}

const now = () =>
  new Date().toLocaleString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/* ------------------------------------------------------------- Make offer */

const DECLINE_REASONS = [
  'Outside funding criteria',
  'Insufficient funding readiness',
  'Sector not currently funded',
  'Funding amount mismatch',
  'Incomplete or unverified evidence',
  'Other',
];

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex flex-col gap-0.5'>
      <p className='text-body-sm text-gray-500'>{label}</p>
      <p className='text-body-md text-carbon-black'>{value}</p>
    </div>
  );
}

function MakeOfferDialog({ smeName }: { smeName: string }) {
  const { org, contact } = useOrgContext();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'form' | 'confirm'>('form');

  const [amount, setAmount] = useState('£100,000');
  const [term, setTerm] = useState('24 months');
  const [pricing, setPricing] = useState('6.4% APR fixed');
  const [conditions, setConditions] = useState(
    'Personal guarantee from directors; 12 months management accounts',
  );
  const [expiry, setExpiry] = useState('05/10/2026');
  const [status, setStatus] = useState<'non-binding' | 'binding'>('binding');
  const [confirmed, setConfirmed] = useState(false);

  const reset = () => {
    setStep('form');
    setConfirmed(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <button
          type='button'
          className='inline-flex items-center rounded-lg bg-primary px-5 py-3 text-base font-semibold text-mineral-white shadow-xs'
        >
          Make an offer
        </button>
      </DialogTrigger>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-xl'>
        {step === 'form' ? (
          <>
            <DialogHeader>
              <DialogTitle className='text-body-lg font-semibold text-carbon-black'>
                Make an offer
              </DialogTitle>
              <DialogDescription className='text-body-sm text-gray-500'>
                Create a structured offer for {smeName} against their existing
                funding application.
              </DialogDescription>
            </DialogHeader>

            <div className='flex flex-col gap-4'>
              <label className='flex flex-col gap-1.5'>
                <Label>Funding product*</Label>
                <div className='relative'>
                  <select
                    className={cn(fieldCls, 'appearance-none pr-10')}
                    defaultValue='Clean Growth Financing · Green Loan'
                  >
                    <option>Clean Growth Financing · Green Loan</option>
                    <option>Energy Efficiency Asset Finance</option>
                  </select>
                  <ChevronDown className='pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-gray-500' />
                </div>
              </label>

              <label className='flex flex-col gap-1.5'>
                <Label>Available funding range</Label>
                <input
                  className={cn(fieldCls, 'bg-muted text-gray-500')}
                  value='£25,000–£250,000'
                  readOnly
                />
              </label>

              <div className='flex flex-col gap-4 sm:flex-row'>
                <label className='flex flex-1 flex-col gap-1.5'>
                  <Label>Offer amount (£)*</Label>
                  <input
                    className={fieldCls}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </label>
                <label className='flex flex-1 flex-col gap-1.5'>
                  <Label>Term (months)*</Label>
                  <input
                    className={fieldCls}
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                  />
                </label>
              </div>

              <label className='flex flex-col gap-1.5'>
                <Label>Pricing / indicative rate</Label>
                <input
                  className={fieldCls}
                  value={pricing}
                  onChange={(e) => setPricing(e.target.value)}
                />
                <span className='text-body-sm text-gray-500'>
                  Optional where applicable.
                </span>
              </label>

              <label className='flex flex-col gap-1.5'>
                <Label>Key conditions*</Label>
                <input
                  className={fieldCls}
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                />
              </label>

              <label className='flex flex-col gap-1.5'>
                <Label>Offer expiry date*</Label>
                <div className='relative'>
                  <input
                    className={cn(fieldCls, 'pr-10')}
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                  />
                  <Calendar className='pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-gray-500' />
                </div>
              </label>

              <div className='flex flex-col gap-1.5'>
                <Label>Offer status*</Label>
                {(
                  [
                    {
                      key: 'non-binding',
                      title: 'Non-binding (indicative)',
                      sub: "Indicative terms, subject to your organisation's credit approval, due diligence and final documentation.",
                    },
                    {
                      key: 'binding',
                      title: 'Binding (formal offer)',
                      sub: 'A formal offer approved by your organisation and subject to the terms and conditions stated.',
                    },
                  ] as const
                ).map((o) => (
                  <button
                    key={o.key}
                    type='button'
                    onClick={() => setStatus(o.key)}
                    className='flex items-start gap-3 rounded-lg border border-gray-300 p-3.5 text-left'
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border',
                        status === o.key
                          ? 'border-teal-charcoal'
                          : 'border-carbon-black',
                      )}
                    >
                      {status === o.key && (
                        <span className='size-2.5 rounded-full bg-teal-charcoal' />
                      )}
                    </span>
                    <span className='flex flex-col'>
                      <span className='text-body-sm font-medium text-carbon-black'>
                        {o.title}
                      </span>
                      <span className='text-label-md text-gray-500'>{o.sub}</span>
                    </span>
                  </button>
                ))}
              </div>

              <ModalAlert>
                This offer is made solely by {org}. JusKel is not a lender, does
                not provide credit or financial advice, and is not a party to any
                agreement between you and the SME.
              </ModalAlert>

              <label className='flex items-start gap-3'>
                <input
                  type='checkbox'
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className='mt-0.5 size-4 shrink-0 rounded border-gray-300 accent-teal-charcoal'
                />
                <span className='text-body-sm text-carbon-black'>
                  I confirm this offer is made by {org} and that I have reviewed
                  the information above.
                </span>
              </label>
            </div>

            <div className='flex gap-3'>
              <button
                type='button'
                onClick={() => setOpen(false)}
                className='flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base font-semibold text-gray-700 shadow-xs'
              >
                Cancel
              </button>
              <button
                type='button'
                disabled={!confirmed || !amount || !term}
                onClick={() => setStep('confirm')}
                className={cn(
                  'flex-1 rounded-lg px-4 py-2.5 text-base font-semibold shadow-xs',
                  confirmed && amount && term
                    ? 'bg-primary text-mineral-white'
                    : 'cursor-not-allowed bg-stone-grey text-gray-400',
                )}
              >
                Review offer
              </button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className='text-body-lg font-semibold text-carbon-black'>
                Confirm your offer
              </DialogTitle>
              <DialogDescription className='text-body-sm text-gray-500'>
                Review the offer details before sending. Once sent, the SME will
                see this offer on their application.
              </DialogDescription>
            </DialogHeader>

            <div className='flex flex-col gap-5'>
              <div className='grid grid-cols-2 gap-x-6 gap-y-5'>
                <Summary label='Funding product' value='Clean Growth Financing' />
                <Summary label='Offer amount' value={amount} />
                <Summary label='Term' value={term} />
                <Summary label='Pricing' value={pricing} />
                <Summary label='Expires' value={expiry} />
                <Summary
                  label='Status'
                  value={
                    status === 'binding'
                      ? 'Binding (formal offer)'
                      : 'Non-binding (indicative)'
                  }
                />
              </div>
              <Summary label='Key conditions' value={conditions} />
              <Summary
                label='Made by'
                value={`${contact} · ${org} · ${now()}`}
              />
              <ModalAlert>
                Sending this offer will move the application to{' '}
                <span className='font-bold'>Formal offer</span>. Your private
                pipeline status will not change.
              </ModalAlert>
            </div>

            <div className='flex gap-3'>
              <button
                type='button'
                onClick={() => setStep('form')}
                className='flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base font-semibold text-gray-700 shadow-xs'
              >
                Edit
              </button>
              <button
                type='button'
                onClick={() => {
                  toast.success(`Offer sent to ${smeName}`);
                  setOpen(false);
                  reset();
                }}
                className='flex-1 rounded-lg bg-primary px-4 py-2.5 text-base font-semibold text-mineral-white shadow-xs'
              >
                Send offer
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------------------------------------- Request info */

function RequestInfoDialog({ smeName }: { smeName: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type='button'
          className='inline-flex items-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-base font-semibold text-gray-700 shadow-xs hover:bg-muted'
        >
          Request information
        </button>
      </DialogTrigger>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle className='text-body-lg font-semibold text-carbon-black'>
            Request information
          </DialogTitle>
          <DialogDescription className='text-body-sm text-gray-500'>
            Ask {smeName} for additional documents or context. They’ll be
            notified and can respond on their application.
          </DialogDescription>
        </DialogHeader>

        <label className='flex flex-col gap-1.5'>
          <Label>Your message</Label>
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder='Please provide your latest management accounts and cash flow forecast so we can better assess your current financial position and funding requirements. If available, please also include any supporting documents that provide additional context on your business performance.'
            className={cn(fieldCls, 'resize-none')}
          />
        </label>

        <div className='flex gap-3'>
          <button
            type='button'
            onClick={() => setOpen(false)}
            className='flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base font-semibold text-gray-700 shadow-xs'
          >
            Cancel
          </button>
          <button
            type='button'
            disabled={!message.trim()}
            onClick={() => {
              toast.success(`Information request sent to ${smeName}`);
              setOpen(false);
              setMessage('');
            }}
            className={cn(
              'flex-1 rounded-lg px-4 py-2.5 text-base font-semibold shadow-xs',
              message.trim()
                ? 'bg-primary text-mineral-white'
                : 'cursor-not-allowed bg-stone-grey text-gray-400',
            )}
          >
            Send request
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------------------------------------- Decline */

function DeclineDialog({ smeName }: { smeName: string }) {
  const { org, contact } = useOrgContext();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [explanation, setExplanation] = useState('');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type='button'
          className='inline-flex items-center rounded-lg border border-error-300 bg-white px-5 py-3 text-base font-semibold text-error-600 shadow-xs hover:bg-error-50'
        >
          Decline application
        </button>
      </DialogTrigger>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle className='text-body-lg font-semibold text-carbon-black'>
            Decline application
          </DialogTitle>
          <DialogDescription className='text-body-sm text-gray-500'>
            {smeName}’s application will be marked as Declined. This action
            cannot be undone from the portal.
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-4'>
          <label className='flex flex-col gap-1.5'>
            <Label>Decline reason*</Label>
            <div className='relative'>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={cn(
                  fieldCls,
                  'appearance-none pr-10',
                  reason ? 'text-carbon-black' : 'text-gray-400',
                )}
              >
                <option value=''>Select a reason</option>
                {DECLINE_REASONS.map((r) => (
                  <option key={r} value={r} className='text-carbon-black'>
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDown className='pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-gray-500' />
            </div>
          </label>

          <label className='flex flex-col gap-1.5'>
            <Label>Internal note</Label>
            <input
              className={fieldCls}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional. For your organisation's internal records only."
            />
          </label>

          <label className='flex flex-col gap-1.5'>
            <Label>Explanation for the SME</Label>
            <textarea
              rows={3}
              className={cn(fieldCls, 'resize-none')}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder='Optional. This explanation will be shared with the SME.'
            />
          </label>

          <ModalAlert>
            Recorded as {contact} · {org} · {now()}. The decline decision is made
            by your organisation. JusKel shares the selected decline category and
            any SME-facing explanation you provide. Internal notes are never
            shown to the SME.
          </ModalAlert>
        </div>

        <div className='flex gap-3'>
          <button
            type='button'
            onClick={() => setOpen(false)}
            className='flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base font-semibold text-gray-700 shadow-xs'
          >
            Cancel
          </button>
          <button
            type='button'
            disabled={!reason}
            onClick={() => {
              toast.success(`${smeName}’s application declined`);
              setOpen(false);
            }}
            className={cn(
              'flex-1 rounded-lg px-4 py-2.5 text-base font-semibold text-mineral-white shadow-xs',
              reason
                ? 'bg-error-600'
                : 'cursor-not-allowed bg-stone-grey text-gray-400',
            )}
          >
            Confirm decline
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------- */

/** The three lender decision actions on an SME summary, each opening a dialog. */
export function SmeActionButtons({ smeName }: { smeName: string }) {
  return (
    <div className='flex flex-wrap gap-3'>
      <MakeOfferDialog smeName={smeName} />
      <RequestInfoDialog smeName={smeName} />
      <DeclineDialog smeName={smeName} />
    </div>
  );
}
