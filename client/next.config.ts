import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

/** Origin of the backend API (for connect-src), derived from the public env. */
function apiOrigin(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) return '';
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}

// XHR/fetch targets: our own origin + the backend API. In dev we also allow
// websockets (HMR) over any scheme/host — the page's own LAN origin is already
// covered by 'self', so this keeps hot-reload working from a phone too.
const connectSrc = [
  "'self'",
  apiOrigin(),
  isDev ? 'ws: wss: http://localhost:*' : '',
]
  .filter(Boolean)
  .join(' ');

// Content Security Policy. 'unsafe-inline' is required for scripts/styles
// because Next injects inline bootstrap + hydration data without a nonce; the
// other directives still meaningfully constrain the page (notably connect-src,
// which blocks exfiltration to arbitrary hosts, and frame-ancestors, which
// blocks clickjacking). To drop 'unsafe-inline' from script-src, move to a
// nonce-based CSP via proxy.ts — note that forces all pages to render
// dynamically. 'unsafe-eval' is dev-only (React Refresh).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src ${connectSrc}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  // Keeps window.opener access for future OAuth popups (Open Banking / Xero)
  // while still isolating the browsing context.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  // Pin the workspace root — a stray lockfile in $HOME otherwise misleads
  // Turbopack's auto-detection (see build warning).
  turbopack: {
    root: __dirname,
  },
  // Let the dev server accept requests from devices on the LAN (e.g. testing
  // on a phone at http://192.168.1.x:3000). Without this, Next 16 blocks the
  // cross-origin dev runtime and the page never hydrates — interactive
  // controls (the mobile menu, password reveal, checkboxes) stop responding.
  // Wildcard covers the whole subnet so it survives DHCP IP changes. Dev-only.
  // If your phone is on a different subnet, add it here (e.g. '192.168.0.*').
  allowedDevOrigins: ['192.168.1.*'],
  // Security headers applied to every response.
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
