import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  ClipboardCheck,
  FileWarning,
  HandCoins,
  Link2,
  ListChecks,
  TrendingUp,
} from 'lucide-react';

import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type InboxItem,
} from '@/lib/api/notifications';

export type AppNotification = InboxItem;

const KEYS = {
  list: ['notifications', 'list'] as const,
  unread: ['notifications', 'unread'] as const,
};

/** Inbox list (newest first). */
export function useNotifications() {
  return useQuery({ queryKey: KEYS.list, queryFn: getNotifications });
}

/** Unread count for the bell badge. */
export function useUnreadCount(): number {
  const { data } = useQuery({ queryKey: KEYS.unread, queryFn: getUnreadCount });
  return data ?? 0;
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: KEYS.list });
    qc.invalidateQueries({ queryKey: KEYS.unread });
  };
}

export function useMarkAllRead() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: invalidate,
  });
}

export function useMarkRead() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: invalidate,
  });
}

/* ---- display helpers ---- */

// category display label → icon (labels come from the backend inbox mapping).
const CATEGORY_ICON: Record<string, LucideIcon> = {
  INTEGRATION: Link2,
  'FUNDING MATCH': HandCoins,
  SCORE: TrendingUp,
  ONBOARDING: ListChecks,
  SUBMISSION: FileWarning,
  'EXPERT REVIEW': ClipboardCheck,
};

export const categoryIcon = (category: string): LucideIcon =>
  CATEGORY_ICON[category] ?? Bell;
