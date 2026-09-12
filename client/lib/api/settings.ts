/**
 * Settings-page API surface (Identity module) — Profile lives in `./auth`
 * (getMe / updateMe); this covers Notifications, Security (password reset +
 * sessions) and Privacy (organisation closure).
 *
 * Contracts: api/SETTINGS_FRONTEND_API.md + api/ORGANISATIONS_FRONTEND_API.md.
 */

import { request } from './client';

/* ---- Notifications (email preferences) ---- */

/**
 * Six category booleans + two delivery-channel booleans; a missing row defaults
 * every flag to true.
 */
export type NotificationPreferences = {
  assessmentProgress: boolean;
  submissionsNeedAttention: boolean;
  expertReviewUpdates: boolean;
  integrationSyncEvents: boolean;
  scoreUpdates: boolean;
  newFundingMatches: boolean;
  inAppEnabled: boolean;
  emailEnabled: boolean;
};

export function getNotificationPreferences() {
  return request<NotificationPreferences>('/notifications/me/preferences', {
    method: 'GET',
    auth: true,
  });
}

/** No Save button — PUT the full object on each toggle. */
export function updateNotificationPreferences(body: NotificationPreferences) {
  return request<NotificationPreferences>('/notifications/me/preferences', {
    method: 'PUT',
    body,
    auth: true,
  });
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

/** Switch the signed-in user's active organisation (multi-org). */
export function setCurrentOrganisation(organisationId: string) {
  return request<void>('/identity/me/organisations/current', {
    method: 'PUT',
    body: { organisationId },
    auth: true,
  });
}

/* ---- Team (members / invites) ---- */

export type OrganisationMember = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: OrganisationRole;
  joinedAt: string;
};

export function getMembers(organisationId: string) {
  return request<OrganisationMember[]>(
    `/identity/organisations/${organisationId}/members`,
    { method: 'GET', auth: true },
  );
}

export type CreateInviteRequest = {
  email: string;
  /** Not Owner (0). */
  role: OrganisationRole;
};

export type CreateInviteResponse = {
  inviteId: string;
  email: string;
  role: OrganisationRole;
  expiresAt: string;
  /** Present in the API response for E2E; production relies on the email link. */
  acceptToken: string;
};

/** Owner / Admin only. Invitee must be a business email on the org's domain. */
export function inviteMember(
  organisationId: string,
  body: CreateInviteRequest,
) {
  return request<CreateInviteResponse>(
    `/identity/organisations/${organisationId}/invites`,
    { method: 'POST', body, auth: true },
  );
}

export type AcceptInviteResponse = {
  organisationId: string;
  organisationName: string;
  role: OrganisationRole;
};

/** Authenticated; the signed-in user's email must match the invite. */
export function acceptInvite(token: string) {
  return request<AcceptInviteResponse>(
    `/identity/invites/${token}/accept`,
    { method: 'POST', auth: true },
  );
}

/** Owner / Admin only. Cannot demote the last Owner (409). */
export function updateMemberRole(
  organisationId: string,
  memberUserId: string,
  role: OrganisationRole,
) {
  return request<void>(
    `/identity/organisations/${organisationId}/members/${memberUserId}`,
    { method: 'PATCH', body: { role }, auth: true },
  );
}

/** Owner / Admin only. Cannot remove the last Owner (409). */
export function removeMember(organisationId: string, memberUserId: string) {
  return request<void>(
    `/identity/organisations/${organisationId}/members/${memberUserId}`,
    { method: 'DELETE', auth: true },
  );
}
