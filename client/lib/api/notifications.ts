import { request } from './client';

/**
 * Notifications inbox (org-scoped). Mirrors the backend `notifications` module:
 *   GET  /notifications              → inbox list (newest first)
 *   GET  /notifications/unread-count → badge count
 *   POST /notifications/{id}/read    → mark one read (204)
 *   POST /notifications/read-all     → mark all read (204)
 * `category` arrives as a display label (e.g. "INTEGRATION", "FUNDING MATCH").
 */
export type InboxItem = {
  id: string;
  title: string;
  category: string;
  body: string;
  createdAt: string;
  read: boolean;
  actionUrl: string | null;
};

export function getNotifications() {
  return request<{ items: InboxItem[] }>('/notifications', {
    method: 'GET',
    auth: true,
  }).then((r) => r.items);
}

export function getUnreadCount() {
  return request<{ count: number }>('/notifications/unread-count', {
    method: 'GET',
    auth: true,
  }).then((r) => r.count);
}

export function markNotificationRead(id: string) {
  return request<void>(`/notifications/${id}/read`, {
    method: 'POST',
    auth: true,
  });
}

export function markAllNotificationsRead() {
  return request<void>('/notifications/read-all', {
    method: 'POST',
    auth: true,
  });
}
