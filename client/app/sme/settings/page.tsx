'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { LucideIcon } from 'lucide-react';
import {
  ChevronDown,
  CircleCheck,
  Eye,
  Gem,
  Loader2,
  LogOut,
  Pencil,
  Shield,
  Trash2,
  UserPlus,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { ApiError } from '@/lib/api/client';
import { getMe, updateMe, logout } from '@/lib/api/auth';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  requestPasswordResetCode,
  getSessions,
  signOutSession,
  getOrganisations,
  requestOrganisationClosure,
  OrganisationRole,
  type NotificationPreferences,
  type Session,
} from '@/lib/api/settings';
import { useAuthStore } from '@/stores/authStore';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Skeleton } from '@/components/ui/skeleton';
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

const TABS = [
  'Profile',
  'Team',
  'Notifications',
  'Security',
  'Privacy',
] as const;
type Tab = (typeof TABS)[number];

const HEADING = 'text-h5 font-semibold text-carbon-black';
const SUB = 'text-body-md text-gray-500';
const CARD = 'rounded-2xl border border-gray-200 bg-white p-7';
const PRIMARY_BTN =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-white shadow-xs transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60';

/** React Query keys for the settings surfaces. */
const SK = {
  me: ['settings', 'me'] as const,
  notifications: ['settings', 'notification-preferences'] as const,
  sessions: ['settings', 'sessions'] as const,
  organisations: ['settings', 'organisations'] as const,
};

const errMsg = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : fallback;

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

const joinName = (first?: string | null, last?: string | null) =>
  [first, last].filter(Boolean).join(' ');

/** Split a single "Full name" field into first + rest for the PATCH body. */
function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
}

