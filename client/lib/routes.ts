/**
 * Central route registry. Import these instead of hardcoding path strings so
 * a URL change is a one-file edit and `proxy.ts` role-gating can key off the
 * `/sme` and `/lender` prefixes.
 */
export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  sme: {
    root: "/sme",
    dashboard: "/sme/dashboard",
  },
  lender: {
    root: "/lender",
    dashboard: "/lender/dashboard",
  },
} as const;

export type Role = "sme" | "lender";
