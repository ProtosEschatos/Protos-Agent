---
id: client-server-only-split
title: Sharing metadata between client UI and server actions when server code uses `server-only`
project: Protos-Web
extracted_from: 2026-07-20-07
tags:
  - nextjs
  - client-components
  - server-only
  - architecture
---

# Client / server-only split for shared metadata

## Problem

You have a folder like `lib/publishers/`:

- `bluesky.ts`, `mastodon.ts`, ... — call the platform APIs.
  All start with `import 'server-only'` (they touch tokens).
- `index.ts` re-exports the adapters and also a `PUBLISHERS` metadata
  object (labels, option fields) used by the admin UI to render forms.

A client component (`'use client'`) imports the registry:

```ts
import { PUBLISHERS } from '@/lib/publishers'
```

Next.js build:

```
'server-only' cannot be imported from a Client Component
```

## Wrong fix

Removing `import 'server-only'` from the adapters "works" but silently
allows the crypto / token code to bundle into the browser — an actual
security regression.

## Correct fix

Split the module in two:

- `lib/publishers/meta-catalog.ts` — **no** `'server-only'`. Just types +
  the static registry.
- `lib/publishers/index.ts` — keeps `import 'server-only'`, re-exports
  from meta-catalog *and* exports the server-only adapters.

Then:

- Client UI: `import { PUBLISHERS } from '@/lib/publishers/meta-catalog'`
- Server action: `import { runShortPublisher } from '@/lib/publishers'`

## Rule of thumb

Any file that could conceivably be imported by a client component must
NOT `import 'server-only'`. If a barrel index needs to be shared, split
the pure-data parts out and keep the server-only stuff behind a separate
entry point.

Grep before shipping:

```
rg "import 'server-only'" src/lib | while read line; do ... ; done
```

Then check every `use client` component that transitively hits those
modules.
