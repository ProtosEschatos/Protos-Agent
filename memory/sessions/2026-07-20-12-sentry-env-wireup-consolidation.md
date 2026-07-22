---
id: 2026-07-20-12
date: 2026-07-20
project: Protos-Web
title: Sentry env vars — postavljanje u Vercel + konsolidacija DSN-a
run_id: cursor-2026-07-20-agent-session
commits: []
learnings:
  - vercel-env-multi-target-consolidation
topics:
  - sentry
  - vercel
  - env-vars
  - vercel-cli
  - vercel-rest-api
  - dsn
  - source-maps
  - observability
  - post-deploy-verification
tags: []
---

## RETRACTED / SUPERSEDED 2026-07-22

**Sentry uklonjen u potpunosti** (PR #47). Vidi close-out
[`2026-07-22-06`](2026-07-22-06-sentry-rip-out-and-konfigurator-verify.md).
Ne koristi ove korake kao aktivan runbook.



# Session 2026-07-20 (12) — Sentry env wire-up + DSN consolidation

## Kontekst

PR #42 (`690459a`, `memory/sessions/2026-07-20-11-sentry-adoption.md`)
mergean je s cijelim `@sentry/nextjs` bootstrapom, ali produkcija nije
imala postavljene runtime env varse pa je SDK bio `enabled: false` (guard
u init-u je `Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN)`). User je već
prije 12h ručno postavio `SENTRY_AUTH_TOKEN`, `SENTRY_ORG_SLUG`,
`SENTRY_PROJECT_SLUG` u Vercel (Production + Preview) preko dashboarda —
ostao je samo DSN.

## Što je napravljeno

### 1. Postavljanje DSN-a (prvi pokušaj — 3 CLI poziva)

User je poslao DSN:
`https://38d5235290afec12cd7428a2a35c780b@o4511259422097408.ingest.de.sentry.io/4511604980580432`
(EU region, org id `4511259422097408`, project id `4511604980580432` =
match sa slug-om `protosweb`).

CLI-jev `vercel env add` prima **jedan** target env po pozivu, pa su
napravljena tri odvojena poziva:

```bash
printf '%s' "$DSN" | vercel env add NEXT_PUBLIC_SENTRY_DSN production
printf '%s' "$DSN" | vercel env add NEXT_PUBLIC_SENTRY_DSN preview
printf '%s' "$DSN" | vercel env add NEXT_PUBLIC_SENTRY_DSN development
```

Efekt: tri odvojena reda u Vercel env store-u — Production (Sensitive),
Preview (Sensitive), Development (Non-sensitive).

### 2. Redeploy + verifikacija u bundleu

`vercel redeploy https://www.protosweb.eu` je **visio na interaktivnom
promptu** jer je bio poslan alias umjesto specifičnog deployment URL-a.
Ubijen `kill 478340`, ali `vercel ls` je pokazao da je redeploy svejedno
triggeran (novi Building 1m ago) i završio Ready za ~2min:
`protos-bpyxl96pm-protoseschatos-projects.vercel.app`.

Verifikacija da je Sentry SDK stvarno u client bundleu (grep DSN prefix
kroz sve `/_next/static/chunks/*.js`):

```
MATCH: /_next/static/chunks/0wts0fb01sd_r.js
markers: 38d5235290afec12cd7428a2a35c780b, /monitoring,
         _sentry_idle, sentry_client, data-sentry-mask, data-sentry-block,
         __sentry_instrumentation_handlers__
```

Znači:
- DSN je bake-an u client chunk (browser SDK može slati)
- Tunnel route `/monitoring` je aktivan (ad-blocker + CSP friendly)
- `_sentry_idle` = `browserTracingIntegration` aktivan
- `data-sentry-mask` = `replayIntegration` masking config primijenjen

Server-side probe `curl /api/admin/sentry-test?mode=capture` je vratio
`401 {"error":"Unauthorized"}` — dokaz da je ruta registrirana i admin
gate radi (potvrda krajnje verifikacije prepuštena user-u koji je jedini
sa admin cookie-em).

### 3. Konsolidacija — 3 rowa u 1 (Prod + Preview)

User je (fer) prigovorio na 3 odvojena reda i tražio da bude "jednom
dodano kao secret" — kao što `SENTRY_ORG_SLUG` već izgleda u dashboardu
(jedan red `Preview, Production`).

Plan `plans/sentry-dsn-vercel-cleanup_45b0f564.plan.md`:

1. Obriši Development entry (šum u lokalnom `npm run dev`, HMR errori bi
   išli u Sentry issue listu):
   ```
   vercel env rm NEXT_PUBLIC_SENTRY_DSN development --yes
   ```

2. Obriši oba postojeća Prod + Preview entrya (CLI ne može spojiti
   postojeća 2 u 1):
   ```
   vercel env rm NEXT_PUBLIC_SENTRY_DSN production --yes
   vercel env rm NEXT_PUBLIC_SENTRY_DSN preview --yes
   ```

3. `POST` na Vercel REST API s multi-target array u payloadu (CLI ne
   podržava multi-target single-call `add`):
   ```
   POST https://api.vercel.com/v10/projects/prj_.../env?teamId=team_...
   { "key": "NEXT_PUBLIC_SENTRY_DSN",
     "value": "...",
     "type": "encrypted",
     "target": ["production", "preview"] }
   ```
   → HTTP 201, entry id `7wRFVQDypKfqnGVS`.

Auth token za API poziv izvučen iz `~/.local/share/com.vercel.cli/auth.json`
preko `python3 -c "import json; print(json.load(open(...))['token'])"`
(jq nije instaliran).

Project ID (`prj_CxlmMJT2Req3GnAHFdGmXyvQxKjn`) i team ID
(`team_Ag2YzbfKytHwYpcCRc18i26c`) iz
`/home/protos/Protos-Web/.vercel/project.json`.

### 4. Post-cleanup stanje

```
--- production ---
 NEXT_PUBLIC_SENTRY_DSN   Encrypted   Production, Preview
 SENTRY_PROJECT_SLUG      Encrypted   Preview, Production
 SENTRY_ORG_SLUG          Encrypted   Preview, Production
 SENTRY_AUTH_TOKEN        Encrypted   Preview, Production
--- preview ---
 (isti entryji, "Production, Preview" pokriva oboje)
--- development ---
 SENTRY_PROJECT_SLUG      Encrypted   Development
 SENTRY_ORG_SLUG          Encrypted   Development
 (nema NEXT_PUBLIC_SENTRY_DSN — SDK je disabled lokalno)
```

Rollback log spremljen u `/tmp/vercel-sentry-dsn-snapshot.log` na dev
mašini.

### 5. Diskusija o Sentry overhead-u i alternativama (nije implementirano)

User je pitao "hoće li nam Sentry smetati i ima li zamjena". Analiza
troška za trenutni stack (Next.js 16 + R3F admin):

| Trošak | Iznos |
|---|---|
| Client bundle | ~90–120 KB gzipped (base + tracing + Replay) |
| Session Replay | ~60 KB od toga |
| Replay buffer runtime | ~5–10 MB RAM, mala CPU % dok bufferira |
| Server cold start | +2–5 ms |
| Build time | +5–15s (source-map upload) |

**Konkretni rizici** za Protos-Web:

- 3D konfigurator + Replay = potencijalni perf hit. R3F frameloop može
  generirati stotine DOM mutacija/s koje Replay pokušava snimati.
- Bundle penalty na public stranicama (init je globalan preko
  `instrumentation-client.ts`).
- Šum u issue listi (ChunkLoadError, ResizeObserver loop, AbortError).

**Preporučeni hardening (NE napravljen — čeka user OK):**

1. `blockSelector: 'canvas'` u `replayIntegration({ block: ['canvas'] })`
   — Replay preskoči 3D scenu na `/admin/konfigurator`.
2. Ili potpuno drop `replayIntegration` iz `instrumentation-client.ts`
   → -60 KB na svim stranicama (ako Replay video-i ionako neće biti
   pregledani).
3. `ignoreErrors: ['ChunkLoadError', /ResizeObserver.*loop/, 'AbortError']`
   u init da free tier ne zapuni benigni šum.

**Alternative razmotrene i odbačene**: Vercel Observability sam (samo
server logovi, nema client), Highlight.io (samohostiv, ali manji
ecosystem), PostHog (analytics-first), Rollbar/Bugsnag (marginalna
razlika, slabiji Next.js DX), Datadog (overkill). Custom
`window.onerror → audit_events` bio bi korak unatrag za app s realnim
3D admin crashovima.

## Verifikacija

- `vercel env ls` post-cleanup: jedan `NEXT_PUBLIC_SENTRY_DSN` red
  `Production, Preview`, nula u Development. ✅
- DSN prefix u `/_next/static/chunks/0wts0fb01sd_r.js` na
  `www.protosweb.eu`. ✅
- `/api/admin/sentry-test` = 401 bez cookie-a (ruta live, gate radi). ✅
- Sentry sad enabled na svakom nextpush (guard prošao jer DSN postoji).

## Odluke i tradeoffi

- **Redeploy nakon env cleanup nije triggeran** — vrijednost DSN-a je
  ostala ista, samo se promijenio broj Vercel env entryja (3 → 1). Već
  Ready deploy `bpyxl96pm-...` ima DSN bake-an u chunk, sljedeći deploy
  pokupit će konsolidirani entry (identičnu vrijednost).
- **Dev DSN namjerno UKLONJEN**: lokalni `npm run dev` neće slati eventove
  u Sentry pa quota ne bude šumljena HMR erorima. Kad ikad zatreba
  lokalni Sentry debug, dodaje se u `.env.local` privremeno.
- **Prod/Preview kao Encrypted (Sensitive)**: kad je entry samo u
  Development, Vercel ga tretira Non-sensitive (mora bit readable za
  `vercel env pull`). Konsolidacija u Prod+Preview automatski vrati
  Encrypted status.
- **`SENTRY_ORG_SLUG` + `SENTRY_PROJECT_SLUG` u Development ostavljeni**
  (ranije nechtjeno dodani preko CLI-ja) — nemaju side effect bez DSN-a,
  koriste ih samo admin status widget queries koji ionako ne rade
  lokalno.
- **CLI vs REST API tradeoff**: single-call multi-target `env add` bi
  bio idealan, ali v55 CLI ga ne podržava. REST API `POST /v10/env` sa
  `target: [...]` array je čisti workaround; alternativa (2x
  `vercel env add`) daje 2 odvojena rowa što je funkcionalno identično
  ali vizualno neurednije.

## Otvoreno / Sljedeći koraci

- [ ] **User: end-to-end smoke test** — loginirati se kao admin, otvoriti
  `https://www.protosweb.eu/api/admin/sentry-test?mode=capture&label=first-live-hit`,
  provjeriti da event stigne u
  `https://protoseschatos.sentry.io/issues/?project=4511604980580432`.
  Onda `?mode=throw` za `onRequestError` path (drugi Issue očekivan).
- [ ] **Sentry hardening (kad user kaže — očito da ide)**: dodati
  `ignoreErrors` u client init (`ChunkLoadError`, `ResizeObserver loop`,
  `AbortError`), pa razmisliti o `blockSelector: 'canvas'` za Replay na
  `/admin/konfigurator`. Ovo je jednostavan follow-up PR.
- [ ] Kad prvi Issue stigne u Sentry, potvrditi da source-map upload iz
  `withSentryConfig` radi (stack trace treba pokazivati originalne
  fajlove/linije, ne minified nazive).
- [ ] Ako se nakon 1-2 tjedna vidi da se Session Replay ne gleda —
  ozbiljno razmotriti drop-ati `replayIntegration` (bundle -60 KB).

## Reference

- Prethodna sesija (Sentry SDK adoption): `memory/sessions/2026-07-20-11-sentry-adoption.md`
- Plan file: `.cursor/plans/sentry-dsn-vercel-cleanup_45b0f564.plan.md`
- Learning: `memory/learnings/vercel-env-multi-target-consolidation.md`
- PR koji je nosao Sentry SDK: <https://github.com/ProtosEschatos/Protos-Web/pull/42>
- Sentry project: <https://protoseschatos.sentry.io/issues/?project=4511604980580432>
- Vercel Env Vars REST API: <https://vercel.com/docs/rest-api/reference/endpoints/projects/create-one-or-more-environment-variables>
