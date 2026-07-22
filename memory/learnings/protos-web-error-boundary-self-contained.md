---
id: protos-web-error-boundary-self-contained
project: Protos-Web
extracted_from: 2026-07-22-06
topics:
  - error-boundary
  - nextjs
  - next-intl
  - sentry
  - blank-screen
  - admin
---

# Error boundaries must be fully self-contained

## TL;DR

`error.tsx`, `global-error.tsx`, and client error boundaries must NOT import:
- `@sentry/nextjs` / any SDK that can fail at init
- `useLocale` / `useTranslations` / `next-intl` hooks
- Custom `Link` / `AdminLink` that call those hooks

If the parent tree died (missing context), the boundary itself throws →
cascade → blank screen. Use plain `<a href>`, `console.error`, and
`data-testid` / `data-error-message` for diagnostics.

## Snippet

```tsx
// admin/error.tsx — OK
<a href="/admin">Admin početna</a>

// BAD
import AdminLink from '...'; // → useLocale() → throws if locale context dead
import * as Sentry from '@sentry/nextjs' // → init failure masks real error
```

## Vidi također
- memory/sessions/2026-07-22-06-sentry-rip-out-and-konfigurator-verify.md
- Protos-Web `src/app/[locale]/admin/error.tsx`
