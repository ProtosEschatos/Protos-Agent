---
id: 2026-07-22-03
date: 2026-07-22
project: Protos-Web
title: Defense-in-depth security hardening — 2FA, sessions, SSRF, sharp, rate limit (PR #45)
run_id: cursor-2026-07-22-agent-session
commits:
  - 97f89a0
learnings:
  - protos-web-revokable-admin-sessions
  - protos-web-ssrf-two-layer-defense
  - protos-web-upstash-rate-limit-fallback
topics:
  - security
  - 2fa
  - totp
  - otplib
  - admin-sessions
  - opaque-token
  - ssrf
  - rfc1918
  - ipv6
  - dns-rebinding
  - sharp-cve
  - libvips
  - rate-limit
  - upstash
  - open-redirect
  - timing-safe-compare
  - cron-secret
  - security-definer
  - storage-bucket-list
  - audit-log-coverage
  - defense-in-depth
tags: []
---

# Session 2026-07-22 (03) — Defense-in-depth hardening (PR #45)

## Kontekst

User's threat model, prevodenje s njegovog jezika:
> "Kako se ja zaštitim da ljudi ne mogu vidjeti moj source kod i informacije
> o logici izrade weba? Napravi mi strateški najbolju protuobranu i najpravi
> da je nemoguće da me netko duplicira i krade podatke ili dizajne."

Ključno objašnjenje koje je user usvojio prije coding-a:
- **Client kod je uvijek javan** — browser mora skinuti JS da ga izvrši.
  Obfuskacija ne štiti, samo usporava.
- **Server kod + env vars bez `NEXT_PUBLIC_` = tajne.** Sav bitan business
  logic ide tamo.
- **RLS je najvažnija DB odbrana** — Supabase anon key JE javan, sigurnost
  je u RLS policy-ma.
- **Kopiranje dizajna/content-a** = pravni problem (DMCA, robots.txt,
  copyright), ne tehnički.

Prije rada napravljen je iscrpni read-only audit koji je izlistao 10
konkretnih rizika. User odabrao "one big PR" strategiju sa svim izmjenama
odjednom.

## Što je napravljeno

Kompletni defense-in-depth PR sa 10 blokova (5 od 10 je odgođeno kao
follow-up jer je previše rizično za kombinirani PR).

### Blok 1 — Revokable admin sesije + opt-in TOTP 2FA (najveći impact)

**Problem:** admin auth je bio stateless `HMAC(ADMIN_SECRET, SESSION_SALT)`.
Svaki valjani cookie je bio byte-identičan. Ako procuri → jedini revoke je
rotacija `ADMIN_SECRET` (kicka SVE sesije).

**Rješenje:**
- Nova tabela `public.admin_sessions` (migracija `20260722012457`):
  `id, token_hash, ip, user_agent, created_at, last_seen_at, expires_at, revoked_at`
  — RLS enabled, no policies (service_role only).
- Nova arhitektura auth-a:
  - `admin-sessions.ts` (Node) — DB ops: `createSession`, `verifySessionToken`,
    `revokeSession`, `revokeSessionByToken`, `revokeAllSessionsExcept`,
    `listActiveSessions`.
  - Cookie value = 32-byte random hex (`randomBytes(32).toString('hex')` = 64 chars).
  - DB row drži `sha256(token)`. Constant-time compare na verify + optional
    fire-and-forget `last_seen_at` bump.
- `admin-auth.ts::verifyAdminSession` sad je **async** i vraća DB result.
  Sve 8 call sites (API routes + `require-admin.ts`) updated na `await`.
- `admin-auth-shared.ts::verifyAdminSessionEdge` (Edge runtime, koristi se
  u `proxy.ts` middleware-u) također async — koristi direct Supabase REST
  fetch sa service role env-om (WebCrypto SHA-256 za hash, no supabase-js
  bundle bloat). Fail-closed na svaki error.
- **TOTP 2FA opt-in** preko `ADMIN_TOTP_SECRET` env varijable:
  - `admin-2fa.ts` sa `otplib` v13 (`OTP` klasa umjesto legacy
    `authenticator` — otplib 13 rewrite).
  - `is2FAEnabled()` = env postavljena or ne.
  - `verifyTotpCode(code)` — sha1, 30s period, ±1 step tolerance
    (`epochTolerance: [30, 30]`) za clock skew.
  - Login route: pass verify → ako 2FA on → traži `body.totp`, ako nije
    dat → `{ needsTotp: true }` odgovor (`401`), ako je dat → verify.
  - `AdminLoginForm.tsx` progressive-disclosure: prvi submit sa lozinkom,
    ako backend traži TOTP → otkriva se `<input pattern="\d{6}" ...>` sa
    autofocus. Password se ne mora ponovo unositi.
- Nova stranica `/admin/sesije` + `AdminSessionsClient.tsx`:
  - Tabela: status (aktivna / aktivna (ova) / opozvana), IP, browser
    (skraćen UA), created/last-seen/expires timestamps.
  - "Opozovi" po sesiji, "Opozovi sve ostale" (blokira revoke vlastite —
    treba koristiti Logout).
  - Audit-log svaki revoke (`admin.session.revoke.ok`,
    `admin.session.revoke_all_others.ok`).
- Logout revoke DB session prije clear-a cookie-a
  (`admin.logout.ok` audit event).

### Blok 2 — Distribuirani rate-limit (Upstash) + pokrivanje unlimited endpoints

**Problem:** `Map`-based per-lambda limiteri (`src/lib/security/rate-limit.ts`).
Na Vercel serverless efektivno bez cap-a pod prometom (lambde reciklaju,
memory ne dijele).

**Rješenje:**
- `rate-limit.ts` refactor: Upstash sliding-window (via `@upstash/redis` +
  `@upstash/ratelimit`) kad su env-ovi postavljeni, in-memory fallback kad
  nisu (backward-compat).
- Sync signatura zadržana (`checkRateLimit(...)`) — svi call sites rade bez
  izmjena. Fire-and-forget async check + in-memory guard za prvi request.
- Novi `checkRateLimitStrict` — čeka Upstash odgovor pred nastavak. Za hot
  endpoints (login, admin AI, sentry-test, edge OG).
- Rate-limit dodat na endpoints koji ga nisu imali:
  - `/api/admin/ai` — 10/min per IP (strict)
  - `/api/admin/sentry-test` — 5/min per IP (strict)
  - `/api/blog` — 100/min (sync) + `Cache-Control: s-maxage=300, stale-while-revalidate=3600`
  - `/api/og` — 60/min per IP (edge runtime, strict)

### Blok 3 — sharp CVE fix

`overrides.sharp: ^0.35.0` u `package.json` zatvara `GHSA-f88m-g3jw-g9cj`
(libvips CVE-2026-33327/28/35590/91). `npm audit --production` sada javlja
**0 vulnerabilities**.

### Blok 4 — SSRF hardening

Novi `src/lib/security/ssrf.ts` sa dva sloja:
1. `isBlockedHostLiteral(url)` — sync, u Zod schema-i. Blokira:
   - IPv4: 0/8, 10/8, 100.64/10 (CGN), 127/8, 169.254/16, 172.16/12
     (fali u prethodnom regexu), 192.0.0/24, 192.0.2/24, 192.168/16,
     198.18/15, 198.51.100/24, 203.0.113/24, 224/4 (multicast), 240/4
     (reserved).
   - IPv6: `::1`, `::`, unique local (fc/fd), link-local `fe80::/10`,
     IPv4-mapped IPv6 (obje dotted `::ffff:127.0.0.1` i hex
     `::ffff:7f00:1` forme), multicast/reserved `ff00::/8`.
   - `localhost` + `*.localhost`.
2. `assertPublicUrl(url)` — async DNS resolve preko `node:dns` + provjera
   svake rezolvirane IP adrese kroz isti blocklist. Fail-closed.

Poziva se u `fireAutomationWebhook` (u `src/lib/queries/admin/automations.ts`)
prije svakog outbound fetch-a. Ne zatvara u potpunosti DNS-rebinding race
(Node fetch re-resolvira DNS interno) — dokumentirano u komentaru.

### Blok 6 — Open-redirect fix

`AdminLoginForm.tsx` — `?from=…` param sanitiziran: reject apsolutne
(`https://evil.com/`) i protocol-relative (`//evil.com/`), fallback na
`/admin`.

### Blok 7 — Timing-safe compare CRON_SECRET

`/api/cron/sync-inbox`: `===` → `crypto.timingSafeEqual` sa length
pre-check (throw prevention). Import `node:crypto`.

### Blok 8+9 — DB re-hardening (migracija `20260722012449`)

- `REVOKE EXECUTE ON get_donation_totals FROM anon, authenticated, public`
  — donations-stripe migracija (`20260714221113`) je bila re-grant-ala što
  je hardening migracija (`20260705193252`) revokirala. Funkcija se
  **nigdje ne poziva iz app koda** (grep confirmed), sigurno lock-down.
- `DROP` idempotent svih varijanti `"Public read <bucket>"` SELECT policies
  na `storage.objects` za `showcase` + `site-assets`. Direct object URL-ovi
  i dalje rade (public path `/storage/v1/object/public/<bucket>/<path>`
  bypass RLS entirely). `LIST` kroz `/storage/v1/object/list/<bucket>` sada
  blokiran za anon.

### Blok 10 — Audit log coverage

`recordAudit` pozivi dodati u sve CRUD server actions koje ih nisu imali:
- `admin-blog.ts` — create/update/delete .ok/.error (5 novih pozivnih točaka)
- `admin-portfolio.ts` — create/update/delete .ok/.error
- `admin-assets.ts` — finalize, update, delete .ok/.error
- `admin-automations.ts` — create/update/delete/fire .ok/.error + safe URL
  host logging (samo host, ne cijeli URL — može sadržavati path secrets).

## Odluke i tradeoffi

- **Blok 5 (CSP nonce) odgođen kao follow-up**: veći rizik regresije sa
  GA4/Vercel Analytics inline script-ovima. Trenutni CSP+HSTS+`X-Frame-Options: DENY`+
  JSON-LD safe serializer već zatvaraju sve realne XSS surface-e.
  ROI je nizak za user's actual threat model (kopiranje/duplikacija >
  XSS-driven data exfil).