function ProfilePanel() {
  const qc = useQueryClient();
  const { data: me, isLoading } = useQuery({ queryKey: SK.me, queryFn: getMe });

  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');

  // Seed the editable fields once the profile loads (and again if it changes).
  // Set-during-render (guarded) instead of an effect — avoids cascading renders.
  const [seededId, setSeededId] = useState<string | null>(null);
  if (me && seededId !== me.id) {
    setSeededId(me.id);
    setFullName(joinName(me.firstName, me.lastName));
    setJobTitle(me.jobTitle ?? '');
    setPhone(me.phone ?? '');
  }

  const save = useMutation({
    mutationFn: () => {
      const { firstName, lastName } = splitName(fullName);
      return updateMe({ firstName, lastName, jobTitle, phone });
    },
    onSuccess: (updated) => {
      qc.setQueryData(SK.me, updated);
      useAuthStore.getState().setUser({
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
      });
      toast.success('Profile updated.');
    },
    onError: (e) => toast.error(errMsg(e, 'Could not save your profile.')),
  });

  return (
    <section className={cn(CARD, 'flex flex-col gap-10')}>
      <div className='flex flex-col gap-5'>
        <div className='flex flex-col'>
          <p className={HEADING}>Your profile</p>
          <p className={SUB}>This is how your profile appears inside JusKel.</p>
        </div>
        <div className='grid gap-5 sm:grid-cols-2'>
          <ProfileField
            label='Full name'
            value={fullName}
            onChange={setFullName}
            disabled={isLoading}
          />
          <ProfileField
            label='Role'
            value={jobTitle}
            onChange={setJobTitle}
            disabled={isLoading}
          />
          <div className='flex flex-col gap-4'>
            <p className='text-body-md font-medium text-carbon-black'>Email</p>
            <div className='flex h-14 items-center rounded-xl border border-gray-300 bg-muted/40 px-4 text-base text-gray-500'>
              {me?.email ?? '—'}
            </div>
          </div>
          <ProfileField
            label='Phone (Optional)'
            value={phone}
            onChange={setPhone}
            disabled={isLoading}
          />
        </div>
      </div>
      <button
        type='button'
        onClick={() => save.mutate()}
        disabled={save.isPending || isLoading}
        className={cn(PRIMARY_BTN, 'h-14 self-end px-5 text-base')}
      >
        {save.isPending && <Loader2 className='size-4 animate-spin' />}
        Save changes
      </button>
    </section>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className='flex flex-col gap-4'>
      <p className='text-body-md font-medium text-carbon-black'>{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className='h-14 rounded-xl border border-gray-300 px-4 text-base text-carbon-black focus-visible:border-primary focus-visible:outline-none disabled:opacity-60'
      />
    </div>
  );
}

/* ---------------- Team (mock — endpoints deferred; discuss w/ backend) ---------------- */

const ROLES: { icon: LucideIcon; name: string; can: string; you?: boolean }[] =
  [
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
  {
    initials: 'FR',
    name: 'Flourish Ralph · You',
    email: 'Flo@juskel.co.uk',
    role: 'Owner',
    owner: true,
  },
  {
    initials: 'AT',
    name: 'Austin Tonayam',
    email: 'Aus@juskel.co.uk',
    role: 'Admin',
  },
  {
    initials: 'AO',
    name: 'Alo Odunayo',
    email: 'Alo@juskel.co.uk',
    role: 'Contributor',
  },
  {
    initials: 'PS',
    name: 'Priya Shah',
    email: 'Priya@juskel.co.uk',
    role: 'Viewer',
  },
];

function RoleSelect({ value }: { value: string }) {
  return (
    <div className='flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 px-4 text-sm text-carbon-black sm:w-50'>
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
          <span className='w-24.75'>ROLE</span>
          <span>CAN DO</span>
        </div>
        {ROLES.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.name}
              className={cn(
                'flex flex-col gap-2 px-5 py-4 sm:flex-row sm:gap-6',
                r.you ? 'bg-gray-200' : 'border-t border-gray-200',
              )}
            >
              <div className='flex w-24.75 shrink-0 items-center gap-2'>
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
              <span className='flex size-10 shrink-0 items-center justify-center rounded-full bg-sage-grey text-sm font-medium text-mineral-white'>
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
            <button
              type='button'
              className={cn(PRIMARY_BTN, 'h-10 px-4 text-sm')}
            >
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

const NOTIF_ROWS: {
  key: keyof NotificationPreferences;
  title: string;
  desc: string;
}[] = [
  {
    key: 'assessmentProgress',
    title: 'Assessment progress',
    desc: 'When you finish a section or the whole profile is ready to submit.',
  },
  {
    key: 'submissionsNeedAttention',
    title: 'Submissions that need your attention',
    desc: 'Missing evidence, fields to confirm, or documents you started but did not finish.',
  },
  {
    key: 'expertReviewUpdates',
    title: 'Sustainability Expert review updates',
    desc: 'When our reviewer approves, flags, or requests more information on your evidence.',
  },
  {
    key: 'integrationSyncEvents',
    title: 'Integration sync events',
    desc: 'Bank and accounting sync successes, errors and revoked-token alerts.',
  },
  {
    key: 'scoreUpdates',
    title: 'Sustainability Finance Score updates',
    desc: 'When your Sustainability Finance Score changes or a new benchmark lands.',
  },
  {
    key: 'newFundingMatches',
    title: 'New funding matches',
    desc: 'New grants, loans or green finance products that fit your profile.',
  },
];

const ALL_ON: NotificationPreferences = {
  assessmentProgress: true,
  submissionsNeedAttention: true,
  expertReviewUpdates: true,
  integrationSyncEvents: true,
  scoreUpdates: true,
  newFundingMatches: true,
};

function Toggle({
  on,
  onToggle,
  disabled,
}: {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type='button'
      role='switch'
      aria-checked={on}
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'inline-flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors disabled:opacity-60',
        on ? 'justify-end bg-primary' : 'justify-start bg-gray-300',
      )}
    >
      <span className='size-4 rounded-full bg-white shadow-sm' />
    </button>
  );
}

function NotificationsPanel() {
  const qc = useQueryClient();
  const { data: prefs, isLoading } = useQuery({
    queryKey: SK.notifications,
    queryFn: getNotificationPreferences,
  });

  // No Save button — each toggle PUTs the full object, optimistically.
  const mutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: SK.notifications });
      const prev = qc.getQueryData<NotificationPreferences>(SK.notifications);
      qc.setQueryData(SK.notifications, next);
      return { prev };
    },
    onError: (_e, _next, ctx) => {
      if (ctx?.prev) qc.setQueryData(SK.notifications, ctx.prev);
      toast.error('Could not update your preference. Please try again.');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: SK.notifications }),
  });

  const view = prefs ?? ALL_ON;

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
        {NOTIF_ROWS.map((n, i) => (
          <div
            key={n.key}
            className={cn(
              'flex items-center justify-between gap-6 py-4',
              i > 0 && 'border-t border-gray-200',
            )}
          >
            {/* Labels are static — only the toggle waits on the API. */}
            <div className='flex flex-col gap-1'>
              <p className='text-body-sm font-semibold text-carbon-black'>
                {n.title}
              </p>
              <p className='text-body-sm text-gray-500'>{n.desc}</p>
            </div>
            {isLoading ? (
              <Skeleton className='h-5 w-9 shrink-0 rounded-full' />
            ) : (
              <Toggle
                on={view[n.key]}
                disabled={!prefs || mutation.isPending}
                onToggle={() =>
                  mutation.mutate({ ...view, [n.key]: !view[n.key] })
                }
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Security ---------------- */

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function SecurityPanel() {
  const qc = useQueryClient();
  const router = useRouter();

  const resetCode = useMutation({
    mutationFn: requestPasswordResetCode,
    onSuccess: () =>
      toast.success(`We've emailed you a secure password reset code.`),
    onError: (e) =>
      toast.error(errMsg(e, 'Could not send a reset code. Please try again.')),
  });

  const { data: sessionsData } = useQuery({
    queryKey: SK.sessions,
    queryFn: getSessions,
  });
  const sessions = sessionsData?.sessions ?? [];

  const signOut = useMutation({
    mutationFn: signOutSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: SK.sessions }),
    onError: (e) =>
      toast.error(
        errMsg(e, 'Could not sign out that device. Please try again.'),
      ),
  });

  const handleSignOut = (s: Session) => {
    if (s.isCurrent) {
      // Signing out this browser is a full logout.
      logout();
      useAuthStore.getState().clearUser();
      router.push(ROUTES.auth.login);
      return;
    }
    signOut.mutate(s.id);
  };

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
        <button
          type='button'
          onClick={() => resetCode.mutate()}
          disabled={resetCode.isPending}
          className={cn(PRIMARY_BTN, 'h-10 w-fit px-4.5 text-base')}
        >
          {resetCode.isPending && <Loader2 className='size-4 animate-spin' />}
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
          {sessions.length === 0 ? (
            <p className='text-body-sm text-gray-500'>No active sessions.</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className='flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-4'
              >
                <div className='flex flex-col gap-0.5'>
                  <p className='text-body-sm font-medium text-carbon-black'>
                    {s.isCurrent
                      ? `This browser — ${s.deviceLabel}`
                      : s.deviceLabel}
                  </p>
                  <p className='text-label-md text-gray-600'>
                    {s.isCurrent ? 'Now' : timeAgo(s.createdAt)}
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => handleSignOut(s)}
                  disabled={signOut.isPending}
                  className='flex shrink-0 items-center gap-2 text-body-sm text-gray-700 hover:text-carbon-black disabled:opacity-60'
                >
                  <LogOut className='size-5' />
                  Sign out
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Privacy (organisation closure) ---------------- */

function PrivacyPanel() {
  const qc = useQueryClient();
  const { data: orgs, isLoading } = useQuery({
    queryKey: SK.organisations,
    queryFn: getOrganisations,
  });

  const org = orgs?.find((o) => o.isCurrent) ?? orgs?.[0];
  const isOwner = org?.role === OrganisationRole.Owner;

  const close = useMutation({
    mutationFn: () => requestOrganisationClosure(org!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SK.organisations });
      toast.success('Organisation closure requested.');
    },
    onError: (e) =>
      toast.error(errMsg(e, 'Could not request closure. Please try again.')),
  });

  if (org?.isClosed) {
    return (
      <div className='flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-6'>
        <div className='flex w-full max-w-137.5 flex-col items-center gap-5 text-center'>
          <CircleCheck className='size-16 shrink-0 text-success-600' />
          <div className='flex flex-col gap-2'>
            <p className='text-h3 font-semibold text-carbon-black'>
              Organisation closure requested
            </p>
            <p className='text-body-lg text-gray-500'>
              Your request to close {org.name} has been submitted successfully.
              Access will be removed once the closure is processed.
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
          Manage your privacy and organisation closure preferences.
        </p>
      </div>
      <div className={cn(CARD, 'flex flex-col gap-4')}>
        <div className='flex flex-col'>
          <p className='text-body-md font-medium text-carbon-black'>
            Request organisation closure
          </p>
          <p className='text-body-sm text-gray-600'>
            You can request to close your organisation at any time. Once
            processed, it will no longer be active. We&apos;ll retain or delete
            data as required by applicable privacy, legal and record-retention
            requirements.
          </p>
        </div>

        {isLoading ? (
          <button
            type='button'
            disabled
            className={cn(PRIMARY_BTN, 'h-10 w-fit px-4 text-sm')}
          >
            <Loader2 className='size-4 animate-spin' />
            Request organisation closure
          </button>
        ) : isOwner ? (
          <Dialog>
            <DialogTrigger asChild>
              <button
                type='button'
                disabled={!org || close.isPending}
                className={cn(PRIMARY_BTN, 'h-10 w-fit px-4 text-sm')}
              >
                {close.isPending && <Loader2 className='size-4 animate-spin' />}
                Request organisation closure
              </button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-100'>
              <DialogHeader>
                <DialogTitle className='text-h6 font-semibold text-carbon-black'>
                  Request organisation closure?
                </DialogTitle>
                <DialogDescription className='text-body-sm text-gray-600'>
                  You&apos;re about to submit a request to close{' '}
                  {org?.name ?? 'your organisation'}. You and your team will
                  lose access to the JusKel platform once the closure is
                  processed. This action cannot be easily reversed once
                  processing begins.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className='gap-3 sm:justify-start'>
                <DialogClose asChild>
                  <button
                    type='button'
                    className='inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-gray-300 px-4.5 text-sm font-semibold text-gray-700 shadow-xs'
                  >
                    Cancel
                  </button>
                </DialogClose>
                <DialogClose asChild>
                  <button
                    type='button'
                    onClick={() => close.mutate()}
                    className='inline-flex h-10 items-center justify-center rounded-lg bg-destructive px-4.5 text-sm font-semibold text-mineral-white shadow-xs transition-opacity hover:opacity-90'
                  >
                    Request organisation closure
                  </button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <p className='text-body-sm text-gray-500'>
            Only the organisation owner can request closure.
          </p>
        )}
      </div>
    </section>
  );
}
