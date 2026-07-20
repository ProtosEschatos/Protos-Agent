---
id: protos-web-app-router-error-boundaries
project: Protos-Web
extracted_from: 2026-07-20-10
topics:
  - app-router
  - error-boundary
  - nextjs
  - r3f
  - admin-panel
---

# Next.js App Router error boundaries su NEobavezni — dok nešto ne padne

## TL;DR

Za svaki App Router projekt: **`global-error.tsx` + jedan `error.tsx`
per top-level segment** (`[locale]`, `admin`) je minimum. Bez toga, svaki
client throw = bijeli ekran, jer Next.js-ov built-in fallback nije
korisno UI. Uz to, za paneli koji učitavaju vanjske resurse (R3F Canvas,
`useGLTF`, `Environment` HDRI, Supabase signed URL grid, itd.) treba
**dodatni client `ErrorBoundary` unutar komponente** — segment-level
`error.tsx` samo hvata što bubbleupa do same rute.

## Kontekst

Protos-Web `/admin/konfigurator` i `/admin/assets` bili su unmount-ani u
bijeli ekran svaki put kad je bilo koji client throw (R3F Canvas mount,
HDRI CDN failure, Sketchfab fetch reject) escapeao lokalne
`SceneErrorBoundary`-ove. Root cause: **App Router stablo nije imalo
nijedan `error.tsx` ni `global-error.tsx`**.

Primijeniti ovaj pattern **prije** shipanja bilo koje admin/dashboard
rute koja:
- mount-a `<Canvas>` iz `@react-three/fiber`,
- koristi `useGLTF` / `Environment` iz `drei`,
- vuče podatke iz Supabase signed URL grida,
- ili je "heavy client" panel s > 3 sub-komponente koje dijele isti
  zustand store.

## Snippet — minimum viable boundary set

```tsx
// src/app/global-error.tsx  — MUST include its own <html>/<body>
'use client'
export default function GlobalError({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="hr">
      <body>
        <h1>Aplikacija je pala s kritičnom greškom</h1>
        {error.digest ? <p>digest {error.digest}</p> : null}
        <button onClick={reset}>Pokušaj ponovo</button>
      </body>
    </html>
  )
}
```

```tsx
// src/app/[locale]/admin/error.tsx  — segment-level fallback
'use client'
export default function AdminError({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="admin-card p-4">
      <h1>Admin ruta je pala s greškom</h1>
      <p>{error.message}</p>
      <button onClick={reset}>Pokušaj ponovo</button>
    </div>
  )
}
```

```tsx
// src/components/ui/ClientErrorBoundary.tsx  — for heavy client sub-trees
'use client'
import { Component, type ErrorInfo, type ReactNode } from 'react'
export default class ClientErrorBoundary extends Component<
  { children: ReactNode; label?: string; fallback?: (a: { error: Error; reset: () => void }) => ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(e: Error, i: ErrorInfo) { console.error('[CEB]', e, i) }
  reset = () => this.setState({ error: null })
  render() {
    if (!this.state.error) return this.props.children
    if (this.props.fallback) return this.props.fallback({ error: this.state.error, reset: this.reset })
    return <div>{this.props.label ?? 'Panel'} je pao. <button onClick={this.reset}>Pokušaj ponovo</button></div>
  }
}
```

```tsx
// Usage — isolate every risky sub-panel individually so ONE bad tab
// doesn't yank neighbours
<ClientErrorBoundary label="3D scena" fallback={({ error, reset }) => <SceneFallback error={error} onReset={reset} />}>
  <ConfiguratorScene />
</ClientErrorBoundary>

<ClientErrorBoundary label="Sketchfab pretraga">
  <SketchfabBrowser />
</ClientErrorBoundary>
```

## Gotchas

- `global-error.tsx` **mora** renderati vlastite `<html>` i `<body>` — root
  layout ne teče kad se ono okine.
- Iz error boundary-ja koristi **plain `<a href="/">`** za nav, ne
  `next/link` — Link bi reusao broken client tree. `eslint-disable-next-line
  @next/next/no-html-link-for-pages` per linija.
- `error.tsx` mora biti `'use client'` — server errors su ok, ali sam
  boundary je klijentski.
- **Per-panel `ClientErrorBoundary`** > jedan outer: cilj je da chat crash
  ne ubije scenu, i obrnuto.
- `Suspense` ≠ error boundary. Ako `useGLTF` throwa (ne suspenda), samo
  `Suspense` nije dovoljan.
- R3F: `<Primitive />`, `<Environment>`, `<ContactShadows>`, `<OrbitControls>`
  — svaki wrap-uj u svoj `SceneErrorBoundary`; jedan bad prop može srušiti
  cijeli Canvas.

## Vidi također

- `memory/sessions/2026-07-20-09-configurator-assets-crash.md` — diagnoza
- `memory/sessions/2026-07-20-10-configurator-assets-crash-fix.md` — implementacija
- PR: <https://github.com/ProtosEschatos/Protos-Web/pull/41>
- Next.js docs: <https://nextjs.org/docs/app/api-reference/file-conventions/error>
- React error boundary contract: <https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary>
