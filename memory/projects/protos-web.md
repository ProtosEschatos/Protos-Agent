# Protos-Web

**Repo:** [ProtosEschatos/Protos-Web](https://github.com/ProtosEschatos/Protos-Web)  
**Live:** https://www.protosweb.eu  
**Domena:** `protosweb.eu` (Cloudflare DNS)  
**Kontakt email:** `dario.admin@protosweb.eu` (Zoho inbox + Resend/Brevo slanje)

## Stack (stvarni — produkcija)

| Sloj | Tehnologija |
|------|-------------|
| Framework | **Next.js 14** App Router |
| Jezik | TypeScript |
| Stil | Tailwind + CSS varijable (`--primary`, `--dark`, …) |
| i18n | `next-intl` — `hr` (default), `en`, `de`, `it`, `es` |
| Baza | **Supabase** PostgreSQL (`laqnnzavwbojntfiqmxj`) |
| Deploy | **Vercel** (auto iz `main`) |
| Email | Resend (transakcijski), Brevo (newsletter), Zoho Mail (inbox) |
| 3D admin pozadina | React Three Fiber (`three`) |

> Napomena: `Protos-Agent/rules/stack.md` opisuje ciljani **Nuxt 4** stack za buduće projekte. **Protos-Web je Next.js** i ostaje takav dok se ne planira migracija.

## Admin panel (`/admin`)

Privatna kontrolna ploča na **glavnoj domeni** (ne subdomena).

### Auth
- Lozinka = env `ADMIN_SECRET` (**samo Vercel**, ne Supabase) — **env se NE vraća git revertom**
- HttpOnly cookie `protos-admin-session` (HMAC SHA-256)
- Middleware štiti `/admin/*` osim `/admin/login`
- Rate limit: **samo neuspjeli** pokušaji / 15 min na `/api/admin/login` (ne broji uspješne)
- `.trim()` na `ADMIN_SECRET` i unesenu lozinku pri usporedbi
- **Nema javnog nav linka** — `AdminNavLink` samo kad je session aktivan (skriveno za anon)

### Ključne putanje
```
src/app/[locale]/admin/          # stranice (layout: force-dynamic)
src/app/api/admin/               # login, logout, session
src/lib/admin-auth.ts            # server HMAC verify
src/lib/admin-auth-shared.ts     # edge-safe shared (middleware)
src/lib/require-admin.ts         # server actions / queries guard
src/lib/supabase-admin.ts        # service role client
src/lib/admin/blog-queries.ts    # CMS read (bez 'use server')
src/lib/admin/portfolio-queries.ts
src/actions/admin-blog.ts        # CMS write (mutations)
src/actions/admin-portfolio.ts
src/actions/admin-notifications.ts
src/actions/admin-status.ts      # DNS provjere
src/lib/admin-hub-links.ts       # platforme, inbox, social placeholderi
src/components/admin/AdminShell.tsx   # bypass boot veil u AppChrome
src/components/admin/AdminLink.tsx    # interni linkovi bez next-intl routing
```

### Dashboard sekcije
1. **Sadržaj** — Blog (`blog_posts`), Portfolio (`portfolio_items`) — CRUD preko Supabase service role
2. **Inbox** — Zoho Mail + `/admin/inbox` (tablica `contacts`)
3. **Notifikacije** — upiti 7d, pretplatnici, DNS upozorenja, CMS status
4. **Platforme** — Cloudflare, Vercel, Supabase, Resend, Brevo, GitHub, live site
5. **Društvene mreže / freelance** — placeholderi u `src/lib/social-links.ts` (`pending: true`, `href: '#'`)

### Supabase tablice (CMS)
- `blog_posts` — title, slug, excerpt, content, language, is_published
- `portfolio_items` — title, tag, description, image_url, project_url, featured, active, sort_order, language
- `contacts` — kontakt forma
- `subscribers` — newsletter

### Portfolio (2026-07-10)
- **4 demo seed projekta deaktivirana** u bazi (`active=false`, reverzibilno) — Bodulica, Zeus Trading, Cosmic Blueprint, Protos Web
- Prazan grid prikazuje i18n `portfolio.empty` ("još nema projekata")
- **3D showcase** (`/portfolio-showcase`): `PROJECT_LINKS = []` u `src/components/three/showcase/constants.ts` → 8 praznih okvira dok nema stvarnih projekata
- Demo showcase stringovi (`project1..4_title/desc`) uklonjeni iz `src/messages/*.json`

### Javna navigacija (2026-07-10)
- 6 linkova: home, o-meni, proces, portfolio, usluge, blog
- **Kontakt** samo kao CTA gumb (nema duplog linka u redu)
- **Prisutnost** uklonjena iz navbara (bila pod-sekcija O meni)

## Tajne — mapa

| Secret | Gdje | Ne u |
|--------|------|------|
| `ADMIN_SECRET` | Vercel | Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (+ GitHub CI) | browser, client |
| `NEXT_PUBLIC_SUPABASE_*` | Vercel | — |
| `RESEND_API_KEY`, `BREVO_API_KEY` | Supabase Edge secrets | Vercel |
| `KEEP_ALIVE_SECRET` | Supabase + GitHub cron | — |

Detalji: `Protos-Web/docs/security.md`, `docs/cloudflare-dns.md`

## Poznati bugovi i fix-evi

### 0. Revert baze (2026-07-10)
**Kontekst:** korisnik zahtijevao full revert na `e4a264c` (6.7. večer). Sve nakon toga uklonjeno s `main` force pushom. **Vercel env varijable nisu u gitu** — posebno `ADMIN_SECRET` treba ručno uskladiti nakon reverta.

### 1. Stranica "ne radi" / jezici / klikovi ne rade (hydration)
**Uzrok:** React hydration mismatch (#418/#423/#425):
- `PageLoader` `useState(() => sessionStorage...)` — server vs client različit initial state
- Blog `toLocaleDateString` bez `timeZone: 'UTC'` — različit dan na serveru vs browseru  
**Fix (`4834a6b`):** deterministički `loading=true` + `useLayoutEffect(isBootComplete)`; blog datumi s `timeZone: 'UTC'`.  
**Test:** Playwright — ULAZ, cookie modal, language switch `/en` rade.

### 2. Boot veil removeChild greška
**Uzrok:** `removeBootSsrVeil()` radio `element.remove()` na React-owned `#boot-ssr-veil`.  
**Fix (`3bc309c`):** `display: none` umjesto remove; CSS `html.boot-complete #boot-ssr-veil { display: none }` već postoji.

### 3. Prazan admin panel (boot veil)
**Uzrok:** `#boot-ssr-veil` ostaje jer `AppChrome` za `/admin` preskače `PageLoader` ali ne zove `clearBootPending()` / `removeBootSsrVeil()`.  
**Fix:** `AdminShell` + admin rute u `AppChrome` potpuno izvan boot gatea, PageLoadera, CookieBannera.

### 4. Build: `Cannot access 'n' before initialization`
**Uzrok:** Server admin stranice + `next-intl` `Link`/`routing` u istom webpack chunku → circular TDZ.  
**Fix:**
- `AdminLink` (`<a>`) na server admin komponentama
- `useRouter` iz `next/navigation` u client admin formama
- Odvojiti CMS **read** (`lib/admin/*-queries.ts`) od **write** (`actions/admin-*.ts` s `'use server'`)
- Tipovi u `src/types/admin-*.ts` (ne iz server action fajlova u client komponente)
- `export const dynamic = 'force-dynamic'` u `admin/layout.tsx`

## Commits (admin rad, 2026-07-06)

| SHA | Opis |
|-----|------|
| `3817dcf` | Početni `/admin` + password auth |
| `5931c9a` | Boot veil, mystical background, security |
| `64c140d` | CMS hub — blog, portfolio, inbox, notifikacije |
| `6e081d5` | Routing circular import fix |

## Email + DNS (2026-07-06, večer — sve OK)

- **Receive:** Zoho `dario.admin@protosweb.eu` (Cloudflare MX)
- **Contact send:** Resend primary → Brevo fallback (`submit-form`)
- **Newsletter:** Brevo primary → Resend fallback (`subscribe`)
- **Resend:** domena **Verified** (eu-west-1); Cloudflare `send` MX+SPF + `resend._domainkey` DKIM
- **Brevo:** `brevo-code` (jedan), `brevo1/2._domainkey` CNAME, SPF u apex
- **DMARC:** `rua=mailto:dario.admin@protosweb.eu` ✅
- **security.txt:** `public/.well-known/security.txt` live
- **Docs:** `Protos-Web/docs/email-setup.md`, `docs/cloudflare-dns.md`, `docs/security.md`
- **Secrets:** Resend/Brevo API keys in Supabase only; `ADMIN_SECRET` + `SERVICE_ROLE` on Vercel (ADMIN_SECRET **nije** u Supabase)
- **Brevo:** use `xkeysib-` API key, NOT `xsmtpsib-` SMTP key
- **CF API:** IDE `cfat_` tokeni ne rade na `/dns_records`; DNS fix ručno ili Zone DNS Edit token + `scripts/fix-cloudflare-dns.sh`

## Commits (2026-07-06–07, nastavak)

| SHA | Opis |
|-----|------|
| `95426fc` | Email Zoho/Resend/Brevo routing |
| `e4f682c` | Brevo marketing admin buttons |
| `778db23` | security.txt, DNS fix script, docs |
| `bb88992` | WhatsApp/Instagram kontakt, DonateButton, roadmap batch start |
| `578f768` | Keep-alive JWT fix, admin auth redirect, nav cleanup, 115% scale |
| `d978d74` | Trigger keep-alive redeploy |
| `52878ee` | Dependabot: ignore major bumps |
| `7892a8c` | lucide-react minor bump |
| `bc88971` | docs: final Vercel env cleanup + remote verification |

## Finalni env audit (2026-07-07) — plan "Remote perfect safe" ✅

- **Obavezno:** Vercel (11 varijabli), Supabase, GitHub, Cloudflare DNS — kompletno
- **Vercel cleanup:** uklonjeni legacy mail/telegram/dupli Supabase integracijski ključevi
- **Live testovi:** kontakt 200, newsletter 200, admin 200, keep-alive success
- **Remote (2026-07-07 noć):** `main` = remote, CI zelen, Vercel READY, 0 otvorenih PR-ova
- **Dependabot:** major ignorirani; merge postcss + lucide minor
- **Opcionalno nije postavljeno:** `STRIPE_DONATION_*`, Turnstile, Upstash, `BREVO_NEWSLETTER_LIST_ID`
- **Supabase (ne dirati):** `STRIPE_WEBHOOK_SECRET`, `FIRECRAWL_API_KEY` — legacy, ne škode

## Deploy (2026-07-10 napomena)

Push na `main` → Vercel production. **Nakon svakog pusha provjeri** `vercel ls` / live URL — GitHub CI zelen ≠ automatski live. Webhook ponekad kasni → `vercel redeploy` ili prazan commit. **`ADMIN_SECRET` samo na Vercelu** — git revert ga ne vraća.

## Commits (incident recovery, 2026-07-10)

Revert baze: `e4a264c` (6.7.), zatim fixevi ispod. Trenutni `main` @ `3bc309c`.

| SHA | Opis |
|-----|------|
| `c5e891d` | Hero tagline svi jezici |
| `66af432` | Admin login trim + rate-limit samo fail |
| `92403e8` | Prazan showcase PROJECT_LINKS |
| `98772b2` | Demo showcase i18n stringovi out |
| `9861587` | Navbar: bez duplog Kontakt, bez Prisutnost |
| `4834a6b` | Hydration fix (PageLoader + blog UTC) |
| `3bc309c` | Boot veil hide not remove |

Sesija: `memory/sessions/2026-07-10-incident-recovery.md`

## Otvoreno (2026-07-10)

- [ ] `/admin` dashboard HTTP 500 (login OK, render puca)
- [ ] ProtosLogo framer-motion circle cx/cy warning (kozmetički)

## Ručni TODO (vlasnik)

- [x] Live test: kontakt forma + newsletter (2026-07-07)
- [x] Env audit — sve platforme (2026-07-07)
- [x] Keep-alive cron nakon no-verify-jwt deploya
- [ ] Cloudflare MFA (My Profile → 2FA)
- [ ] Upisati prave URL-ove u `src/lib/social-links.ts` (Instagram itd.)
- [ ] Opcionalno: donacije, Turnstile, Upstash, Brevo list ID

## Korisnik

- GitHub: `@ProtosEschatos`
- Preferira hrvatski, minimalan ručni rad, automatizacija gdje moguće
- Admin email: `dario.admin@protosweb.eu`
- **Ne prikazivati placeholder/demo sadržaj** (portfolio, lažni projekti) dok nije stvarno spremno
- **Push mora završiti live na Vercelu** — ne samo GitHub
- Kad kaže "stranica ne radi" — testirati Playwright/browser, ne samo curl
- Jako osjetljiv na regresije nakon promjena; preferira revert na poznato dobro stanje
