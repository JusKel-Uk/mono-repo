'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, LogOut } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { lenderSignOut } from '@/lib/api/lender-auth';
import { useLenderMe } from '@/lib/hooks/use-lender-me';
import { LenderShell } from '@/components/lender/lender-shell';

const TABS = ['Organisation', 'Notifications', 'Security', 'Privacy'] as const;
type Tab = (typeof TABS)[number];

/* ------------------------------------------------------------- primitives */

const inputCls =
  'h-14 w-full rounded-xl border border-gray-300 bg-white px-4 text-body-md text-carbon-black placeholder:text-gray-400 focus:border-teal-charcoal focus:outline-none';

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className='flex flex-1 flex-col gap-4'>
      <label className='text-body-md font-medium text-carbon-black'>
        {label}
      </label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-6 lg:p-7'>
      <div className='flex flex-col gap-1'>
        <h2 className='text-h5 font-semibold text-carbon-black'>{title}</h2>
        <p className='text-body-md text-gray-500'>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Toggle({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type='button'
      role='switch'
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        'relative h-5 w-9 shrink-0 rounded-full transition-colors',
        on ? 'bg-primary' : 'bg-gray-300',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 size-4 rounded-full bg-white transition-transform',
          on ? 'translate-x-4.5' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

/* ------------------------------------------------------------- panels */

function OrganisationPanel() {
  const { data } = useLenderMe();
  const [name, setName] = useState(data?.organisation.name ?? 'JusKel Technology Ltd');
  const [type, setType] = useState('Challenger bank');
  const [country, setCountry] = useState('United Kingdom');
  const [sectors, setSectors] = useState('Manufacturing, Textiles, Logistics, Food & drink');
  const [contact, setContact] = useState(
    data && (data.firstName || data.lastName)
      ? `${data.firstName} ${data.lastName}`.trim()
      : 'Flourish Ralph',
  );
  const [email, setEmail] = useState(data?.email ?? 'flo@juskel.co.uk');

  return (
    <Card
      title='Organisation'
      subtitle='Manage your organisation details, funding preferences, and account-wide settings.'
    >
      <div className='flex flex-col gap-5'>
        <div className='flex flex-col gap-4 sm:flex-row'>
          <Field label='Name' value={name} onChange={setName} />
          <Field label='Type' value={type} onChange={setType} />
        </div>
        <div className='flex flex-col gap-4 sm:flex-row'>
          <Field label='Country' value={country} onChange={setCountry} />
          <Field label='Focus sectors' value={sectors} onChange={setSectors} />
        </div>
        <div className='flex flex-col gap-4 sm:flex-row'>
          <Field label='Primary contact' value={contact} onChange={setContact} />
          <Field label='Contact email' value={email} onChange={setEmail} />
        </div>
      </div>
      <button
        type='button'
        onClick={() => toast.success('Organisation details saved')}
        className='inline-flex w-fit items-center rounded-lg bg-primary px-5 py-3 text-base font-semibold text-mineral-white shadow-xs'
      >
        Save changes
      </button>
    </Card>
  );
}

const NOTIFICATIONS = [
  {
    title: 'New match alerts',
    desc: 'Notify me when a new SME is matched to one of my active funding products.',
    on: true,
  },
  {
    title: 'Weekly pipeline digest',
    desc: 'Email me a Monday summary of status changes across my organisation.',
    on: true,
  },
  {
    title: 'Pipeline activity',
    desc: 'Notify me when an SME moves to a new pipeline stage.',
    on: true,
  },
  {
    title: 'New SME interest',
    desc: 'Notify me when a matched SME indicates they’re interested in a funding opportunity.',
    on: true,
  },
  {
    title: 'Conversation updates',
    desc: 'Notify me when there’s new activity on an SME I’m currently engaging with.',
    on: true,
  },
  {
    title: 'Product status alerts',
    desc: 'Notify me when a funding product is activated, paused, or expires.',
    on: false,
  },
  {
    title: 'Match availability',
    desc: 'Notify me when new SMEs become eligible for my active funding products.',
    on: false,
  },
  {
    title: 'Organisation updates',
    desc: 'Notify me about important changes to my organisation, team access, or account settings.',
    on: true,
  },
];

function NotificationsPanel() {
  const [state, setState] = useState(NOTIFICATIONS.map((n) => n.on));
  return (
    <Card
      title='Notifications'
      subtitle='Stay informed about new matches, pipeline activity, and important account updates.'
    >
      <div className='rounded-xl border border-gray-200'>
        {NOTIFICATIONS.map((n, i) => (
          <div key={n.title}>
            {i > 0 && <div className='h-px w-full bg-gray-200' />}
            <div className='flex items-center justify-between gap-4 p-5'>
              <div className='flex min-w-0 flex-col gap-1'>
                <p className='text-body-sm font-semibold text-carbon-black'>
                  {n.title}
                </p>
                <p className='text-body-sm text-gray-500'>{n.desc}</p>
              </div>
              <Toggle
                on={state[i]}
                label={n.title}
                onToggle={() =>
                  setState((cur) => cur.map((v, j) => (j === i ? !v : v)))
                }
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SubCard({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-4 rounded-xl border border-gray-200 p-5'>
      {children}
    </div>
  );
}

function SecurityPanel() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data } = useLenderMe();

  const signOutCurrent = () => {
    lenderSignOut();
    qc.clear();
    router.push(ROUTES.lender.login);
  };

  return (
    <Card
      title='Security'
      subtitle='Keep your account secure by managing your password and sign-in settings.'
    >
      {/* Change password */}
      <SubCard>
        <div className='flex flex-col'>
          <p className='text-body-md font-medium text-carbon-black'>
            Change your password
          </p>
          <p className='text-body-sm text-gray-600'>
            Request a secure password reset link to update your password.
          </p>
        </div>
        <button
          type='button'
          onClick={() =>
            toast.success(
              `Password reset link sent to ${data?.email ?? 'your email'}`,
            )
          }
          className='inline-flex w-fit items-center rounded-lg bg-primary px-4.5 py-2.5 text-base font-semibold text-mineral-white shadow-xs'
        >
          Send password reset link
        </button>
      </SubCard>

      {/* Terms & agreements */}
      <SubCard>
        <div className='flex flex-col'>
          <p className='text-body-md font-medium text-carbon-black'>
            Terms &amp; agreements
          </p>
          <p className='text-body-sm text-gray-600'>
            View the terms and agreements you’ve accepted for your lender
            organisation.
          </p>
        </div>
        <div className='flex flex-col gap-0.5 rounded-xl border border-gray-200 p-4'>
          <p className='text-body-sm font-medium text-carbon-black'>
            Lender Platform Terms
          </p>
          <p className='text-label-md text-gray-600'>
            v2.1 · August 8, 2026 · accepted by Flourish Ralph · JusKel
            Technology Ltd
          </p>
          <p className='text-label-md text-gray-600'>
            View the terms you agreed to when setting up your lender
            organisation.
          </p>
        </div>
        <button
          type='button'
          onClick={() => toast('Lender Platform Terms')}
          className='inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-4.5 py-2.5 text-base font-semibold text-mineral-white shadow-xs'
        >
          View terms
          <ArrowRight className='size-5' />
        </button>
      </SubCard>

      {/* Active sessions */}
      <SubCard>
        <div className='flex flex-col'>
          <p className='text-body-md font-medium text-carbon-black'>
            Active sessions
          </p>
          <p className='text-body-sm text-gray-600'>
            Review the devices currently signed in to your JusKel account and
            manage access.
          </p>
        </div>
        <div className='flex flex-col gap-3'>
          {[
            {
              device: 'This browser — Chrome on macOS',
              meta: 'Bristol · Now',
              current: true,
            },
            {
              device: 'iPhone 12 Pro Max — Safari',
              meta: 'London · 2 days ago',
              current: false,
            },
          ].map((s) => (
            <div
              key={s.device}
              className='flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-4'
            >
              <div className='flex min-w-0 flex-col gap-0.5'>
                <p className='text-body-sm font-medium text-carbon-black'>
                  {s.device}
                </p>
                <p className='text-label-md text-gray-600'>{s.meta}</p>
              </div>
              <button
                type='button'
                onClick={() =>
                  s.current
                    ? signOutCurrent()
                    : toast.success(`Signed out ${s.device}`)
                }
                className='flex shrink-0 items-center gap-2 text-body-sm text-gray-700 hover:text-carbon-black'
              >
                <LogOut className='size-5' />
                Sign out
              </button>
            </div>
          ))}
        </div>
      </SubCard>
    </Card>
  );
}

function PrivacyPanel() {
  return (
    <Card
      title='Privacy'
      subtitle='Manage your privacy and user access preferences.'
    >
      <SubCard>
        <div className='flex flex-col'>
          <p className='text-body-md font-medium text-carbon-black'>
            Deactivate my user access
          </p>
          <p className='text-body-sm text-gray-600'>
            You can deactivate your Lender Portal access at any time. Once
            deactivated, you’ll no longer be able to sign in or access your
            organisation’s Lender Portal workspace. Your data will be retained or
            deleted as required by applicable privacy, legal, and
            record-retention requirements.
          </p>
        </div>
        <button
          type='button'
          onClick={() => toast('Deactivate my user access')}
          className='inline-flex w-fit items-center rounded-lg border border-mineral-white bg-primary px-4 py-2.5 text-body-sm font-semibold text-mineral-white shadow-xs'
        >
          Deactivate my user access
        </button>
      </SubCard>
    </Card>
  );
}

/* -------------------------------------------------------------------- view */

/** Lender settings — Organisation / Notifications / Security / Privacy tabs. */
export function LenderSettingsView() {
  const params = useSearchParams();
  const initial =
    TABS.find((t) => t.toLowerCase() === params.get('tab')?.toLowerCase()) ??
    'Organisation';
  const [tab, setTab] = useState<Tab>(initial);

  return (
    <LenderShell
      title='Settings'
      subtitle='Manage your organisation details, security, and account preferences.'
    >
      <div className='flex max-w-233 flex-col gap-4'>
        {/* Tab bar */}
        <div className='flex gap-2 overflow-x-auto rounded-2xl border border-gray-200 bg-primary p-4'>
          {TABS.map((t) => (
            <button
              key={t}
              type='button'
              onClick={() => setTab(t)}
              className={cn(
                'shrink-0 rounded-lg px-4 py-1.5 text-body-md transition-colors',
                tab === t
                  ? 'bg-mineral-white text-carbon-black'
                  : 'text-gray-300 hover:text-mineral-white',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Organisation' && <OrganisationPanel />}
        {tab === 'Notifications' && <NotificationsPanel />}
        {tab === 'Security' && <SecurityPanel />}
        {tab === 'Privacy' && <PrivacyPanel />}
      </div>
    </LenderShell>
  );
}
