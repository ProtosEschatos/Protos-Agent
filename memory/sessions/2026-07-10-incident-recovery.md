# Sesija 2026-07-10 — Incident recovery, admin login, portfolio cleanup, hydration fix (Protos-Web)

## Kontekst / frustracija korisnika

- Korisnik (Dario) jako frustriran zbog ponovljenih regresija: admin lozinka ne radi, stranica "bijela"/ne reagira, jezici ne rade, push na GitHub ne znači automatski da je live na Vercelu.
- Zahtjev: **revert cijelog repoa na commit od 6. srpnja ~22h** (`e4a264c`) — sve nakon toga obrisano s `main` (force push).
- Nakon reverta: hero prijevodi nekonzistentni → poravnati; admin lozinka opet ne radi → `ADMIN_SECRET` na Vercelu prepisan (env nije u gitu, revert ga nije vratio).

## Što je napravljeno (kronološki)

### 1. Admin login popravak
- **Uzrok:** `ADMIN_SECRET` na Vercelu promijenjen tijekom ranijih pokušaja; stara lozinka više ne prolazi iako je kod vraćen na 6.7.
- **Fix:** reset `ADMIN_SECRET` na Vercelu (Production + Development); korisnik odabrao novu lozinku (ne spremati u memoriju — samo na Vercelu).
- **Kod (`66af432`):**
  - `checkRateLimit` više ne broji svaki pokušaj — samo neuspjele (`recordFailedAttempt`).
  - `.trim()` na `ADMIN_SECRET` i unesenu lozinku u `verifyAdminPassword` / `getAdminSessionToken` (+ edge verzija).

### 2. Portfolio — maknuti lažne/demo projekte
- Korisnik vidio kartice s tekstom tipa "Vlastita SPA — Supabase backend" i ne želi prikaz dok nije gotovo.
- **Izvor:** 4 seed reda u Supabase `portfolio_items` (samo `language=hr`, `active=true`) + hardkodirani `PROJECT_LINKS` u 3D showcaseu.
- **Fix:**
  - DB: `UPDATE portfolio_items SET active=false` (4 demo projekta — reverzibilno).
  - Kod (`92403e8`): `PROJECT_LINKS = []` → showcase renderira 8 praznih okvira (`FRAME_SLOTS`).
  - i18n (`98772b2`): uklonjeni `showcase.project1..4_title/desc` iz svih 5 jezika.

### 3. Navbar očišćen (`9861587`)
- Maknut duplikat **KONTAKT** link (ostaje samo narančasti CTA gumb).
- Maknut **PRISUTNOST** (`/o-meni#online-presence`) — suvišan u glavnoj navigaciji.
- Desktop + mobile (`Header.tsx`, `MobileMenu.tsx`).

### 4. Hydration fix — stranica "ne radi" / jezici / klikovi (`4834a6b`)
- **Playwright dijagnostika:** React minified errors #418, #423, #425 na produkciji.
- **Uzroci:**
  1. `PageLoader` čitao `sessionStorage` u `useState` initializeru → server `loading=true`, client returning visitor `loading=false` → mismatch.
  2. Blog datumi: `toLocaleDateString` bez `timeZone` → server UTC vs browser lokalno → text mismatch (#425).
- **Fix:**
  - `PageLoader`: deterministički `useState(true)`; returning visitors skriveni u `useLayoutEffect` prije painta (`isBootComplete()`).
  - Blog datumi: `timeZone: 'UTC'` u `Blog.tsx`, `BlogGrid.tsx`, `blog/[slug]/page.tsx`.
- **Verificirano Playwrightom:** ULAZ + cookie modal + hero vidljiv + language switch → `/en`; hydration greške nestale.

### 5. Boot SSR veil (`3bc309c`)
- Ručno `remove()` na `#boot-ssr-veil` (React tree node) uzrokovalo `removeChild: node is not a child`.
- **Fix:** sakrivanje `display:none` umjesto uklanjanja; inline `BOOT_GATE_INIT_SCRIPT` usklađen.

### 6. Deploy / Vercel
- Ponekad push na `main` ne okine Vercel build odmah → provjeriti `vercel ls` i po potrebi `vercel redeploy` ili prazan commit.
- Force production redeploy napravljen 2026-07-10 (~14:11 UTC) nakon pritužbi da GitHub ≠ live.

## Poznato otvoreno

- **`/admin` dashboard 500** (odvojeno od logina): login API vraća 200 + cookie, middleware pušta, ali render admin stranice ponekad baca 500 — nije riješeno u ovoj sesiji.
- **ProtosLogo / framer-motion:** konzola može logirati `<circle> cx/cy undefined` — kozmetički, ne blokira interaktivnost.
- **Preview env:** `ADMIN_SECRET` na Vercel Preview problematičan s CLI (git_branch_required) — Production + Development postavljeni.

## Commits (2026-07-10, na revert bazi `e4a264c`)

| SHA | Opis |
|-----|------|
| `c5e891d` | Hero tagline usklađen na svih 5 jezika |
| `66af432` | Admin login hardening (trim, rate-limit samo fail) |
| `92403e8` | Prazan PROJECT_LINKS u showcaseu |
| `98772b2` | Uklonjeni demo showcase stringovi iz i18n |
| `9861587` | Navbar: bez duplog Kontakt + bez Prisutnost |
| `4834a6b` | Hydration fix (PageLoader + blog datumi UTC) |
| `3bc309c` | Boot veil hide umjesto remove |

## Odluke / preferencije korisnika (durable)

- **Ne prikazivati placeholder/demo portfolio** dok nije stvarno spremno — sakriti u bazi (`active=false`) ili prazni okviri u 3D.
- **Push mora završiti live na Vercelu** — uvijek verificirati deploy, ne samo GitHub green.
- **Testirati u pravom browseru** (Playwright) kad korisnik kaže "stranica ne radi" — curl nije dovoljan.
- **Minimalan ručni rad**; hrvatski copy; ne dirati nepotrebno ostatak sitea nakon reverta.
- Admin lozinka = ono što korisnik kaže za `ADMIN_SECRET` na Vercelu — env se ne vraća git revertom.

## Status repozitorija

- `Protos-Web` `main` @ `3bc309c` (nakon session commita)
- Live: https://www.protosweb.eu — homepage/portfolio/jezici OK nakon hydration fixa
- Supabase keep-alive cron: success (provjereno 2026-07-10)
