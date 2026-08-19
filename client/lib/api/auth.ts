/**
 * Client-side auth API — calls the hosted JusKel API DIRECTLY from the browser.
 * The JWT access token is kept in localStorage and attached as a Bearer header.
 *
 * NOTE: this requires CORS to be enabled on the API for our origin. Until the
 * backend ships that, browser calls fail at the network layer (visible in the
 * console as a CORS error) — surfaced here as an ApiError with status 0.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const TOKEN_KEY = 'juskel_access_token';

// Azure Container App scales to zero — first call after idle cold-starts (~30-60s).
const REQUEST_TIMEOUT_MS = 65_000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** Identity error code, e.g. "EMAIL_NOT_VERIFIED" (from a 403 sign-in). */
    readonly code?: string,
    /** Email echoed back on EMAIL_NOT_VERIFIED, for the verify redirect. */
    readonly email?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/* ---- Token store ----
 * The JWT lives in a cookie (not localStorage) so the server-side route guard
 * in `proxy.ts` can read it. It is NOT httpOnly — the api client below reads it
 * to set the Bearer header — so it stays XSS-readable; the CSP is what limits
 * exfiltration. The cookie is scoped to our origin only (never sent to the
 * external API). Keep the cookie name in sync with `proxy.ts`.
 */

const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function getToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + TOKEN_KEY + '=([^;]*)'),
  );
  return match ? decodeURIComponent(match[1]) : null;
}
function setToken(token: string): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=${TOKEN_MAX_AGE}; SameSite=Lax${secure}`;
}
function clearToken(): void {
  document.cookie = `${TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}

/* ---- Core request ---- */

type ProblemDetails = {
  title?: string | null;
  detail?: string | null;
  errorCode?: string;
  email?: string;
};

async function request<T>(
  path: string,
  { method = 'POST', body, auth = false }: {
    method?: string;
    body?: unknown;
    auth?: boolean;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    // Network error, CORS block, or timeout — no HTTP response reached us.
    const timedOut = err instanceof DOMException && err.name === 'TimeoutError';
    throw new ApiError(
      timedOut
        ? 'The service is taking longer than usual. Please try again.'
        : 'Unable to reach the server. Please try again.',
      0,
    );
  }

  const text = await res.text();
  const data = text ? safeJsonParse(text) : null;

  if (!res.ok) {
    const problem = (data ?? {}) as ProblemDetails;
    throw new ApiError(
      problem.detail || problem.title || 'Something went wrong. Please try again.',
      res.status,
      problem.errorCode,
      problem.email,
    );
  }

  return data as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

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
type SignInResponse = { userId: string; accessToken: string };

export type VerifyEmailInput = { email: string; otpCode: string };
export type VerifyEmailResponse = {
  userId: string;
  email: string;
  emailVerified: boolean;
};

export type MeResponse = { id: string; email: string };

/* ---- Calls ---- */

/** Create an account. Backend issues an OTP and emails it; user is unverified. */
export function register(input: RegisterInput) {
  return request<RegisterResponse>('/identity/users', { body: input });
}

/** Sign in. Stores the returned JWT for subsequent authenticated requests. */
export async function login(
  input: LoginCredentials,
): Promise<{ userId: string }> {
  const data = await request<SignInResponse>('/identity/sessions', {
    body: input,
  });
  setToken(data.accessToken);
  return { userId: data.userId };
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
