---
id: 2026-07-22-04
date: 2026-07-22
project: Protos-Web
title: CF proxy retract, Proton Authenticator, meta-pravilo o grepanju memorije, konfigurator otvoren
run_id: cursor-2026-07-22-agent-session
commits: []
learnings:
  - nextjs-vercel-cf-proxy-forbidden
topics:
  - cloudflare
  - vercel
  - dns
  - proxy
  - retract
  - proton
  - proton-authenticator
  - totp
  - 2fa
  - meta-rule
  - memory-usage
  - konfigurator
  - 3d
  - open-bug
tags: []
---

# Session 2026-07-22 (04) — CF proxy retract + meta-pravilo + konfigurator open

## Kontekst

User čitao post-merge summary PR-a #45 (security hardening) i uočio dvije
stvari koje su bile pogresne / nezapisane:

1. Predložio sam "prebaciti `protosweb.eu` DNS records sa DNS-only na
   Proxied (narančasta CF strelica) + Bot Fight Mode + WAF" — što
   direktno konflikte sa Vercel-om (redirect loop, TLS, cache poison).
   User je to znao iz iskustva, ja **nisam grep-nuo Protos-Agent** za tu
   temu prije prijedloga, iako je učenje `nextjs-vercel-domain-redirect-conflicts.md`
   postojalo od 2026-07-20 i sesija `2026-07-19-migration-lock-cf-cache-poison.md`
   je zabilježila cache poison još ranije.
2. Pitao **koristim li uopće Protos-Agent memoriju konstantno** — pošten
   odgovor: **ne**. Consultam je samo kad eksplicitno grep-nem za nekim
   pojmom, i nemam automated pre-load na startu sesije. Ovo je sistemski
   propust koji dovodi do ponavljanja istih grešaka.

Također: user je javio da mu je **3D konfigurator još uvijek pukotina —
bijeli ekran** — što znači da PR #41 error boundary fix (2026-07-20-10)
ne hvata krizu; ostaje otvoreno za Faza 2 debug.

## Što je napravljeno u ovoj sesiji

### 1. CF proxy — retract u memoriji

- Uklonjeno / precrtano "User setup — Cloudflare orange-cloud" iz
  `2026-07-22-03-security-hardening-pr-45.md` sa jasnim retract
  komentarom + preusmjeravanje na alternative (Vercel Firewall, Upstash
  rate-limit — koji je već sređen u Blok 2).
- Kreiran novi learning [`nextjs-vercel-cf-proxy-forbidden.md`](../learnings/nextjs-vercel-cf-proxy-forbidden.md)
  koji dokumentira 6 konkretnih razloga (redirect loop, TLS duplo,
  header strip, cache poison, preview URL problem, Bot Fight Mode false
  positive) + alternative + meta-pravilo o grepanju memorije prije
  savjeta.

### 2. Meta-pravilo za buduće sesije

**Prije svakog "user setup" / "opcionalno" / "preporuka" bullet-a →
obavezan grep Protos-Agent:**

```bash
# Iz Protos-Agent workspace-a:
rg -iC2 --type md "<domain|provider|library|topic>" memory/
```

Ako bilo koji hit spomene incident / bug / retract / "forbidden" pattern,
**nemoj ga proponirati bez eksplicitnog konteksta zašto je sada drugačije**.

Ovo pravilo je dodano i u `nextjs-vercel-cf-proxy-forbidden.md` (Meta
sekcija) jer je najvidljivije baš tamo za buduće CF-vs-Vercel savjete.

### 3. Proton Authenticator napomena

User koristi **Proton Authenticator** (Proton Pass-ov built-in TOTP
generator ili standalone Proton Authenticator app) umjesto Google
Authenticator. Bitno: implementacija u PR #45 (`src/lib/auth/admin-2fa.ts`)
koristi **standardni RFC 6238 TOTP** (sha1, 30s period, 6-digit) — što
znači kompatibilnost sa svim mainstream TOTP klijentima uključujući
Proton Authenticator, Google Authenticator, Authy, 1Password, Bitwarden,
FreeOTP.

Setup za user (kad odluči aktivirati 2FA):

1. Generirati secret lokalno:
   ```bash
   node -e "import('otplib').then(m => console.log(new m.OTP().generateSecret()))"
   ```
2. Dodati kao `ADMIN_TOTP_SECRET` u Vercel env (Production + Preview).
3. Dobiti otpauth URI (za QR kod):
   ```bash
   node -e "import('otplib').then(m => {
     const s = process.env.ADMIN_TOTP_SECRET;
     console.log(new m.OTP().generateURI({
       issuer: 'Protos Web',
       label: 'admin@protosweb.eu',
       secret: s,
       period: 30,
       digits: 6,
     }))
   })"
   # Kopiraj otpauth://... URI, pretvori u QR (Vercel Preview render, ili
   # `qrencode -t ansiutf8 "otpauth://..."` iz terminala).
   ```
4. Skenirati QR sa Proton Authenticator app-om — pojavljuje se novi
   entry "Protos Web (admin@protosweb.eu)" sa 6-cifrenim kodom.
5. Sljedeći login: nakon lozinke backend vraća `{ needsTotp: true }` →
   frontend prikazuje 6-znamenkasti input → unijeti kod iz Proton
   Authenticator app-a.

