---
id: 2026-07-20-11
date: 2026-07-20
project: Protos-Web
title: Adopt @sentry/nextjs — real error monitoring (PR #42)
run_id: cursor-2026-07-20-agent-session
commits:
  - a086f37
  - 690459a
learnings:
  - protos-web-sentry-app-router-wiring
topics:
  - sentry
  - error-monitoring
  - observability
  - app-router
  - source-maps
  - turbopack
  - client-boundary
  - session-replay
tags: []
---

## RETRACTED / SUPERSEDED 2026-07-22

**Sentry uklonjen u potpunosti** (PR #47). Vidi close-out
[`2026-07-22-06`](2026-07-22-06-sentry-rip-out-and-konfigurator-verify.md).
Ne koristi ove korake kao aktivan runbook.



# Session 2026-07-20 — Adopt Sentry properly (PR #42, merged)

## Kontekst

Nakon što je PR #41 stavio error-boundary-e na App Router, `console.error`
u `ClientErrorBoundary.componentDidCatch` je bio jedini trag production
crashova. `src/lib/integrations/sentry.ts` je već postojao kao status
poller, ali svi Sentry env vars (`NEXT_PUBLIC_SENTRY_DSN`,
`SENTRY_AUTH_TOKEN`, org/project slugs) bili su prazni — status card na
`/admin` je bio siv, ništa nije stvarno hvatalo greške.

User je zatražio potpunu adopciju Sentry-ja (opcija A iz plan mode
odluke). Sentry org već postoji: `protoseschatos` / project `protosweb`
(id `4511604980580432`).

## Što je napravljeno

1. **Instaliran `@sentry/nextjs@10.67.0`.**

2. **Tri Sentry.init file-a + instrumentation** — sve na repo root-u kako
   Next.js 15+ konvencija traži:
   - `sentry.server.config.ts` — Node runtime, DSN + tracesSampleRate 0.1
   - `sentry.edge.config.ts` — Edge runtime (middleware, edge handlers)
   - `instrumentation-client.ts` — browser + `browserTracingIntegration()`
     + `replayIntegration()` s **on-error only** replay (session=0,
     onError=1) da quota ostane sitna
   - `src/instrumentation.ts` — dispatch po `NEXT_RUNTIME`, exportira
     `onRequestError = Sentry.captureRequestError` za RSC/middleware
     greške

3. **`next.config.js` wrappan u `withSentryConfig`** s:
   - `org: 'protoseschatos'`, `project: 'protosweb'` (slugovi safe za
     commit, nisu tajne)
   - `authToken: process.env.SENTRY_AUTH_TOKEN` — build-time source-map
     upload
   - `widenClientFileUpload: true` + `hideSourceMaps: true` — čitke stack
     trace u Sentry, korisnicima se ne šalje source-map fajl
   - `tunnelRoute: '/monitoring'` — same-origin proxy, izbjegava ad-blocker
     drop-ove i **ne treba** proširivati CSP `connect-src` za
     `ingest.sentry.io`
   - `silent: !process.env.CI` — dev tišina lokalno, Vercel logovi
     zadržavaju bitne linije
   - `disableLogger` **namjerno izostavljen** — deprecated u Sentry v10 i
     no-op pod Turbopack-om (Next 16 default)

4. **`ClientErrorBoundary` (iz PR #41) proširen** — `componentDidCatch`
   sad zove `Sentry.captureException` s tagovima `{ boundary, label }` i
   React `componentStack` u context-u. `console.error` ostaje kao
   first-line lokalni debug.

5. **Tri App Router `error.tsx` boundary-a proširena** —
   `global-error.tsx`, `[locale]/error.tsx`, `[locale]/admin/error.tsx`
   svi imaju `Sentry.captureException(error)` unutar postojećeg
   `useEffect`-a, tagovi po segmentu, digest kao extra.

6. **`/api/admin/sentry-test` route** (admin-guarded) — dva moda:
   - `?mode=capture` (default) — `captureException` + `Sentry.flush(2000)`
     da event stigne prije nego serverless zatvori
   - `?mode=throw` — throwa, vježbanje `onRequestError` → Sentry pipeline

7. **`.env.example` + `docs/SECRETS-INVENTORY.md`** — org/project slugovi
   pre-set (`SENTRY_ORG_SLUG=protoseschatos`,
   `SENTRY_PROJECT_SLUG=protosweb`); DSN + auth token dokumentirani s
   linkovima na gdje se generiraju.

## Verifikacija

- `tsc --noEmit` clean
- ESLint na touched fajlovima clean
- `npm run build` passes (jedan cosmetic Turbopack NFT warning od
  Sentry SDK-ovih dynamic require-ova — ne utječe na output)
- `/api/admin/sentry-test` registrirana u route table
- CI zeleno (Build, Cloudflare DNS, Supabase, Vercel preview)

## Odluke i tradeoffi

- **Session Replay on-error only, ne idle**: video prije crasha je zlata
  vrijedan za React/R3F debugging, ali svaka sesija video = plaćeni
  storage. On-error zadržava zlatnu vrijednost bez računa.
- **`tunnelRoute` uključen**: jedan API endpoint više na Vercelu, ali
  eliminira ad-blocker drop-ove (koji odbacuju ~15-30% error događaja
  za tech-savvy audience) i drži CSP `connect-src` uskim (bez `sentry.io`).
- **Neće se dirati postojeći status widget** iz
  `src/lib/integrations/sentry.ts` — samo počne raditi čim env vars
  stignu u Vercel. Additive-only pravilo (user je izričito rekao: ne
  brisati postojeći kod samo zato što je "in the way").
- **`audit_events` vs Sentry**: audit ostaje source-of-truth za domain
  eventove (publish, upload, itd.); Sentry preuzima exceptions.
- **Source maps ON** unatoč ~15s build overhead — odluka bez
  eksplicitnog user OK-a, pravilo "nema nečitljivih stack traceova".
- **DSN javan pod `NEXT_PUBLIC_`**: to je Sentry default; DSN nije auth,
  samo tag koji Sentry koristi za projektnu asocijaciju.

## Otvoreno / Sljedeći koraci

- [ ] **User: postavi u Vercel (Production + Preview)**:
  - `NEXT_PUBLIC_SENTRY_DSN` — Sentry → Settings → Projects → protosweb → Client Keys
  - `SENTRY_AUTH_TOKEN` — Sentry → Settings → Auth Tokens (scopes: `project:read`, `project:releases`, `org:read`)
- [ ] Post-deploy: `curl -H "Cookie: protos-admin-session=..." https://www.protosweb.eu/api/admin/sentry-test` → provjera u Sentry Issues
- [ ] Wire Sentry MCP u Cursor sessions — jednom kad ima issue-a, MCP
  `search_issues` + `analyze_issue_with_seer` postaju korisni
- [ ] Follow-up (nije blocker): `ClientErrorBoundary.onError` → dupli
  logging u `audit_events` (Sentry-lite backup, compliance)
- [ ] Follow-up: Slack/Telegram webhook iz Sentry projekta koristeći
  postojeći `/admin/automations` pattern

## Reference

- PR: <https://github.com/ProtosEschatos/Protos-Web/pull/42>
- Merged commit: [690459a](https://github.com/ProtosEschatos/Protos-Web/commit/690459a)
- Branch commit: [a086f37](https://github.com/ProtosEschatos/Protos-Web/commit/a086f37)
- Predsjesija (PR #41 boundaries): `memory/sessions/2026-07-20-10-configurator-assets-crash-fix.md`
- Learning: `memory/learnings/protos-web-sentry-app-router-wiring.md`
- Sentry docs: <https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/>
