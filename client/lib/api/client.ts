/**
 * Shared client-side API layer — calls the hosted JusKel API DIRECTLY from the
 * browser. Every feature module (auth, onboarding, …) builds on this so the
 * request/error/token conventions stay identical across the app.
 *
 * NOTE: this requires CORS to be enabled on the API for our origin. Until the
 * backend ships that, browser calls fail at the network layer (visible in the
 * console as a CORS error) — surfaced here as an ApiError with status 0.
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

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

const TOKEN_KEY = 'juskel_access_token';
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function getToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + TOKEN_KEY + '=([^;]*)'),
  );
  return match ? decodeURIComponent(match[1]) : null;
}
export function setToken(token: string): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=${TOKEN_MAX_AGE}; SameSite=Lax${secure}`;
}
export function clearToken(): void {
  document.cookie = `${TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}

/* ---- Core request ---- */

type ProblemDetails = {
  title?: string | null;
  detail?: string | null;
  errorCode?: string;
  email?: string;
};

export type RequestOptions = {
  method?: string;
  /** JSON-serialised, unless it's already FormData (multipart upload). */
  body?: unknown;
  /** Attach the Bearer token. Required by every onboarding/funding/scoring route. */
  auth?: boolean;
};

export async function request<T>(
  path: string,
  { method = 'POST', body, auth = false }: RequestOptions = {},
): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers: Record<string, string> = {};
  // Let the browser set multipart boundaries; only set JSON content-type here.
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : isForm
            ? (body as FormData)
            : JSON.stringify(body),
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
