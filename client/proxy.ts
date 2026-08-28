import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { ROUTES, safeInternalPath } from '@/lib/routes';

// Must match TOKEN_KEY in lib/api/auth.ts (the JWT cookie).
const TOKEN_COOKIE = 'juskel_access_token';

const PROTECTED = ['/onboarding', '/sme', '/lender'];
const AUTH_PAGES = [ROUTES.auth.login, ROUTES.auth.signup];

function underAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Optimistic auth gate (Next 16 "Proxy", formerly Middleware).
 *
 * - Signed-out users on a protected route are sent to /login with a validated
 *   ?next so they return to their destination after signing in.
 * - Signed-in users on an auth page are bounced into the app.
 *
 * This is a UX gate, not the security boundary — real authorization still
 * happens at the API (Bearer token). Role gating (SME / lender / admin) will
 * layer on here later.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasToken = Boolean(request.cookies.get(TOKEN_COOKIE)?.value);

  // Signed-out → protected route: bounce to login, remembering the destination.
  if (!hasToken && underAny(pathname, PROTECTED)) {
    const loginUrl = new URL(ROUTES.auth.login, request.url);
    loginUrl.searchParams.set('next', pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  // Signed-in → auth page: bounce into the app (honouring a safe ?next).
  if (hasToken && underAny(pathname, AUTH_PAGES)) {
    const next = safeInternalPath(request.nextUrl.searchParams.get('next'));
    return NextResponse.redirect(new URL(next, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // :path* also matches the base path. Literal strings so the matcher stays
  // statically analyzable at build time.
  matcher: [
    '/onboarding/:path*',
    '/sme/:path*',
    '/lender/:path*',
    '/login',
    '/signup',
  ],
};
