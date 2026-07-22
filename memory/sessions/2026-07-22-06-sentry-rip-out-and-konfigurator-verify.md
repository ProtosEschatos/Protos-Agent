---
id: 2026-07-22-06
date: 2026-07-22
project: Protos-Web
title: Sentry rip-out, admin session RPC, konfigurator white-screen fixed (PR #47–#50)
run_id: cursor-2026-07-22-agent-session
commits:
  - 5d046b6
  - 3983704
  - 5edee4f
  - 3294d54
learnings:
  - protos-web-error-boundary-self-contained
  - protos-web-admin-session-edge-anon-rpc
  - protos-web-use-server-no-client-constants
  - github-remote-main-source-of-truth
topics:
  - sentry
  - sentry-removed
  - konfigurator
  - 3d
  - admin-sessions
  - security-definer
  - use-server
  - nextjs
  - vercel
  - white-screen
tags: []
---

# Session 2026-07-22 (06) — Sentry rip-out + konfigurator fixed

## Kontekst

User zatražio potpuno uklanjanje Sentry-ja i popravak bijelog ekrana na
`/admin/konfigurator`. Faza 0 (Mark23 CAP portfolio) već završena u
sesiji `2026-07-22-05` (PR #46).

## Što je shippano

### PR #47 — Sentry rip-out + error boundary instrumentation (`5d046b6`)
- `npm uninstall @sentry/nextjs`; obrisani sentry configs, instrumentation,
  admin sentry-test, integrations/sentry
- Error boundaries: bez Sentry; `data-testid` + `data-error-message`
- Fix A: `admin/error.tsx` plain `<a>` umjesto `AdminLink`/`useLocale`
- CSP `connect-src`: `raw.githack.com`, `www.gstatic.com` (drei HDRI/Draco)
- Edge verify: 2s AbortController

### PR #48 — Edge session verify via anon RPC (`3983704`)
Faza 2: session cookie + curl → redirect na login. Supabase logs:
`GET | 401 | .../admin_sessions` — `SUPABASE_SERVICE_ROLE_KEY` na Vercel
Edge odbijen. Fix: `verify_admin_session_by_hash` SECURITY DEFINER +
anon key u middleware.

### PR #49 — Node verify + ActivityBadge (`5edee4f`)
Nakon #48 middleware prođe, ali admin pages 500:
- `Unauthorized` — Node `verifySessionToken` još na service_role
- `Server Functions cannot be called during initial render` —
  async Server Component `AdminActivityBadge` unutar client `AdminHeader`
Fix: Node verify via isti RPC; badge → client fetch `/api/admin/notifications/badge`.
`/en/admin` i `/en/admin/sesije` → 200.

### PR #50 — konfigurator `p.map` (`3294d54`)
Još 500: `TypeError: p.map is not a function` u AssetLibrary chunk.
`ADMIN_ASSET_CATEGORIES` importan iz `'use server'` fajla — na klijentu
nije array. Premješteno u `src/lib/admin-assets-types.ts`.
`/en/admin/konfigurator` → **200**, SSR pokazuje "Učitavanje 3D scene…",
"Moji assets", bez `__next_error__`.

## Otvoreno

- [x] Supabase Preview stamp drift (`42048` vs `42111`) — fixed PR #51 (`0b296b7`)
- [ ] **Rotirati / osvježiti `SUPABASE_SERVICE_ROLE_KEY` na Vercelu** —
  PostgREST i dalje vraća 401 na taj key. Verify/login-gate više ne ovise
  o njemu, ali `createSession`, revoke, inbox counts, asset writes JOŠ
  trebaju validan service_role. Dok se ne osvježi, novi login koji kreira
  DB session može pasti.
- [ ] Obriši dead `SENTRY_*` / `NEXT_PUBLIC_SENTRY_DSN` iz Vercel dashboarda
  (harmless dead entries).

## Nauk (force)

**GitHub remote = source of truth.** MCP apply bez usklađivanja lokalnog
stamp-a sa `list_migrations` = Preview crven. Learning:
[`github-remote-main-source-of-truth`](../learnings/github-remote-main-source-of-truth.md).

## Reference

- PRs: #47, #48, #49, #50
- Prethodno: [`2026-07-22-04`](2026-07-22-04-cf-proxy-retract-and-konfigurator-open.md) (konfigurator open)
- Learnings ispod