- **Opt-in 2FA umjesto forced**: user može spavati na PR merge-u prije
  postavljanja `ADMIN_TOTP_SECRET`; login ostaje password-only dok env
  nije postavljena. Backward compatible, gradual rollout.
- **Opt-in Upstash umjesto forced**: bez env-ova, in-memory fallback (isti
  kao prije). Sa env-ovima, global sliding window. Backward compatible.
- **DB-backed sessions umjesto JWT**: JWT bi bio stateless (kao stari
  HMAC) — problem revoke-a se ne rješava JWT-om. DB lookup po request-u
  je +1 query per admin nav, prihvatljiv trade za revoke capability.
- **Cookie value = plaintext token, DB = sha256(token)**: standardno.
  DB compromise ne otkriva cookies (samo hash), cookie leak ne otkriva DB
  ostatak (jer je random opaque).
- **Edge middleware koristi direct REST fetch umjesto `@supabase/supabase-js`**:
  supabase-js radi na edge, ali dodaje bundle bloat + eksplicitna kontrola
  cache/no-store lakše sa raw fetch.
- **Automation URL host-only u audit log-u** (ne cijeli URL): webhook URL
  može imati path-embedded secrets (npr. Zapier webhook path token). Log
  cijelog URL-a bi bio secret leak u `audit_events`.
