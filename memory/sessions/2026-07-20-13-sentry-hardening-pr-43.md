---
id: 2026-07-20-13
date: 2026-07-20
project: Protos-Web
title: Sentry hardening — ignoreErrors + Replay canvas block (PR #43)
run_id: cursor-2026-07-20-agent-session
commits:
  - 1efbedd
learnings:
  - protos-web-sentry-hardening
topics:
  - sentry
  - session-replay
  - ignore-errors
  - r3f
  - konfigurator
  - noise-filter
  - quota
  - deny-urls
tags: []
---

## RETRACTED / SUPERSEDED 2026-07-22

**Sentry uklonjen u potpunosti** (PR #47). Vidi close-out
[`2026-07-22-06`](2026-07-22-06-sentry-rip-out-and-konfigurator-verify.md).
Ne koristi ove korake kao aktivan runbook.



# Session 2026-07-20 (13) — Sentry hardening, PR #43

## Kontekst

Nakon što je PR #42 uveo Sentry SDK (sesija `-11`) i nakon što su env
vars konsolidirani u Vercelu (sesija `-12`), otvorila su se dva realna
rizika za kvalitetu signala:

1. **Free-tier quota flooding** — client SDK po defaultu hvata SVE
   errore, uključujući `ResizeObserver loop`, `ChunkLoadError`,
   `AbortError` i extension noise. Ništa od toga nije actionable, ali
   svaki event ide u brojač.
2. **Session Replay + R3F katastrofa** — Replay snima DOM mutacije za
   playback. R3F `frameloop` prevodi WebGL state changes u DOM eventove
   na `<canvas>` — pri 60fps to je stotine mutacija/s. On-error buffer
   se puni beskorisnim `<canvas>` mutacijama umjesto UI konteksta oko
   crasha.

User je u prethodnom turnu potvrdio smjer ("očito da ide"), pa je
napravljen fokusirani follow-up PR bez čekanja post-deploy metrikama.

## Što je napravljeno

Jedan fajl (`instrumentation-client.ts`), +32 linije.

### 1. `ignoreErrors` — filter na 8 poznatih benignih obrazaca

```ts
ignoreErrors: [
  /ResizeObserver loop (limit exceeded|completed with undelivered notifications)/,
  'AbortError',
  'The user aborted a request',
  'ChunkLoadError',
  'Loading chunk',
  'Loading CSS chunk',
  'NetworkError when attempting to fetch resource',
  'Load failed', // Safari
  'Non-Error promise rejection captured',
]
```

Svaki je odabran jer:
- Ne daje actionable stack — root cause nije u našem kodu ili je izvan
  našeg control-a (offline, browser aborted).
- Očekuje se u produkciji svaki dan; ostavljanje ih uključenima bi za
  ~tjedan zapunio free-tier limit (5K eventova/mj).

### 2. `denyUrls` — extension noise iz page contexta

```ts
denyUrls: [
  /^chrome-extension:\/\//i,
  /^moz-extension:\/\//i,
  /^safari-extension:\/\//i,
  /^safari-web-extension:\/\//i,
]
```

Extensions (grammar checkers, ad blockers, password managers) često
inject-aju scriptove koji throw-aju u našem window contextu. Ti errori
imaju stack pointing na `chrome-extension://...` — nisu naš bug.

### 3. `replayIntegration({ block: ['canvas', '.no-replay'] })` — R3F block

- `'canvas'` selector = svi `<canvas>` elementi (R3F, potencijalne
  buduće WebGL vizualizacije, PDF renderer canvas, itd.) preskočeni od
  Replay recordera.
- `'.no-replay'` = generic opt-out class za buduće komponente s PII
  (npr. admin form za API keys).

Replay će i dalje snimati sve OKO canvasa — UI kontrole, error toast,
navigaciju — što je stvarno ono što je korisno za debugging.

## Verifikacija (lokalno)

- `npx tsc --noEmit` clean (8.7s)
- `npx eslint instrumentation-client.ts` clean
- `npm run build` clean (32s); route table intact, uključujući
  `/api/admin/sentry-test`
- Nema izmjena u `package.json` (bez novih dependencija)

## PR i CI

- Branch: `feat/sentry-hardening`, base `690459a` (main = merged PR #42)
- Commit: `1efbedd feat(sentry): filter benign noise + block Replay on canvas`
- PR: <https://github.com/ProtosEschatos/Protos-Web/pull/43>
- CI status na push time (t+20s):
  - Cloudflare DNS: pass
  - Supabase: pass
  - Vercel Preview Comments: pass
  - Supabase Preview: skipping (nema DB izmjena)
  - Build: pending
  - Vercel: pending

Očekivano merge nakon user pregleda.

## Odluke i tradeoffi

- **Focused PR umjesto veće refaktoracije**: postoji cijeli katalog
  Sentry hardening trikova (`beforeSend` za PII stripping, sampling
  per-transaction-name, `beforeSendTransaction`, itd.). Namjerno
  ostavljeno kao follow-up jer svaka od tih optimizacija ovisi o
  stvarnim podacima koje ćemo vidjeti tek nakon što live traffic
  počne generirati Issues.
- **`block` umjesto `mask` za canvas**: mask bi zamijenio pixele
  crnim/blur pattern-om (i dalje snima strukturu), block potpuno
  preskoči rekonstrukciju. Za canvas želimo potpuni preskok — nema
  smisla imati "blur mask" nad WebGL scenom.
- **`replayIntegration` NIJE potpuno uklonjen** iako je to bila opcija
  (ušteda ~60 KB gzipped). Zadržano jer:
  - Ako se Replay pokaže neupotrebljiv u praksi, jedan-line delete je
    triviljan follow-up.
  - Konfigurator crashovi su vjerojatno #1 use case za koji je Replay
    zaista koristan (kompleks 3D state → user action → crash).
- **Nema `beforeSend` hooka za PII scrubbing**: trenutno nema PII u
  našim URL-ovima ili state trees (admin je iza cookie-a, javne
  stranice ne loguju user data). Ako se to promijeni, follow-up PR.
- **Zašto `Load failed` (Safari) explicitno**: Safari renderiraFetch
  errore kao generičku string bez pravog stack-a; Chromium daje
  `TypeError: Failed to fetch`. Bez explicitnog `'Load failed'`,
  Safari korisnici bi generirali cluster istovjetnih events.

## Otvoreno / Sljedeći koraci

- [ ] **User: review + merge PR #43** — mali diff (1 fajl, +32 linije),
  nema breaking changes.
- [ ] **Nakon merge-a**: bump `memory/projects/protos-web.md` s "MERGED"
  statusom (kao PR #41 i #42).
- [ ] **1-2 tjedna post-merge**: pregledati Sentry Issues dashboard.
  Ako i dalje ima šuma → proširiti `ignoreErrors`. Ako Replay video-i
  daju vrijednost samo za konfigurator crashove → razmisliti o
  route-based sampling (Replay samo na `/admin/*`).
- [ ] Ako se u naredna ~2 tjedna vide **stvarni** Issue-i iz produkcije
  koji zahtijevaju context → sesija-driven fine-tuning
  (`beforeSend`, custom tags, custom fingerprinting).

## Reference

- Prethodne sesije: `memory/sessions/2026-07-20-11-sentry-adoption.md`
  (SDK adoption), `memory/sessions/2026-07-20-12-sentry-env-wireup-consolidation.md`
  (env vars)
- Learning: `memory/learnings/protos-web-sentry-hardening.md`
- PR: <https://github.com/ProtosEschatos/Protos-Web/pull/43>
- Commit: [1efbedd](https://github.com/ProtosEschatos/Protos-Web/commit/1efbedd)
- Sentry docs — `ignoreErrors`: <https://docs.sentry.io/platforms/javascript/configuration/filtering/#using-ignoreerrors>
- Sentry docs — Replay privacy/block: <https://docs.sentry.io/platforms/javascript/session-replay/privacy/>
