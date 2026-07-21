---
id: protos-web-sentry-hardening
project: Protos-Web
extracted_from: 2026-07-20-13
topics:
  - sentry
  - session-replay
  - ignore-errors
  - deny-urls
  - r3f
  - webgl
  - noise-filter
---

# Sentry @sentry/nextjs — production hardening (noise filter + Replay canvas block)

## TL;DR

Nakon što je `@sentry/nextjs` wired (vidi
`memory/learnings/protos-web-sentry-app-router-wiring.md`), tri obrasca
u `Sentry.init` sprječavaju da ~90% šuma zapuni free-tier quotu i da
Session Replay ne zaguši 3D scene: `ignoreErrors` s regex/string
patternima za poznate benigne errore, `denyUrls` s regex-om za browser
extension URL scheme-ove, i `replayIntegration({ block: [...] })` za
canvas + generic opt-out class.

## Kontekst

Kad primijeniti:

- **Odmah nakon** Sentry adoption PR-a — ne čekaj da vidiš prve issue.
  Šum je predvidiv i dokumentiran, hardening je fokusiran fajl-po-fajl
  posao.
- Bilo koji React app s canvasom (R3F, PDF renderer, WebGL vizualizacije,
  charts s canvas backend-om).
- Bilo koja produkcija koja koristi Session Replay + ima performance-heavy
  komponente.

Kad NE:

- Dev okruženje (Sentry ionako disabled ako nema DSN).
- Ako namjerno želiš vidjeti sve extension errore (npr. debug-aš
  extension-specific issue).

## Snippet — full production `Sentry.init` (browser)

```ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: 0.1,

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
      block: ['canvas', '.no-replay'],    // ← key
    }),
  ],

  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1,

  ignoreErrors: [
    /ResizeObserver loop (limit exceeded|completed with undelivered notifications)/,
    'AbortError',
    'The user aborted a request',
    'ChunkLoadError',
    'Loading chunk',
    'Loading CSS chunk',
    'NetworkError when attempting to fetch resource',
    'Load failed',  // Safari's rendition of "failed to fetch"
    'Non-Error promise rejection captured',
  ],

  denyUrls: [
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
    /^safari-extension:\/\//i,
    /^safari-web-extension:\/\//i,
  ],

  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
})
```

## Sadržaj svakog filter-a — zašto je uključen

### `ignoreErrors`

| Pattern | Vraća se u produkciji jer | Ne actionable jer |
|---|---|---|
| `ResizeObserver loop …` | Chromium implementacija ResizeObserver-a je posebna | Zero user impact; browser bug, ne naš |
| `AbortError`, `The user aborted a request` | Korisnik navigira mid-fetch | User intent, ne bug |
| `ChunkLoadError`, `Loading chunk`, `Loading CSS chunk` | Deploy dok korisnik surfa → stale chunk manifest | Reload rješava; nema fix per-event |
| `NetworkError when attempting to fetch resource` | Offline / DNS / CORS strip | Environment problem, ne kod |
| `Load failed` | Safari verzija generic fetch failure-a | Isti razlog kao gore |
| `Non-Error promise rejection captured` | `throw "string"` umjesto `throw new Error(...)` | Nema stack za symbolicate |

Sentry match logic: string = substring match u `error.message`, regex =
match anywhere. Case-sensitive.

### `denyUrls`

Match protiv frame `filename` (Sentry gleda outermost frame). Ako je
error thrown iz `chrome-extension://xxx/content.js`, cijeli event se
odbaci prije nego napusti browser. Ne pojede quota, ne generira
Issue.

**Ne match-a** errore koji su thrown u našem kodu ali koje je nekako
promptao extension. Za to trebaš `beforeSend` sa detection logikom.

### `replayIntegration.block`

- `'canvas'` = CSS selector. Sve što match-a `document.querySelectorAll('canvas')`
  bit će rekonstruirano kao solid placeholder umjesto DOM replaya.
- `'.no-replay'` = opt-out class za buduće komponente (npr. PII forme,
  admin state trees koje ne želimo u playback).
- **Alternativa `mask`**: prikazuje strukturu ali zamjenjuje sadržaj
  crnim mask. Za canvas nema smisla — struktura je jedan `<canvas>` tag.
- **`blockAllMedia: false`** je namjerno — želimo playback slike/videa
  ako je user vidio media prije crasha. Block se targetira SAMO na
  canvas.

## Gotchas

- **`ignoreErrors` matches `error.message`, ne `error.name`.** Zato je
  npr. `'AbortError'` u listi (kao supstring `.message` sadrži) ali
  ne `'Error: AbortError'` — Sentry gleda parsed message field.
- **`Loading chunk`** je namjerno kratak substring — pokriva i
  `Loading chunk 4 failed`, `Loading chunk vendor failed`, itd. bez
  regex-a.
- **`denyUrls` gleda outermost frame filename**, tj. ako je grešku
  bacio extension ali kroz naš `window.onerror`, filename može biti
  naš. U tom slučaju `denyUrls` ne uhvati — trebaš `beforeSend` custom
  filter.
- **`block: ['canvas']` NE spriječava canvas re-render u browseru** —
  samo spriječava Sentry Replay recorder da snima taj DOM subtree.
  Nema performance impacta na R3F samog po sebi.
- **Replay `block` selector matcha na svaki tick recordera**, tj. ako
  dinamički kreiraš `<canvas>` runtime, hvata i te. Ne treba re-init.
- **`Non-Error promise rejection captured`** ce nestati iz Issues, ali
  ako se tečeš dogodi (netko throw-a non-Error) — koristi
  Chrome DevTools `Pause on all uncaught exceptions` da hvataš lokalno.
- **Sentry v10+ ignoreErrors se procjenjuje prije `beforeSend`.** Ako
  imaš oba, ignoreErrors filter radi PRVI (early exit, ne troši
  `beforeSend` CPU cycles).
- **Free-tier quota** (u vrijeme pisanja, 2026-07): 5K errors/mj +
  10K performance events/mj + 50 replays/mj. Bez `ignoreErrors`,
  Chromium `ResizeObserver` spam sam može pojesti 5K/tjedan na
  moderate-traffic site-u.

## Kad proširiti filter dalje

Signal da treba dodati novi pattern:
- Isti Issue > 100 event-ova u < 7 dana + zero fix (nema što fixnuti).
- Sentry issue `Level: unknown` + stack pointing izvan našeg domain-a.
- Cluster identičnih message-a različitih user-a → environmentni, ne
  code.

Ne dodaj pattern samo zato što "izgleda dosadno" — svaki filter je
gubitak signala potencijalnog real bug-a.

## Vidi također

- `memory/sessions/2026-07-20-13-sentry-hardening-pr-43.md` — konkretna implementacija
- `memory/learnings/protos-web-sentry-app-router-wiring.md` — base SDK setup
- Sentry — filtering: <https://docs.sentry.io/platforms/javascript/configuration/filtering/>
- Sentry — Replay privacy: <https://docs.sentry.io/platforms/javascript/session-replay/privacy/>
- rrweb (Replay recorder) — block/mask semantics: <https://github.com/rrweb-io/rrweb/blob/master/guide.md>
