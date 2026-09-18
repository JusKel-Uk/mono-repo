/**
 * Client-side lender-auth API — calls the hosted JusKel API DIRECTLY from the
 * browser on top of the shared request/token layer in `./client`, mirroring
 * `./auth` (SME identity).
 *
 * Wired endpoints (lender module):
 *   POST /lender/access-requests   → request access (anonymous)
 *   GET  /lender/invites/preview   → prefill the create-account form (anonymous)
 *   POST /lender/accounts          → register from an approved invite (anonymous)
 *   POST /lender/sessions          → sign in (anonymous)
 *   GET  /lender/me                → current lender + organisation (authed)
 *
 * The JWT lives in the same `juskel_access_token` cookie as SME auth — the
 * lender portal is just a different set of routes behind the same token.
 */

import { toast } from 'sonner';

import { request, setToken, clearToken } from './client';

// Re-exported so callers can `instanceof`-check errors without a second import.
export { ApiError, getToken } from './client';

/* ---- Request access — POST /lender/access-requests (202 Accepted) ---- */

export type LenderRequestAccessInput = {
  firstName: string;
  lastName: string;
  workEmail: string;
  organisation: string;
  website?: string;
  role?: string;
  message?: string;
};
export type LenderRequestAccessResponse = { requestId: string };

/** Submit a lender access request. Backend emails the team; nothing is issued yet. */
export function lenderRequestAccess(input: LenderRequestAccessInput) {
  return request<LenderRequestAccessResponse>('/lender/access-requests', {
    body: {
      firstName: input.firstName,
      lastName: input.lastName,
      workEmail: input.workEmail,
      organisation: input.organisation,
      // Omit blank optionals so they serialise as absent, not empty strings.
      website: input.website || undefined,
      role: input.role || undefined,
      message: input.message || undefined,
    },
  });
}

/* ---- Invite preview — GET /lender/invites/preview?token= (200 | 404) ---- */

export type LenderInvitePreview = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  organisationName: string;
};

/** Look up an approved invite so the create-account form can prefill itself. */
export function lenderInvitePreview(token: string) {
  return request<LenderInvitePreview>(
    `/lender/invites/preview?token=${encodeURIComponent(token)}`,
    { method: 'GET' },
  );
}

/* ---- Create account — POST /lender/accounts (201) → stores the JWT ---- */

export type LenderCreateAccountInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  inviteToken: string;
};

/** Register from an approved invite. Stores the returned JWT and signs the user in. */
export async function lenderCreateAccount(
  input: LenderCreateAccountInput,
): Promise<{ userId: string }> {
  const data = await request<{ userId: string; accessToken: string }>(
    '/lender/accounts',
    { body: input },
  );
  setToken(data.accessToken);
  return { userId: data.userId };
}

/* ---- Sign in — POST /lender/sessions (201) → stores the JWT ---- */

export type LenderSignInInput = { email: string; password: string };

/**
 * Sign a lender in. Stores the returned JWT for subsequent authed requests.
 * A 403 with code NOT_LENDER_ACCOUNT means the credentials are valid but the
 * account has no lender portal access.
 */
export async function lenderSignIn(
  input: LenderSignInInput,
): Promise<{ userId: string; firstName: string; lastName: string }> {
  const data = await request<{
    userId: string;
    accessToken: string;
    firstName: string;
    lastName: string;
  }>('/lender/sessions', { body: input });
  setToken(data.accessToken);
  return {
    userId: data.userId,
    firstName: data.firstName,
    lastName: data.lastName,
  };
}

/* ---- Current lender — GET /lender/me (authed) ---- */

export type LenderMe = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  organisation: { id: string; name: string };
};

/** The signed-in lender and their organisation (via the stored Bearer token). */
export function lenderGetMe() {
  return request<LenderMe>('/lender/me', { method: 'GET', auth: true });
}

/** Sign out. No lender session-delete endpoint yet, so just drop the token. */
export function lenderSignOut(): void {
  clearToken();
}

/* ------------------------------------------------------------------ *
 * Password reset flow — UI-only. The lender module has no forgot/reset
 * endpoints (same parity as SME identity), so these stay dummies: they
 * log their payload and fire a clearly-labelled toast so the reset
 * screens stay demoable until the backend adds support.
 *
 * TODO(backend): replace with real request(...) calls once lender
 * password-reset endpoints exist.
 * ------------------------------------------------------------------ */

function dummy<T = void>(action: string, payload?: unknown, result?: T): Promise<T> {
  console.log(`[lender-auth · DUMMY] ${action}`, payload ?? '');
  toast.message('🧪 Dummy action — no backend', {
    description: `"${action}" was logged to the console. Lender password reset isn't wired to a backend yet.`,
  });
  return new Promise((resolve) => {
    setTimeout(() => resolve(result as T), 500);
  });
}

export function lenderForgotPassword(input: { email: string }) {
  return dummy('Forgot password — send reset code', input);
}

export function lenderVerifyResetCode(input: { email: string; code: string }) {
  return dummy('Verify reset code', input);
}

export function lenderResetPassword(input: { password: string }) {
  return dummy('Set a new password', input);
}
