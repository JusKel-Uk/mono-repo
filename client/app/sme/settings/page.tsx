'use client';

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ChevronDown,
  CircleCheck,
  Eye,
  Gem,
  LogOut,
  Pencil,
  Shield,
  Trash2,
  UserPlus,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import Link from 'next/link';

const TABS = ['Profile', 'Team', 'Notifications', 'Security', 'Privacy'] as const;
type Tab = (typeof TABS)[number];

const HEADING = 'text-h5 font-semibold text-carbon-black';
const SUB = 'text-body-md text-gray-500';
const CARD = 'rounded-2xl border border-gray-200 bg-white p-7';
const PRIMARY_BTN =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-white shadow-xs transition-opacity hover:opacity-90';

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('Profile');

  return (
    <DashboardShell
      title='Settings'
      subtitle='Manage your profile, team, notifications, security, and privacy settings.'
    >
      {/* Tab bar */}
      <div className='w-fit max-w-full overflow-x-auto'>
        <div className='inline-flex items-center gap-1 rounded-2xl bg-primary p-2'>
          {TABS.map((t) => (
            <button
              key={t}
              type='button'
              onClick={() => setTab(t)}
              className={cn(
                'rounded-lg px-4 py-1.5 text-base whitespace-nowrap transition-colors',
                tab === t
                  ? 'bg-mineral-white text-carbon-black'
                  : 'text-gray-300 hover:text-mineral-white',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'Profile' && <ProfilePanel />}
      {tab === 'Team' && <TeamPanel />}
      {tab === 'Notifications' && <NotificationsPanel />}
      {tab === 'Security' && <SecurityPanel />}
      {tab === 'Privacy' && <PrivacyPanel />}
    </DashboardShell>
  );
}

/* ---------------- Profile ---------------- */

const PROFILE_FIELDS = [
  { label: 'Full name', value: 'Flourish Ralph' },
  { label: 'Role', value: 'Founder & Managing Director' },
  { label: 'Email', value: 'Flo@juskel.co.uk' },
  { label: 'Phone (Optional)', value: '+44 117 000 0000' },
];

function ProfilePanel() {
  return (
    <section className={cn(CARD, 'flex flex-col gap-10')}>
      <div className='flex flex-col gap-5'>
        <div className='flex flex-col'>
          <p className={HEADING}>Your profile</p>
          <p className={SUB}>This is how your profile appears inside JusKel.</p>
        </div>
        <div className='grid gap-5 sm:grid-cols-2'>
          {PROFILE_FIELDS.map((f) => (
            <div key={f.label} className='flex flex-col gap-4'>
              <p className='text-body-md font-medium text-carbon-black'>
                {f.label}
              </p>
              <div className='flex h-14 items-center rounded-xl border border-gray-300 px-4 text-base text-carbon-black'>
                {f.value}
              </div>
            </div>
          ))}
        </div>
      </div>
      <button type='button' className={cn(PRIMARY_BTN, 'h-14 self-end px-5 text-base')}>
        Save changes
      </button>
    </section>
  );
}

/* ---------------- Team ---------------- */

const ROLES: { icon: LucideIcon; name: string; can: string; you?: boolean }[] = [
  {
    icon: Gem,
    name: 'Owner · YOU',
    can: 'Billing & plan · Manage account closure · Manage team + roles · Submit for review · Edit all sections · Manage integrations',
    you: true,
  },
  {
    icon: Shield,
    name: 'Admin',
    can: 'Manage team + roles · Submit for review · Edit all sections · Manage integrations',
  },
  {
    icon: Pencil,
    name: 'Contributor',
    can: 'Fill onboarding sections · Upload documents · View scorecard · Cannot submit or invite',
  },
  {
    icon: Eye,
    name: 'Viewer',
    can: 'Read-only scorecard + reports · No edits · No uploads · No team changes',
  },
];

const MEMBERS = [
  { initials: 'FR', name: 'Flourish Ralph · You', email: 'Flo@juskel.co.uk', role: 'Owner', owner: true },
  { initials: 'AT', name: 'Austin Tonayam', email: 'Aus@juskel.co.uk', role: 'Admin' },
  { initials: 'AO', name: 'Alo Odunayo', email: 'Alo@juskel.co.uk', role: 'Contributor' },
  { initials: 'PS', name: 'Priya Shah', email: 'Priya@juskel.co.uk', role: 'Viewer' },
];

function RoleSelect({ value }: { value: string }) {
  return (
    <div className='flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 px-4 text-sm text-carbon-black sm:w-[200px]'>
      <span>{value}</span>
      <ChevronDown className='size-5 text-gray-500' />
    </div>
  );
}

function TeamPanel() {
  return (
    <section className='flex flex-col gap-5'>
      <div className='flex flex-col'>
        <p className={HEADING}>Team &amp; roles</p>
        <p className={SUB}>
          Invite people from your company and assign roles to control who can
          edit assessments, submit for review, upload evidence, and manage the
          team.
        </p>
      </div>

      {/* Roles legend */}
      <div className='overflow-hidden rounded-lg border border-gray-200 bg-white'>
        <div className='flex gap-11 px-5 py-4 text-body-sm font-semibold text-gray-500'>
          <span className='w-[99px]'>ROLE</span>
          <span>CAN DO</span>
        </div>
        {ROLES.map((r, i) => {
          const Icon = r.icon;
          return (
            <div
              key={r.name}
              className={cn(
                'flex flex-col gap-2 px-5 py-4 sm:flex-row sm:gap-6',
                r.you ? 'bg-gray-200' : 'border-t border-gray-200',
                i > 0 && !r.you && '',
              )}
            >
              <div className='flex w-[99px] shrink-0 items-center gap-2'>
                <Icon className='size-4 shrink-0 text-gray-700' />
                <span className='text-label-md font-medium text-gray-700'>
                  {r.name}
                </span>
              </div>
              <p className='text-label-md text-gray-600'>{r.can}</p>
            </div>
          );
        })}
      </div>

      <div className='h-px w-full bg-gray-200' />

      {/* Members */}
      <p className='text-body-md font-medium text-carbon-black'>
        Members ({MEMBERS.length})
      </p>
      <div className='overflow-hidden rounded-lg border border-gray-200 bg-white'>
        {MEMBERS.map((m, i) => (
          <div
            key={m.email}
            className={cn(
              'flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between',
              i > 0 && 'border-t border-gray-200',
            )}
          >
            <div className='flex items-center gap-3'>
              <span className='flex size-10 shrink-0 items-center justify-center rounded-full bg-[#8fa6a0] text-sm font-medium text-mineral-white'>
                {m.initials}
              </span>
              <div className='flex flex-col gap-0.5'>
                <p className='text-body-sm font-semibold text-carbon-black'>
                  {m.name}
                </p>
                <p className='text-body-sm text-gray-500'>{m.email}</p>
              </div>
            </div>
            {m.owner ? (
              <span className='inline-flex h-7 w-fit items-center gap-1 rounded-full bg-gray-200 px-3 text-label-md font-medium text-gray-600'>
                <Gem className='size-4' />
                Owner
              </span>
            ) : (
              <div className='flex items-center gap-4'>
                <RoleSelect value={m.role} />
                <button type='button' aria-label={`Remove ${m.name}`}>
                  <Trash2 className='size-5 text-gray-500 hover:text-carbon-black' />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Invite */}
      <div className='rounded-lg border border-dashed border-gray-300 bg-white p-5'>
        <div className='flex flex-col gap-2'>
          <p className='text-body-md font-medium text-carbon-black'>
            Invite a team member
          </p>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
            <input
              type='email'
              placeholder='colleague@yourcompany.co.uk'
              className='h-12 flex-1 rounded-lg border border-gray-300 px-4 text-sm text-carbon-black placeholder:text-gray-400 focus-visible:border-primary focus-visible:outline-none'
            />
            <RoleSelect value='Viewer' />
            <button type='button' className={cn(PRIMARY_BTN, 'h-10 px-4 text-sm')}>
              <UserPlus className='size-5' />
              Invite
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Notifications ---------------- */

const NOTIFS = [
  {
    title: 'Assessment progress',
    desc: 'When you finish a section or the whole profile is ready to submit.',
  },
  {
    title: 'Submissions that need your attention',
    desc: 'Missing evidence, fields to confirm, or documents you started but did not finish.',
  },
  {
    title: 'Sustainability Expert review updates',
    desc: 'When our reviewer approves, flags, or requests more information on your evidence.',
  },
  {
    title: 'Integration sync events',
    desc: 'Bank and accounting sync successes, errors and revoked-token alerts.',
  },
  {
    title: 'Sustainability Finance Score updates',
    desc: 'When your Sustainability Finance Score changes or a new benchmark lands.',
  },
  {
    title: 'New funding matches',
    desc: 'New grants, loans or green finance products that fit your profile.',
  },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type='button'
      role='switch'
      aria-checked={on}
      onClick={onToggle}
      className={cn(
        'inline-flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors',
        on ? 'justify-end bg-primary' : 'justify-start bg-gray-300',
      )}
    >
      <span className='size-4 rounded-full bg-white shadow-sm' />
    </button>
  );
}

function NotificationsPanel() {
  const [on, setOn] = useState(() => NOTIFS.map(() => true));
  return (
    <section className='flex flex-col gap-5'>
      <div className='flex flex-col'>
        <p className={HEADING}>Notifications</p>
        <p className={SUB}>
          Control what we get to email you about and how often you receive
          emails from us.
        </p>
      </div>
      <div className='rounded-lg border border-gray-200 bg-white px-5'>
        {NOTIFS.map((n, i) => (
          <div
            key={n.title}
            className={cn(
              'flex items-center justify-between gap-6 py-4',
              i > 0 && 'border-t border-gray-200',
            )}
          >
            <div className='flex flex-col gap-1'>
              <p className='text-body-sm font-semibold text-carbon-black'>
                {n.title}
              </p>
              <p className='text-body-sm text-gray-500'>{n.desc}</p>
            </div>
            <Toggle
              on={on[i]}
              onToggle={() =>
                setOn((prev) => prev.map((v, j) => (j === i ? !v : v)))
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Security ---------------- */

const SESSIONS = [
  { device: 'This browser — Chrome on macOS', meta: 'Bristol · Now' },
  { device: 'iPhone 12 Pro Max — Safari', meta: 'London · 2 days ago' },
];

function SecurityPanel() {
  return (
    <section className='flex flex-col gap-5'>
      <div className='flex flex-col'>
        <p className={HEADING}>Security</p>
        <p className={SUB}>
          Keep your account secure by managing your password and sign-in
          settings.
        </p>
      </div>

      <div className={cn(CARD, 'flex flex-col gap-4')}>
        <div className='flex flex-col'>
          <p className='text-body-md font-medium text-carbon-black'>
            Change your password
          </p>
          <p className='text-body-sm text-gray-600'>
            Request a secure password reset code to update your password.
          </p>
        </div>
        <button type='button' className={cn(PRIMARY_BTN, 'h-10 w-fit px-[18px] text-base')}>
          Send password reset code
        </button>
      </div>

      <div className={cn(CARD, 'flex flex-col gap-4')}>
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
          {SESSIONS.map((s) => (
            <div
              key={s.device}
              className='flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-4'
            >
              <div className='flex flex-col gap-0.5'>
                <p className='text-body-sm font-medium text-carbon-black'>
                  {s.device}
                </p>
                <p className='text-label-md text-gray-600'>{s.meta}</p>
              </div>
              <button
                type='button'
                className='flex shrink-0 items-center gap-2 text-body-sm text-gray-700 hover:text-carbon-black'
              >
                <LogOut className='size-5' />
                Sign out
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Privacy ---------------- */

function PrivacyPanel() {
  const [requested, setRequested] = useState(false);

  if (requested) {
    return (
      <div className='flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-6'>
        <div className='flex w-full max-w-[550px] flex-col items-center gap-5 text-center'>
          <CircleCheck className='size-16 shrink-0 text-success-600' />
          <div className='flex flex-col gap-2'>
            <p className='text-h3 font-semibold text-carbon-black'>
              Account closure requested
            </p>
            <p className='text-body-lg text-gray-500'>
              Your request to close your JusKel account has been submitted
              successfully. You&apos;ll no longer be able to access your account
              once the closure is processed.
            </p>
          </div>
          <Link
            href={ROUTES.sme.dashboard}
            className={cn(PRIMARY_BTN, 'h-14 px-5 text-base')}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className='flex flex-col gap-5'>
      <div className='flex flex-col'>
        <p className={HEADING}>Privacy</p>
        <p className={SUB}>
          Manage your privacy and account closure preferences.
        </p>
      </div>
      <div className={cn(CARD, 'flex flex-col gap-4')}>
        <div className='flex flex-col'>
          <p className='text-body-md font-medium text-carbon-black'>
            Request account closure
          </p>
          <p className='text-body-sm text-gray-600'>
            You can request to close your JusKel account at any time. Once
            processed, your account will no longer be active. We&apos;ll retain
            or delete data as required by applicable privacy, legal and
            record-retention requirements.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <button type='button' className={cn(PRIMARY_BTN, 'h-10 w-fit px-4 text-sm')}>
              Request account closure
            </button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-100'>
            <DialogHeader>
              <DialogTitle className='text-h6 font-semibold text-carbon-black'>
                Request account closure?
              </DialogTitle>
              <DialogDescription className='text-body-sm text-gray-600'>
                You&apos;re about to submit a request to close your company
                account. You and your team will lose access to the JusKel
                platform once the closure is processed. This action cannot be
                easily reversed once processing begins.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className='gap-3 sm:justify-start'>
              <DialogClose asChild>
                <button
                  type='button'
                  className='inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-gray-300 px-[18px] text-sm font-semibold text-gray-700 shadow-xs'
                >
                  Cancel
                </button>
              </DialogClose>
              <DialogClose asChild>
                <button
                  type='button'
                  onClick={() => setRequested(true)}
                  className='inline-flex h-10 items-center justify-center rounded-lg bg-destructive px-[18px] text-sm font-semibold text-mineral-white shadow-xs transition-opacity hover:opacity-90'
                >
                  Request account closure
                </button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
