---
id: 2026-07-20-07
date: 2026-07-20
project: Protos-Web
title: 1-click publisher (8 platformi) + audit log UI
commits:
  - 39bc37a
learnings:
  - publisher-adapter-pattern
  - client-server-only-split
topics:
  - admin-panel
  - publisher
  - social-publishing
  - bluesky
  - mastodon
  - threads
  - facebook
  - instagram
  - ghost
  - hashnode
  - devto
  - audit-log
  - supabase-migration
---

# Session — 2026-07-20 · Admin publisher + audit log

User request:
> "moze slobodno stari moj samo ne kuzim sta su ghost/hashnode/dev.to?
>  nema refunda bogamu za donacije sigurno. donacija je donacija"

Zeleno svjetlo za sve što sam ranije predložio (audit log UI, 1-click social
publish, blog cross-post), OSIM Stripe refund flow.

## Isporuka

### `/admin/publish`
2 taba (short / article) + log tab za zadnjih 50 objava.
- **Short**: Bluesky, Mastodon, Threads, Facebook Page, Instagram
- **Article**: Ghost, Hashnode, Dev.to
- Svaki platform ima svoje option fieldove (handle, instance URL, publication
  ID itd.) koji se rendaju iz `meta-catalog.ts` registra.
- Ključevi se resolvaju iz enkriptiranog `admin_api_keys` vault-a
  (`getActiveApiKey(provider)`).
- Svaka objava → row u `published_posts` (`platform, kind, remote_id,
  remote_url, status, request_payload, response_payload`) + audit event.

### `/admin/audit`
- Čita `audit_events` s `contains` filterima po event / source.
- Boja pill-a: `.ok` = emerald, `.error` = red, ostalo = indigo.
- Payload je JSON pretty-print.
- Retrofit-ani audit hookovi u:
  - `POST /api/admin/login` → `admin.login.ok / failed`
  - `admin-api-keys` server actions → `api-key.create / update / delete`
  - `admin-publish` actions → `publish.<platform>.ok / error`

## Arhitektonske odluke

### Client / server split u `lib/publishers`
`PublishManager.tsx` (client) treba `PUBLISHERS` metadata registar
(labeli, option fields). `runShortPublisher` / `runArticlePublisher` moraju
biti server-only (fetch s tokenima). Rješenje:

- `lib/publishers/meta-catalog.ts` → client-safe, samo statički objekt
- `lib/publishers/index.ts` → `import 'server-only'`, re-exportira registar
- Client komp direktno importa `meta-catalog` da ne povuče crypto u browser

Bez tog razdvajanja: **build hard-fail** `'server-only' cannot be imported
from a Client Component`.

### Adapter pattern
Svaki `lib/publishers/<platform>.ts` izvozi jednu funkciju s istim potpisom:

```
publishToX(input: ShortPostInput | ArticleInput, ctx: PublisherContext): Promise<PublishResult>
```

Bez SDK-ova. Sirov `fetch` + native tokeni. Prednost: kad Meta/Threads
promijeni Graph verziju, mijenja se jedan string, ne cijeli SDK.

### `published_posts` schema
```sql
platform text check in (bluesky, mastodon, threads, facebook, instagram,
                       ghost, hashnode, devto, medium, substack),
kind     text check in (short, article),
unique (platform, remote_id)
```

`unique` sprema dedup pri retryjima, ali dozvoljava više `NULL`
remote_id-eva (za error rowove).

### Audit `recordAudit()` je fire-and-forget
Nikad ne throw-a. Ako Supabase padne, imamo `console.warn` ali request
path nastavlja. Cijena: propustimo audit red kad DB pukne. Trade-off je
prihvatljiv jer request-path availability > audit completeness.

## Sljedeći koraci (opcionalno)

- Media upload za IG (iz `admin_assets` galerije direktno u `imageUrl`)
- Bluesky link-card unfurl (fetch OG tags s canonical URL-a)
- LinkedIn adapter (LinkedIn Marketing API, treba OAuth handshake)
- Mastodon multi-image upload
- Publish scheduling (dodaj `scheduled_for` kolonu + cron)