- **Migracije primijenjene kroz MCP `apply_migration`** — MCP je
  re-timestamped migracije (`012449`, `012457` umjesto `005736`, `010226`)
  jer koristi wall-clock pri primjeni. Lokalno preimenovan da matcha
  remote (isti pattern kao `20260720160833_harden_trigger_function_search_path`
  u prošlim sesijama).

## Verifikacija

- `npx tsc --noEmit` clean nakon svakog bloka
- `npm run build` clean (34 fajla, ~1800 linija, ~35s build)
- `npm audit --production` **0 vulnerabilities**
- CI na PR-u: Build ✅ · Supabase ✅ · Cloudflare DNS ✅ · Vercel Preview ✅
- Migracije primijenjene remote-om + lokalni fajlovi align-ovani na iste timestamp-ove
- Squash merge → commit `97f89a0` na `main`

## Otvoreno / Sljedeći koraci

- [ ] **User setup — 2FA aktivacija**: generirati TOTP secret, dodati
  `ADMIN_TOTP_SECRET` u Vercel env (prod + preview), skenirati sa
  authenticator aplikacijom (Google Authenticator / 1Password / Authy),
  redeploy.
- [ ] **User setup — Upstash Redis**: kreirati DB (free tier je dovoljan),
  dodati `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` u Vercel env.
- [ ] **User setup — Cloudflare orange-cloud**: prebaciti sve `protosweb.eu`
  DNS record-e sa DNS-only (siva) na Proxied (narančasta). Enable Bot
  Fight Mode + WAF Managed Rules (OWASP) + rate-limit rule na `/api/*`.
- [ ] **User setup — Secret rotation**: rotirati sve tajne env vars
  koje su ikad postojale lokalno (`ADMIN_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`,
  `SENTRY_AUTH_TOKEN`, svi AI provider keys). Nova session model neće
  pomoći ako je stari secret compromised.
- [ ] **Blok 5 follow-up — CSP nonce**: kad bude vremena, migrirati
  script-src iz `'unsafe-inline'` na nonce-based. Traži nonce middleware
  u `proxy.ts` + `<Script nonce={...}>` u layout. Testirati na preview
  deploy-u prije prod-a jer GA/Vercel Analytics inline script-ovi mogu
  break-ati.
- [ ] **Prati audit_events tabelu** kroz 1-2 tjedna — vidjeti da li novi
  audit pozivi lovaju stvarne događaje (svi CRUD + revoke + login).
- [ ] **Cleanup**: obrisati `SESSION_SALT` konstantu iz `admin-auth-shared.ts`
  kad se potvrdi da nema legacy caller-a (ostavljena zbog backward-compat
  grep-a).

## Reference

- PR: <https://github.com/ProtosEschatos/Protos-Web/pull/45>
- Squash commit: [97f89a0](https://github.com/ProtosEschatos/Protos-Web/commit/97f89a0)
- Prethodne sigurnosne sesije:
  - `memory/sessions/2026-07-20-06-seo-security-re-audit.md`
  - `memory/sessions/2026-07-20-13-sentry-hardening-pr-43.md`
- otplib v13 (nova API): <https://otplib.yeojz.dev>
- @upstash/ratelimit sliding window: <https://upstash.com/docs/redis/sdks/ratelimit-ts/algorithms>
- SSRF defense reference: <https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html>
