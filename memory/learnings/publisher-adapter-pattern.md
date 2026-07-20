---
id: publisher-adapter-pattern
title: One adapter per platform, one shared shape (publish pipelines)
project: Protos-Web
extracted_from: 2026-07-20-07
tags:
  - architecture
  - publishing
  - api-integration
  - fetch
---

# Publisher adapter pattern

## Problem

Cross-post to N platforms (Bluesky, Mastodon, Threads, Facebook, Instagram,
Ghost, Hashnode, Dev.to) from one admin form. Each platform:

- Different auth (Bearer JWT, HMAC signed JWT, app password, session
  cookie, GraphQL PAT, `api-key` header, ...)
- Different endpoint style (JSON REST, form-encoded, GraphQL,
  multi-step container → publish)
- Different limits (300 chars, 500 chars, unlimited)
- Different metadata (tags array vs `{name, slug}` array, canonical URL
  field name, cover image location)

## Pattern

One adapter file per platform, all exporting the exact same signature:

```ts
type Adapter = (
  input: ShortPostInput | ArticleInput,
  ctx: PublisherContext,
) => Promise<PublishResult>
```

`PublisherContext` carries the resolved secrets (as a keyed record) and a
free-form options record for per-request knobs (`identifier`, `pageId`,
`adminUrl`, ...).

A small router in `lib/publishers/index.ts` picks the right adapter:

```ts
async function runShortPublisher(platform, input, ctx) {
  switch (platform) {
    case 'bluesky':  return publishToBluesky(input, ctx)
    case 'mastodon': return publishToMastodon(input, ctx)
    ...
  }
}
```

## Benefits

- **No SDKs.** Every adapter is `fetch()` + `URLSearchParams` / JSON.
  When Meta bumps `v20.0` → `v21.0`, one string moves.
- **Adding a platform = one new file** + one entry in `meta-catalog.ts`.
- **Testable in isolation** — pass a fake `ctx.secrets`, assert the
  request payload.
- **Client UI and server action share `PUBLISHERS` metadata** through
  `meta-catalog.ts` (client-safe), while the actual adapters stay
  `server-only` (they touch tokens).

## Common gotchas

1. **IG / Threads / FB Graph** = **two-step**: `POST /media` returns a
   container ID, then `POST /media_publish` promotes it. If you skip
   step 2, nothing appears.
2. **Ghost Admin API** wants an HS256 JWT with the *hex-decoded* secret
   as the key, `aud: '/admin/'`, 5-min TTL. `kid` header = the id half.
3. **Bluesky** app URL uses the *handle*, not the DID:
   `https://bsky.app/profile/{handle}/post/{rkey}`. `rkey` = last
   segment of the `at://` URI.
4. **Hashnode** GraphQL mutation `publishPost` needs `publicationId`, and
   tag slugs must be lowercase, unicode-stripped. Use the same slugify
   you use elsewhere or Hashnode silently drops them.
5. **Dev.to** tags must be `[a-z0-9]` only and max 4 items — no dashes,
   no spaces. Sanitise or the whole request 422s.
