/**
 * Central route registry. Import these instead of hardcoding path strings so
 * a URL change is a one-file edit and `proxy.ts` role-gating can key off the
 * `/sme` and `/lender` prefixes.
 */
export const ROUTES = {
  home: '/',
  onboarding: '/onboarding',
  auth: {
    login: '/login',
    signup: '/signup',
    verifyEmail: '/verify-email',
    forgotPassword: '/forgot-password',
    verifyResetCode: '/forgot-password/verify',
    resetPassword: '/reset-password',
  },
  sme: {
    root: '/sme',
    dashboard: '/sme/dashboard',
    assessment: '/sme/assessment',
    scorecard: '/sme/scorecard',
    evidence: '/sme/evidence',
    fundingMatches: '/sme/funding-matches',
    recommendations: '/sme/recommendations',
    integrations: '/sme/integrations',
    reports: '/sme/reports',
    settings: '/sme/settings',
  },
  lender: {
    root: '/lender',
    dashboard: '/lender/dashboard',
  },
} as const;

export type Role = 'sme' | 'lender';

/**
 * Validate a post-login `next` redirect target. Only same-origin, root-relative
 * paths are allowed (blocks open redirects via `//host` or absolute URLs), and
 * auth pages are excluded so a `next` can't cause a redirect loop. Anything
 * else falls back to the app entry.
 */
export function safeInternalPath(
  path: string | null | undefined,
  fallback: string = ROUTES.onboarding,
): string {
  if (!path) return fallback;
  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.startsWith('/\\')
  ) {
    return fallback;
  }
  const pathname = path.split('?')[0].split('#')[0];
  const authPaths = Object.values(ROUTES.auth);
  if (authPaths.some((a) => pathname === a || pathname.startsWith(`${a}/`))) {
    return fallback;
  }
  return path;
}
