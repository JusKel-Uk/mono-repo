import type {
  LoginInput,
  SignupInput,
  ForgotPasswordInput,
} from '@/lib/validations/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

/** Shape returned by the auth endpoints. Adjust to match the backend contract. */
export type AuthUser = {
  id: string;
  email: string;
  role: 'sme' | 'lender';
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * POST /auth/login — wired to the JusKel API (mono-repo/api).
 * The endpoint isn't live yet; the mutation's error state surfaces failures
 * until the backend contract lands.
 */
export async function login(input: LoginInput): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const message =
      res.status === 401
        ? 'Incorrect email or password'
        : 'Something went wrong. Please try again.';
    throw new ApiError(message, res.status);
  }

  return (await res.json()) as AuthUser;
}

/**
 * POST /auth/register — creates an SME account. Endpoint isn't live yet;
 * the mutation's error state surfaces failures until the contract lands.
 */
export async function register(input: SignupInput): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.businessEmail,
      password: input.password,
    }),
  });

  if (!res.ok) {
    const message =
      res.status === 409
        ? 'An account with this email already exists'
        : 'Something went wrong. Please try again.';
    throw new ApiError(message, res.status);
  }

  return (await res.json()) as AuthUser;
}

/* ------------------------------------------------------------------ *
 * Password reset flow (endpoints not live yet — mutation error states
 * surface failures until the backend contract lands).
 * ------------------------------------------------------------------ */

/** Step 1 — email the user a 6-digit reset code. */
export async function requestPasswordReset(
  input: ForgotPasswordInput,
): Promise<void> {
  return;

  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new ApiError('Something went wrong. Please try again.', res.status);
  }
}

/** Step 2 — verify the code, returning a short-lived reset token. */
export async function verifyResetCode(input: {
  email: string;
  code: string;
}): Promise<{ token: string }> {
  return { token: '' };

  const res = await fetch(`${API_URL}/auth/verify-reset-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const message =
      res.status === 400
        ? 'The code you entered is incorrect. Please check and try again.'
        : 'Something went wrong. Please try again.';
    throw new ApiError(message, res.status);
  }
  return (await res.json()) as { token: string };
}

/** Step 3 — set a new password using the reset token. */
export async function resetPassword(input: {
  token: string;
  password: string;
}): Promise<void> {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const message =
      res.status === 400
        ? 'This reset link is invalid or has expired.'
        : 'Something went wrong. Please try again.';
    throw new ApiError(message, res.status);
  }
}