**Napomena za buduće sesije**: nema razlike u koraku 1-3 za bilo koji
TOTP klijent. Proton Authenticator je standardno kompatibilan.

### 4. Konfigurator — dijagnoza otvorena

Runtime info potreban:
- User potvrdio: `/admin/konfigurator` na produkciji = potpuno bijeli
  ekran, ne prikazuje čak ni error boundary fallback ("Ovaj panel je
  pao s greškom").

Read-only pregled koji sam napravio u ovoj sesiji:
- `src/proxy.ts` (middleware): production `curl -sSI` na
  `https://www.protosweb.eu/en/admin/konfigurator` vraća **307 → /admin/login**
  (za unauth request). Znači middleware radi, admin_sessions verify radi.
  Bijeli ekran je post-login.
- `src/app/[locale]/admin/konfigurator/page.tsx` (Server Component): tanki
  wrapper, `setRequestLocale` + `<AdminPageShell><ConfiguratorManager /></AdminPageShell>`.
- `src/components/features/admin/ConfiguratorManager.tsx` (Client): full
  outer `ClientErrorBoundary` + per-panel boundary-i (isti pattern kao
  PR #41).
- `src/app/[locale]/admin/error.tsx` (route boundary): `'use client'` sa
  `import * as Sentry from '@sentry/nextjs'` u `useEffect`. Ako Sentry
  init padne, boundary sam pukne → cascade na `global-error.tsx`.
- Package versions: `next@^16.2.10`, `react@^19.2.7`, `three@^0.185.1`,
  `@react-three/fiber@^9.6.1`, `@react-three/drei@^10.7.7` — sve
  bleeding-edge, kombinacija three 0.185 sa drei 10.7.7 nije nužno
  pokrivena drei peerDep matrix-om.

Hipoteze koje ostaju za Fazu 2 (nakon što uzmem console error):

1. **H1** — import-time throw u `three` / `@react-three/fiber` /
   `@react-three/drei` module init (three 0.185 API break vs drei 10.7.7).
   Symptom: white screen jer bundle module error escapea sve boundary-e
   (throw je u chunk-load fazi, prije mount cycle-a).
2. **H2** — RSC pipeline throw + `admin/error.tsx` sam padne (Sentry
   import fail, `useEffect` u error boundary throw). Cascade na
   `global-error.tsx` koji možda ima svoju grešku → bijeli ekran.
3. **H3** — Client hydration throw prije mount ClientErrorBoundary
   (React 19 hydration edge case sa `next/dynamic` + `ssr: false`).

**Ne mogu razlikovati bez browser console error-a.** Sekundarni sumnjivci
(nisu root cause, ali doprinose polupražnoj sceni čak i ako je prošao
mount):
- CSP `connect-src` ne dozvoljava drei HDRI CDN (`market.pmnd.rs` ili
  slično) → `Environment preset` fetch fail → Suspense fallback.
  **Nije fatal**, ali smeta.

## Odluke i tradeoffi

- **Retract u istoj memory session file-i (`2026-07-22-03`) umjesto force-push amend commit-a**:
  session je već pushed na `origin/main`, git history je immutable za
  reviewability. Retract kao annotated strikeout u markdown-u je čitljiv
  i dolazi kao dio slijedeće commit-a.
- **Meta-pravilo u learning file-i (ne AGENTS.md)**: AGENTS.md je stabilan,
  learning-i su where pattern-i idu. Ako se pojavi drugi "always grep memory
  first" propust, može se promovirati u top-level AGENTS.md pravilo.
- **Konfigurator debug odgođen do runtime info-a**: bez console error-a
  imam 3 skoro-jednako-vjerojatne hipoteze; pucati u prazno = potrošeni
  reviewability sat + moguća regresija sa PR #41 fix-om koji radi za
  neke slučajeve.

## Otvoreno / Sljedeći koraci

- [ ] **User → paste DevTools console error** sa `/admin/konfigurator`
  na produkciji (Chrome/Firefox → F12 → Console tab → prve 3-5 crvenih
  linija). To određuje H1/H2/H3.
- [ ] Nakon toga: kreirati `fix/konfigurator-white-screen` branch, target
  fix za detektiranu hipotezu, PR, merge (isti flow kao PR #41 → #45).
- [ ] Post-fix: novi session `2026-07-22-05` + learning ovisno o root cause-u.
- [ ] Post-fix: dodati `market.pmnd.rs` u CSP `connect-src` (odvojen sitni
  commit, bez obzira na hipotezu).

## Reference

- Retract event: `memory/sessions/2026-07-22-03-security-hardening-pr-45.md` (redak sa "POVUČENO 2026-07-22")
- Novi learning: `memory/learnings/nextjs-vercel-cf-proxy-forbidden.md`
- Predsjesija (konfigurator dijagnoza, samo error boundary fix):
  `memory/sessions/2026-07-20-10-configurator-assets-crash-fix.md`
- Predsjesija (konfigurator prvo javljanje, dijagnoza, nema fixa):
  `memory/sessions/2026-07-20-09-configurator-assets-crash.md`
- CF cache poison prethodni incident:
  `memory/sessions/2026-07-19-migration-lock-cf-cache-poison.md`
