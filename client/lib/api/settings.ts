/**
 * Settings-page API surface (Identity module) — Profile lives in `./auth`
 * (getMe / updateMe); this covers Notifications, Security (password reset +
 * sessions) and Privacy (organisation closure).
 *
 * Contracts: api/SETTINGS_FRONTEND_API.md + api/ORGANISATIONS_FRONTEND_API.md.
 */

import { request } from './client';

/* ---- Notifications (email preferences) ---- */

/** Six booleans; a missing row defaults every flag to true. */
export type NotificationPreferences = {
  assessmentProgress: boolean;
  submissionsNeedAttention: boolean;
  expertReviewUpdates: boolean;
  integrationSyncEvents: boolean;
  scoreUpdates: boolean;
  newFundingMatches: boolean;
};

export function getNotificationPreferences() {
  return request<NotificationPreferences>(
    '/identity/me/notification-preferences',
    { method: 'GET', auth: true },
  );
}

/** No Save button — PUT the full object on each toggle. */
export function updateNotificationPreferences(body: NotificationPreferences) {
  return request<NotificationPreferences>(
    '/identity/me/notification-preferences',
    { method: 'PUT', body, auth: true },
  );
}

/* ---- Security — password reset (logged in) ---- */

/** Emails a secure reset code to the signed-in user (empty body). */
export function requestPasswordResetCode() {
  return request<void>('/identity/me/password-reset', {
    method: 'POST',
    auth: true,
  });
}

/* ---- Security — active sessions ---- */

export type Session = {
  id: string;
  deviceLabel: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

export function getSessions() {
  return request<{ sessions: Session[] }>('/identity/me/sessions', {
    method: 'GET',
    auth: true,
  });
}

/** Sign out another device (404 if the session isn't the user's). */
export function signOutSession(sessionId: string) {
  return request<void>(`/identity/me/sessions/${sessionId}`, {
    method: 'DELETE',
    auth: true,
  });
}

/* ---- Privacy — organisations + closure ---- */

export enum OrganisationRole {
  Owner = 0,
  Admin = 1,
  Contributor = 2,
  Viewer = 3,
}

export type OrganisationSummary = {
  id: string;
  name: string;
  role: OrganisationRole;
  isClosed: boolean;
  isCurrent: boolean;
};

export function getOrganisations() {
  return request<OrganisationSummary[]>('/identity/me/organisations', {
    method: 'GET',
    auth: true,
  });
}

export type OrganisationClosureResponse = {
  status: string;
  requestedAt: string;
};

/** Owner only, idempotent. The user stays signed in. */
export function requestOrganisationClosure(organisationId: string) {
  return request<OrganisationClosureResponse>(
    `/identity/organisations/${organisationId}/closure`,
    { method: 'POST', auth: true },
  );
}
