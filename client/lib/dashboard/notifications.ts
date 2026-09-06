import type { LucideIcon } from 'lucide-react';
import { Clipboard, HandCoins, Link2, TrendingUp } from 'lucide-react';
import { create } from 'zustand';

/**
 * SME notifications. Backend-less for now — a seeded client store so the bell
 * badge (in DashboardShell) and the Notifications page stay in sync, and
 * "Mark all as read" updates everywhere. Swap the seed for a query when the
 * backend ships.
 */
export type AppNotification = {
  id: string;
  icon: LucideIcon;
  title: string;
  /** Uppercase channel label shown after the title, e.g. INTEGRATION. */
  category: string;
  body: string;
  /** Relative or absolute time label, e.g. "1d ago" / "July 24, 2026". */
  time: string;
  read: boolean;
};

const SEED: AppNotification[] = [
  {
    id: 'n1',
    icon: Link2,
    title: 'Xero access was revoked',
    category: 'INTEGRATION',
    body: 'Reconnect to keep your accounting data, documents, and reports updated. Your existing evidence stays safe.',
    time: '1d ago',
    read: false,
  },
  {
    id: 'n2',
    icon: HandCoins,
    title: '2 new funding matches',
    category: 'FUNDING MATCH',
    body: 'Lloyds Clean Growth and Innovate UK Smart Grants added to your list.',
    time: '2d ago',
    read: false,
  },
  {
    id: 'n3',
    icon: Link2,
    title: 'Xero access was revoked',
    category: 'INTEGRATION',
    body: 'Reconnect to keep your accounting data, documents, and reports updated. Your existing evidence stays safe.',
    time: '3d ago',
    read: true,
  },
  {
    id: 'n4',
    icon: TrendingUp,
    title: 'Environmental Intelligence Score recalculated to 80',
    category: 'SCORE',
    body: 'Your Environmental Intelligence Score was updated after reviewing your latest evidence upload.',
    time: '4d ago',
    read: true,
  },
  {
    id: 'n5',
    icon: Link2,
    title: 'Xero sync completed',
    category: 'INTEGRATION',
    body: '12 months of financial data imported successfully.',
    time: '5d ago',
    read: true,
  },
  {
    id: 'n6',
    icon: Clipboard,
    title: 'Sustainability profile complete',
    category: 'ONBOARDING',
    body: "You've finished filling the sustainability questionnaire. Great work.",
    time: 'July 24, 2026',
    read: true,
  },
];

type NotificationState = {
  items: AppNotification[];
  markAllRead: () => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  items: SEED,
  markAllRead: () =>
    set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) })),
}));

/** Count of unread notifications (drives the bell badge). */
export const useUnreadCount = () =>
  useNotificationStore((s) => s.items.reduce((n, i) => n + (i.read ? 0 : 1), 0));
