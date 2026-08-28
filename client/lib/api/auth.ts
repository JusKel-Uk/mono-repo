/**
 * Client-side auth API — calls the hosted JusKel API DIRECTLY from the browser
 * on top of the shared request/token layer in `./client`.
 *
 * NOTE: this requires CORS to be enabled on the API for our origin. Until the
 * backend ships that, browser calls fail at the network layer (visible in the
 * console as a CORS error) — surfaced as an ApiError with status 0.
 */

import { request, setToken, clearToken, ApiError } from './client';

// Re-exported so existing importers of `@/lib/api/auth` keep working.
export { ApiError, getToken } from './client';

/* ---- Contracts (mirror the identity module DTOs) ---- */

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};
export type RegisterResponse = {
  userId: string;
  email: string;
  emailVerified: boolean;
};

export type LoginCredentials = { email: string; password: string };
type SignInResponse = {
  userId: string;
  accessToken: string;
  firstName?: string;
  lastName?: string;
};

export type VerifyEmailInput = { email: string; otpCode: string };
export type VerifyEmailResponse = {
  userId: string;
  email: string;
  emailVerified: boolean;
};

export type MeResponse = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
};

/* ---- Calls ---- */

/** Create an account. Backend issues an OTP and emails it; user is unverified. */
export function register(input: RegisterInput) {
  return request<RegisterResponse>('/identity/users', { body: input });
}

/** Sign in. Stores the returned JWT for subsequent authenticated requests. */
export async function login(
  input: LoginCredentials,
): Promise<{ userId: string; firstName?: string; lastName?: string }> {
  const data = await request<SignInResponse>('/identity/sessions', {
    body: input,
  });
  setToken(data.accessToken);
  return {
    userId: data.userId,
    firstName: data.firstName,
    lastName: data.lastName,
  };
}

/** Confirm the email OTP so the account can sign in. */
export function verifyEmail(input: VerifyEmailInput) {
  return request<VerifyEmailResponse>('/identity/verification', { body: input });
}

/** Re-send the email verification OTP. */
export function resendOtp(email: string) {
  return request<{ message: string }>('/identity/verification/resend', {
    body: { email },
  });
}

/** Current authenticated user (via the stored Bearer token). */
export function getMe() {
  return request<MeResponse>('/identity/me', { method: 'GET', auth: true });
}

/** Clear the stored token (no server-side logout endpoint). */
export function logout(): void {
  clearToken();
}

/* ------------------------------------------------------------------ *
 * Password reset flow — PARKED. The hosted API has no forgot/reset
 * endpoints yet (the only OTP flow is signup email verification). These
 * stubs keep the reset screens compiling until the backend adds support.
 * ------------------------------------------------------------------ */

const RESET_UNAVAILABLE = 'Password reset is not available yet.';

export async function requestPasswordReset(_input: {
  email: string;
}): Promise<void> {
  throw new ApiError(RESET_UNAVAILABLE, 501);
}

export async function verifyResetCode(_input: {
  email: string;
  code: string;
}): Promise<{ token: string }> {
  throw new ApiError(RESET_UNAVAILABLE, 501);
}

export async function resetPassword(_input: {
  token: string;
  password: string;
}): Promise<void> {
  throw new ApiError(RESET_UNAVAILABLE, 501);
}
