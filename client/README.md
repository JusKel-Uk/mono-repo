# JusKel — Client (Frontend)

Next.js **16** (App Router, Turbopack) + React **19.2** + Tailwind **v4**. Frontend
for the JusKel Sustainability Finance Hub — SME portal and Lender portal.

> ⚠️ Read `AGENTS.md` before writing code: this Next.js version has breaking
> changes. The authoritative docs ship in `node_modules/next/dist/docs/`.

## Getting started

```bash
npm run dev     # http://localhost:3000 (Turbopack)
npm run build   # production build
npm run lint    # eslint (next lint is removed in v16)
```

Copy `.env.example` → `.env.local` and set `NEXT_PUBLIC_API_URL`.

## Structure

```
app/
  layout.tsx            Root layout — <html>/<body>, fonts, global tokens
  page.tsx              Landing (/)
  (auth)/               Shared auth shell → /login, /signup
  sme/                  SME portal shell → /sme/*
  lender/               Lender portal shell → /lender/*
components/ui/          Shared UI primitives
lib/
  routes.ts             Central route registry (source of truth for URLs)
  utils.ts              Helpers (cn)
```

Two portals use explicit `/sme` and `/lender` URL prefixes (not route groups),
so role-gating in `proxy.ts` can key off the path prefix once auth lands.

## Security audit

`npm audit` reports 9 high-severity advisories in the **ESLint** dependency
chain (`brace-expansion`/`minimatch`/`eslint-plugin-*`). These are **accepted**:

- Dev-only tooling — never shipped to the browser or server runtime.
- The installed `brace-expansion` versions (`1.1.16`, `5.0.8`) are already the
  **patched** releases; npm flags them via a collapsed advisory range.
- The only offered fix is `eslint@10` (major), which breaks
  `eslint-config-next@16` — resolve upstream when Next ships eslint 10 support.

The genuinely shippable advisories (`postcss`, `sharp`, via Next) are pinned to
patched versions in `package.json` `overrides`. **Do not run
`npm audit fix --force`** — it downgrades Next.js to v9.

## Conventions

- **Design tokens** live in `app/globals.css`. Brand palette is a placeholder
  (see comment there) — components reference tokens, never raw hex.
- **Routes**: import from `lib/routes.ts`; don't hardcode path strings.
- **Next 16 gotchas**: `params`/`searchParams`/`cookies()`/`headers()` are async;
  `middleware` → `proxy.ts`; `images.domains` → `remotePatterns`.
