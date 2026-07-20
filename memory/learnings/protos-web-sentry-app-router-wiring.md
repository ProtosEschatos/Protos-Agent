---
id: protos-web-sentry-app-router-wiring
project: Protos-Web
extracted_from: 2026-07-20-11
topics:
  - sentry
  - app-router
  - nextjs
  - turbopack
  - source-maps
  - tunnel-route
  - session-replay
---

# Wiring @sentry/nextjs v10 into Next.js 16 App Router + Turbopack

## TL;DR

Za novi Next.js 16 (App Router + Turbopack) projekt s
`@sentry/nextjs@^10`, ovih 5 fileova na repo root-u je minimum: 3
`Sentry.init` config-a (server / edge / client), `src/instrumentation.ts`
kao dispatch + `onRequestError`, i `withSentryConfig` wrap oko
`next.config.js`. Bez svih 5 ne hvataš sve što možeš.

## Kontekst

Kad primijeniti:
- Bilo koji Next.js 15+ projekt koji hosta bilo što production (Vercel,
  self-hosted, itd.).
- Prije nego se pojavi prvi neshvatljivi user report — Sentry retroaktivno
  nema koristi.
- Kad već postoji `ClientErrorBoundary` ili slična error-catching UI —
  wire direktno.

Kad NE:
- Prototip koji nikad ne ide u produkciju.
- Ne umjesto structured audit log-a za domain evente (publish, payment,
  itd.) — to je `audit_events` tablica.

## Snippet — minimalni set

**`sentry.server.config.ts` (i .edge.config.ts, skoro identičan)**
```ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: 0.1,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  debug: false,
})
```

**`instrumentation-client.ts` (repo root; on-error replay)**
```ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: 0.1,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
  ],
  replaysSessionSampleRate: 0,      // no idle recording
  replaysOnErrorSampleRate: 1,      // every crash gets a replay
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
```

**`src/instrumentation.ts` (Next 15+ convention)**
```ts
import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') await import('../sentry.server.config')
  if (process.env.NEXT_RUNTIME === 'edge')   await import('../sentry.edge.config')
}

export const onRequestError = Sentry.captureRequestError
```

**`next.config.js` — wrap the exported config**
```js
const { withSentryConfig } = require('@sentry/nextjs')

module.exports = withSentryConfig(myNextConfig, {
  org: 'my-org',
  project: 'my-project',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  tunnelRoute: '/monitoring',
  // DO NOT set disableLogger under Turbopack — deprecated v10 no-op.
})
```

**Existing client error boundary — capture with context**
```ts
componentDidCatch(error: Error, info: ErrorInfo) {
  console.error('[Boundary]', this.props.label, error, info)
  Sentry.captureException(error, {
    tags: { boundary: 'ClientErrorBoundary', label: this.props.label ?? 'unknown' },
    contexts: { react: { componentStack: info.componentStack ?? null } },
  })
}
```

**App Router `error.tsx` files**
```tsx
'use client'
import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function Error({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { boundary: 'admin/error' },
      extra: error.digest ? { digest: error.digest } : undefined,
    })
  }, [error])
  // ... fallback UI ...
}
```

**Smoke test route (admin-gated, dva moda)**
```ts
export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const mode = new URL(request.url).searchParams.get('mode') ?? 'capture'
  if (mode === 'throw') throw new Error('[sentry-test] throw')
  const eventId = Sentry.captureException(new Error('[sentry-test] capture'), { level: 'warning' })
  await Sentry.flush(2000) // otherwise serverless closes before send
  return NextResponse.json({ ok: true, eventId })
}
```

## Gotchas

- **`Sentry.flush()` je obavezan** u serverless (Vercel Functions, Netlify
  Functions) prije response-a — bez flush-a proces može biti freezan
  prije nego SDK pošalje event. Timeout 2s je dobar default.
- **`onRequestError`** iz `src/instrumentation.ts` je JEDINI način da
  Server Component render errori i middleware errori stvarno stignu u
  Sentry. Bez njega vidiš samo ono što ide kroz error boundary.
- **`disableLogger`** je deprecated u v10 i **no-op pod Turbopack-om**
  (Next 16 default). Ostavljanje ga aktivnim → build warning svakim
  buildom. Namjerno ga NE stavljaj.
- **`tunnelRoute`** rješava DVA problema odjednom: (1) ad-blocker drop-ovi
  (`ingest.sentry.io` je u većini blok listi), (2) CSP `connect-src` ne
  mora sadržavati vanjski Sentry endpoint.
- **DSN je javan** (`NEXT_PUBLIC_...`). To je Sentry default i sigurno —
  DSN nije auth token, samo tag za project. **Auth token je tajna** i
  koristi se samo u build-time za source-map upload.
- **Turbopack NFT warning** ("Encountered unexpected file in NFT list")
  je poznati cosmetic quirk s Sentry SDK-om — dynamic require-ovi u
  Sentry internalsima confuse-aju node-file-trace. Ne utječe na output,
  ignoriraj.
- **`replaysSessionSampleRate: 0`** je bitan za projekte s bilo kakvim
  traffic-om — replay storage nije jeftin. `replaysOnErrorSampleRate: 1`
  daje 100% replay coverage za crashove (jedina replay vrsta koja je
  stvarno korisna za debugging).
- **Source maps ON**: `widenClientFileUpload: true` + `hideSourceMaps:
  true`. Prvi upload-a sve chunkove, drugi ne šalje `.map` fajl uz JS
  → korisnici ne vide source, Sentry ipak resolve-a symbols.
- **`instrumentation-client.ts` na repo ROOT**, ne u `src/` — to je
  Next.js 15+ konvencija (matches `instrumentation.ts` location convention).

## Vidi također

- `memory/sessions/2026-07-20-11-sentry-adoption.md` — implementacija
- `memory/sessions/2026-07-20-10-configurator-assets-crash-fix.md` — error boundaries koje ovo dopunjuje
- PR: <https://github.com/ProtosEschatos/Protos-Web/pull/42>
- Sentry Next.js docs: <https://docs.sentry.io/platforms/javascript/guides/nextjs/>
- Sentry MCP (Cursor): once configured, `search_issues`, `analyze_issue_with_seer`, `execute_sentry_tool` become useful in agent sessions
