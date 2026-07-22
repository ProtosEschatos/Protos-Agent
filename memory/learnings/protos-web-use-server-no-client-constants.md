---
id: protos-web-use-server-no-client-constants
project: Protos-Web
extracted_from: 2026-07-22-06
topics:
  - use-server
  - server-actions
  - nextjs
  - client-components
  - konfigurator
---

# Never import constants from `'use server'` modules into Client Components

## TL;DR

A file with `'use server'` only safely exports **async server actions** to
the client. Non-async exports (arrays, objects, enums) become opaque
proxies / undefined on the client. Calling `.map` on them →
`TypeError: p.map is not a function` during SSR.

Symptoms on Protos-Web: `/admin/konfigurator` 500, Vercel log pointing at
AssetLibrary chunk, `ADMIN_ASSET_CATEGORIES.map(...)`.

## Fix pattern

```
src/lib/foo-types.ts          ← constants + types (client-safe)
src/actions/foo.ts            ← 'use server'; import types from lib/
src/components/.../Bar.tsx    ← import constants from lib/, actions from actions/
```

## Vidi također
- memory/sessions/2026-07-22-06-sentry-rip-out-and-konfigurator-verify.md
- Protos-Web `src/lib/admin-assets-types.ts`
