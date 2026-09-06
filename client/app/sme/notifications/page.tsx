'use client';

import { Bell, CheckCheck } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import {
  useNotificationStore,
  type AppNotification,
} from '@/lib/dashboard/notifications';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardEmptyState } from '@/components/dashboard/empty-state';

export default function NotificationsPage() {
  const items = useNotificationStore((s) => s.items);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const unread = items.reduce((n, i) => n + (i.read ? 0 : 1), 0);

  if (items.length === 0) {
    return (
      <DashboardShell
        title='Notifications'
        subtitle="You're all caught up — updates about your business will appear here."
      >
        <DashboardEmptyState
          icon={Bell}
          title='No notifications yet'
          body='Updates about your assessment, integrations, funding matches and score will show up here.'
          action={{ label: 'Back to Dashboard', href: ROUTES.sme.dashboard }}
        />
      </DashboardShell>
    );
  }

  const subtitle =
    unread > 0
      ? `${unread} unread notification${unread === 1 ? '' : 's'}, see all the updates about your business.`
      : "You're all caught up — see all the updates about your business.";

  const markAllButton = (
    <MarkAllRead onClick={markAllRead} disabled={unread === 0} />
  );

  return (
    <DashboardShell
      title='Notifications'
      subtitle={subtitle}
      action={markAllButton}
    >
      {/* Mobile: the action sits above the list (desktop shows it in the header) */}
      <div className='lg:hidden'>{markAllButton}</div>

      <div className='flex flex-col gap-3'>
        {items.map((n) => (
          <NotificationCard key={n.id} notification={n} />
        ))}
      </div>
    </DashboardShell>
  );
}

function MarkAllRead({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className='inline-flex h-12 w-fit items-center justify-center gap-2 rounded-lg bg-primary px-5 text-base font-semibold text-mineral-white shadow-xs transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
    >
      <CheckCheck className='size-5' />
      Mark all as read
    </button>
  );
}

function NotificationCard({ notification }: { notification: AppNotification }) {
  const { icon: Icon, title, category, body, time, read } = notification;
  return (
    <div
      className={cn(
        'flex gap-4 rounded-2xl border border-gray-200 bg-white p-7',
        !read && 'border-gray-300',
      )}
    >
      <span className='flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-200'>
        <Icon className='size-4 text-gray-700' />
      </span>
      <div className='flex flex-col gap-0.5'>
        <div className='flex items-center gap-3'>
          <p className='text-gray-700'>
            <span className='text-body-lg font-semibold'>{title} · </span>
            <span className='text-body-md'>{category}</span>
          </p>
          {!read && (
            <span
              aria-label='Unread'
              className='size-2 shrink-0 rounded-full bg-destructive'
            />
          )}
        </div>
        <p className='text-body-lg text-gray-700'>{body}</p>
        <p className='text-body-md text-gray-700'>{time}</p>
      </div>
    </div>
  );
}
