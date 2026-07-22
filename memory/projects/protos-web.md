---
id: protos-web
name: Protos-Web
site: https://www.protosweb.eu
repo: https://github.com/ProtosEschatos/Protos-Web
status: active
last_updated: 2026-07-22
---

# Protos-Web

**Repo:** [ProtosEschatos/Protos-Web](https://github.com/ProtosEschatos/Protos-Web)  
**Live:** https://www.protosweb.eu  
**Domena:** `protosweb.eu` (Cloudflare DNS, Vercel apex + `www`)  
**Kontakt email:** `dario.admin@protosweb.eu` (Zoho inbox + Resend/Brevo slanje)

## Stack (stvarni — produkcija)

| Sloj | Tehnologija |
|------|-------------|
| Framework | **Next.js 16** App Router |
| UI | **React 19** |
| Jezik | TypeScript strict |
| Stil | Tailwind v3 + CSS varijable (`--primary`, `--dark`, …) |
| i18n | `next-intl` — `hr` (default), `en`, `de`, `it`, `es`, `sr` |
| Baza | **Supabase** PostgreSQL (`laqnnzavwbojntfiqmxj`) |
| Deploy | **Vercel** (auto iz `main`) |
| Email | Resend (transakcijski), Brevo (newsletter), Zoho Mail (inbox) |
| Plaćanja | **Stripe** Checkout Sessions (Session-based donations, EUR) |
| 3D | React Three Fiber + drei (admin konfigurator + naslovnica pozadina) |
| AI cascade | GPT-OSS-120B → DeepSeek → Gemini (`src/lib/ai/providers.ts`) |
| Ruta "o nama" (hr) | `/o-nama` (bio `/o-meni` do 2026-07-20; 308 redirect u `next.config.js`) |

> `rules/stack.md` opisuje **preferirani** stack za buduće greenfield klijente
> (Nuxt 4). Protos-Web je i ostaje Next.js 16 dok user eksplicitno ne zatraži
> migraciju.

## Admin panel (`/admin`)

Privatna kontrolna ploča na **glavnoj domeni** (ne subdomena).

### Auth
- Lozinka = env `ADMIN_SECRET` (**samo Vercel**, ne Supabase) — **env se NE vraća git revertom**
- HttpOnly cookie `protos-admin-session` (HMAC SHA-256)
- Middleware štiti `/admin/*` osim `/admin/login`
- Rate limit: **samo neuspjeli** pokušaji / 15 min na `/api/admin/login` (ne broji uspješne)
- `.trim()` na `ADMIN_SECRET` i unesenu lozinku pri usporedbi
- **Nema javnog nav linka** — `AdminNavLink` samo kad je session aktivan (skriveno za anon)

### Ključne putanje (post-refaktor `8f600e8`)
```
src/app/[locale]/admin/              # admin rute (layout: force-dynamic)
src/app/[locale]/admin/stranice/     # statičke stranice (o-meni, proces, usluge)
src/app/api/admin/                   # login, logout, session, ai
src/lib/auth/                        # admin-auth, admin-auth-shared, require-admin, rate-limit
src/lib/queries/admin/               # blog.ts, portfolio.ts, memory.ts (CMS read)
src/lib/config/                      # site.ts, seo.ts, admin-links.ts, team-profiles.ts, tech-stacks.ts
src/lib/routes/main-nav.ts           # javni navbar (jedini izvor istine)
src/actions/admin-*.ts               # CMS write (mutations)
src/components/features/admin/       # AdminShell, AdminSidebar, AdminLink, panels, forms
src/components/features/home/sections/  # Hero, Services, Process, DualStacksSection, OnlinePresence, …
src/lib/agent-memory.ts              # GitHub fetch Protos-Agent memorije
src/lib/ai/providers.ts              # DeepSeek + opcionalno Gemini
```

### Dashboard sekcije
1. **Sadržaj** — Blog (`blog_posts`), Portfolio (`portfolio_items`) — CRUD preko Supabase service role
2. **Inbox** — `/admin/inbox`: Zoho IMAP (`dario.admin@protosweb.eu`) + Martina kad `MARTINA_IMAP_*` (Gmail studio **uklonjen** PR #54–#55) + kontakt forma (`contacts`)
3. **Notifikacije** — upiti 7d, pretplatnici, DNS upozorenja, CMS status
4. **Platforme** — Cloudflare, Vercel, Supabase, Resend, Brevo, GitHub, live site
5. **Društvene mreže / freelance** — `src/lib/config/team-profiles.ts`; re-export `src/lib/config/social-links.ts` (`pending: true`, `href: '#'` dok nema URL)

### Supabase tablice (CMS)
- `blog_posts` — title, slug, excerpt, content, language, is_published, **`author_slug`** (`dario`|`martina`|`both`, default `dario`)
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
| `DEEPSEEK_API_KEY` | Vercel (Production + Preview) | browser |
| `GITHUB_TOKEN` | Vercel (Production + Preview) | browser — **obavezno** ako je Protos-Agent privatan |
| `GEMINI_API_KEY` | Vercel (opcionalno) | browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (+ GitHub CI) | browser, client |
| `NEXT_PUBLIC_SUPABASE_*` | Vercel | — |
| `RESEND_API_KEY`, `BREVO_API_KEY` | Supabase Edge secrets | Vercel |
| `KEEP_ALIVE_SECRET` | Supabase + GitHub cron | — |

**Zoho IMAP:** `ZOHO_IMAP_*` na Vercelu — čita inbox u `/admin/inbox`.  
**Gmail studio:** **REMOVED** 2026-07-22 (PR #54–#55) — ne vraćati; obriši leftover `GMAIL_STUDIO_*` s Vercela ručno. Learning: `protos-web-gmail-studio-removed`.  
**Martina IMAP:** `MARTINA_IMAP_*` (kad `martina.admin@protosweb.eu` bude live).  
**Stripe donacije (LIVE 2026-07-11):** vidi gore.  
**Admin UI (Console v3.0, `3c039ed`):** referenca `ProtosEschatos/Google-AI-Studio-Github-Connect`; `src/styles/admin-console.css`; `docs/admin-console.md`.

Detalji: `Protos-Web/docs/security.md`, `docs/cloudflare-dns.md`

## Poznati bugovi i fix-evi

### 0c. Konfigurator white-screen + Sentry rip-out (2026-07-22) — FIXED
**Simptom:** `/admin/konfigurator` bijeli ekran; poslije PR #45 cijeli admin locked/500.  
**Fix lanac:** PR #47 (Sentry out + boundaries), #48–#49 (anon session RPC + ActivityBadge), #50 (`ADMIN_ASSET_CATEGORIES` out of `'use server'`).  
**Status:** `/en/admin/konfigurator` → 200 (verified).  
**Ops TODO:** osvježi `SUPABASE_SERVICE_ROLE_KEY` na Vercelu (PostgREST još 401 — writes/createSession).  
**Sesija:** `memory/sessions/2026-07-22-06-sentry-rip-out-and-konfigurator-verify.md`

### 0b. Admin Assets + 3D Konfigurator crash (2026-07-20 večer → fix PR #41)
**Simptom:** `/admin/konfigurator` → bijeli ekran / error boundary. Assets također “ne rade”.  
**Root cause:** App Router stablo nije imalo nijedan `error.tsx` ni `global-error.tsx`; svaki client throw (R3F Canvas, HDRI, `useGLTF`, Sketchfab fetch) propuhao je do generic Next fallbacka. Obje rute dijelile `useSceneStore` preko `AssetLibrary`.  
**Fix ([27c5f5e](https://github.com/ProtosEschatos/Protos-Web/commit/27c5f5e), [PR #41](https://github.com/ProtosEschatos/Protos-Web/pull/41)):**
- Novi `src/components/ui/ClientErrorBoundary.tsx` (reusable class boundary).
- Nova 3 Next.js segment boundary-a: `app/[locale]/admin/error.tsx`, `app/[locale]/error.tsx`, `app/global-error.tsx`.
- `ConfiguratorManager`, `AssetsWorkspace` i sub-paneli (SceneChatPanel, ConfiguratorControls, svaki tab) wrappani u vlastite `ClientErrorBoundary`.
- `ConfiguratorScene` — `SceneErrorBoundary` proširen na `<Primitive />`, `<ContactShadows>`, `<OrbitControls>`.  
**Status:** PR otvoren, čeka merge → live smoke.  
**Detalji:** `memory/sessions/2026-07-20-09-configurator-assets-crash.md` (dijagnoza), `2026-07-20-10-configurator-assets-crash-fix.md` (implementacija), `learnings/protos-web-app-router-error-boundaries.md` (pattern).

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

### 3. Prazan / blokiran admin (boot veil)
**Uzrok:** `#boot-ssr-veil` (cookie loader) prekriva `/admin` dok korisnik nije prihvatio kolačiće.  
**Fix (`0ba7201`):** `BOOT_GATE_INIT_SCRIPT` preskače admin rute; `AppChrome` `useLayoutEffect`.

### 3b. Admin spor / trzaje scroll
**Uzrok:** `<a>` full reload + Lenis smooth scroll + Three.js pozadina.  
**Fix (`0871c0e`, `3c039ed`):** `AdminLink` → Next.js `Link`; Lenis off na adminu; CSS-only bg; Console v3.0 UI ([Google-AI-Studio-Github-Connect](https://github.com/ProtosEschatos/Google-AI-Studio-Github-Connect)). Docs: `Protos-Web/docs/admin-console.md`.

### 4. Build: `Cannot access 'i' before initialization` (admin/stranice)
**Uzrok:** `AdminStaticPagePanel` (server) + `Link` iz `@/routing` u istom webpack chunku → circular TDZ pri `npm run build`.  
**Fix (`b12a0f0`):** `AdminStaticPagePanel` označen `'use client'`.

### 5. Build: `Cannot access 'n' before initialization` (stariji admin)
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

## SEO (2026-07-11) — „brutalnost” faza 1–3 ✅

**Commit:** `5d062f9` — live na https://www.protosweb.eu

### Tehnički
- `public/llms.txt` — AI crawler guidance (studio, URL-ovi, jezici, kontakt, autori)
- `src/app/robots.ts` — GPTBot, ClaudeBot, PerplexityBot, Google-Extended; disallow `/admin`
- `src/app/sitemap.ts` — `lastModified`, priority (home 1.0, usluge/kontakt 0.9, legal 0.3, showcase 0.4)
- `localePrefix: 'as-needed'` — **zadržano** (HR root, hreflang ispravan)

### Schema (`src/lib/creator-seo.ts` + `LocaleCreatorSeo.tsx`)
- `@graph`: WebSite, Organization, Person×2 (Dario, Martina), CreativeWork, **ProfessionalService**
- Martina: nevidljiva u UI osim `/o-meni`; vidljiva u `<head>` + llms.txt
- `/usluge`: FAQPage JSON-LD + `FaqSection.tsx` (5 jezika, HTML accordion)

### Metadata + crawl
- Home description obogaćen (hr/en/de/it/es)
- Twitter `creator`: `@protos_eschatos`
- Blog `generateStaticParams` — SSG za slugove
- `loading="lazy"` na portfolio/showcase slikama

### Legal + consent (isti deploy)
- `SiteConsentModal` — obavezno prihvaćanje uvjeta prije ulaska (boot-gate v11)
- Legal copy u `src/messages/_legal/*.json` (5 jezika)
- Obrt: Protos Web Mark23, OIB 23732814520

### Live verify (2026-07-11)
- `https://www.protosweb.eu/llms.txt` → 200
- `https://www.protosweb.eu/robots.txt` → 200 (AI bot rules)
- `https://www.protosweb.eu/sitemap.xml` → 200
- Apex `protosweb.eu` → 307 → `www.protosweb.eu` ✅

### Faza 2 (2026-07-11)
**Commit:** nakon `5d062f9` — breadcrumbs, page schema, metadata
- `BreadcrumbList` na `/usluge`, `/kontakt`, `/portfolio`
- `WebPage` schema na usluge, `ContactPage` na kontakt
- `ItemList` of `CreativeWork` na portfolio kad ima aktivnih projekata
- `WebSite.potentialAction` ContactAction u creator graph
- FAQ accordion CLS fix (CSS grid umjesto height animacije)
- Obogaćeni metadata (contact, process, portfolio, blog) — 5 jezika

### Otvoreno (SEO faza 2b)
- Portfolio `[slug]` rute kad `portfolio_items` ponovno imaju aktivne projekte
- Off-page: GSC/Bing resubmit sitemap, Google Business, Clutch — ručno
- Real social/freelance URL-ovi u `team-profiles.ts` kad korisnik pošalje

**Learning:** `memory/learnings/protos-web-seo-patterns.md`

## Branding + entity SEO (2026-07-11) — plan faze 0–5 ✅

**Commit:** `1baa74d` — live na https://protosweb.eu

### Tim & javni stackovi
- Uloge (5 jezika): Dario = AI inženjer & Full Stack Cross-Web; Martina = Frontend/shop UI dizajnerica
- `src/lib/tech-stacks.ts` — **javno** samo jezici/framework; infra (Supabase/Stripe/Cloudflare) **ne u UI**
- `DualStacksSection` na `/o-meni` — Protos Web vs Bodulica vanilla (bez live shop linka)
- Bodulica repo (`sandboxes/Bodulica`) — samo opis na Protos-Webu, repo nije diran

### Social struktura (`team-profiles.ts`)
- 3 grupe u `OnlinePresence`: **Studio** | **Dario** | **Martina** + freelance platforme
- Instagram live: studio/Dario → `protos_eschatos`, Martina → `everybodycries`
- TikTok, GoLance, Upwork itd. → `#` + `pending: true`

### SEO entiteti
- Fragment IDs: `/o-meni#dario-imsirovic`, `/o-meni#martina-markulin`
- `AboutPage` JSON-LD + OG `/api/og?type=about`
- Root metadata: oba autora, keywords `protos`, `protosweb`, ASCII `Imsirovic`
- `creator-seo.ts`: Person `url` s locale fragmentima, `sameAs` samo live URL-ovi
- Blog: `author_slug` migracija (remote ✅), byline, per-author JSON-LD, index `Blog`+`ItemList`
- `llms.txt` ažuriran (tim, dva stacka)

### SEO cilj (korisnik)
- **Brand:** #1 za `Protos Web`, `protosweb`, `Protos Web Zagreb`
- **Osobe:** top za `Dario Imsirović` / `Martina Markulin` + uloge
- **`protos` solo:** generička riječ — entity layer postavljen, treba off-page + topical authority + vrijeme

### GitHub hardening
- Branch protection `main`: required **CI**
- `security.yml`: critical audit bez `continue-on-error`
- README: `SUPABASE_SERVICE_ROLE_KEY` u GitHub secrets tablici

### Commits (2026-07-11)
| SHA | Opis |
|-----|------|
| `7e8fea3` | GSC verification meta |
| `cd657c4` | Odvojeni Instagram linkovi Dario/Martina |
| `1baa74d` | Branding plan: stackovi, dual showcase, SEO entities, blog authorship |

Sesija: `memory/sessions/2026-07-11-branding-seo-stack.md`

## Refaktor + branding + deploy audit (2026-07-11) ✅

**Commits:** `8f600e8` (refaktor A–F), `b12a0f0` (docs + O nama branding + build fix)

### Refaktor strukture (`8f600e8`)
- `admin/pages/` → `admin/stranice/`
- `components/sections/` → `components/features/home/sections/`
- `components/admin/` → `components/features/admin/`
- `lib/admin/*` → `lib/queries/admin/`, `lib/config/`, `lib/auth/`
- `main-nav-routes.ts` → `lib/routes/main-nav.ts`
- Obrisan mrtvi `AdminActivityFeed`

### O nama branding (`b12a0f0`)
- Hero: **„Protos Web — Full Stack Duo iz Zagreba.”** (5 jezika)
- OG `/api/og?type=about` ažuriran

### Full stack audit
- Sav kod (edge fn, migracije, workflows, vercel.json, cloudflare docs) **commitan na GitHub**
- Vercel env: `DEEPSEEK_API_KEY`, `GITHUB_TOKEN`, `ADMIN_SECRET` — **već postavljeni** (Dashboard)
- Nema Cloudflare Worker koda u repou
- Live smoke test: `/o-meni`, `/admin/*`, API rute — OK (2026-07-11)

Sesija: `memory/sessions/2026-07-11-refactor-branding-deploy.md`

### Commits (2026-07-11, nastavak)
| SHA | Opis |
|-----|------|
| `3452b1a` | Admin sidebar = javni navbar + Sustav sekcija |
| `8f600e8` | Refaktor lib/features/queries, admin/stranice |
| `b12a0f0` | Docs sync, Full Stack Duo branding, AdminStaticPagePanel client fix |

### Sljedeće (sutra+)
- [ ] GSC/Bing resubmit `https://protosweb.eu/sitemap.xml`
- [ ] Korisnik pošalje URL-ove → update `team-profiles.ts` (jedan commit aktivira sve)
- [ ] Portfolio projekti u `portfolio_items` + admin
- [ ] Blog postovi s `author_slug` po autoru (topical authority)
- [ ] IndexNow za Bing (opcionalno)
- [ ] Ne commitati `public/design/`

## Deploy (2026-07-11)

Push na `main` → Vercel production. **Nakon svakog pusha provjeri** live URL — GitHub CI zelen ≠ automatski live. Branch protection na `main` zahtijeva CI check (admin push može bypass). **`ADMIN_SECRET` samo na Vercelu** — git revert ga ne vraća.

Trenutni `main` @ **`b12a0f0`** — live na https://www.protosweb.eu (Vercel READY).

## Commits (incident recovery, 2026-07-10)

Revert baze: `e4a264c` (6.7.), zatim fixevi ispod. Trenutni `main` @ `5d062f9`.

| SHA | Opis |
|-----|------|
| `c5e891d` | Hero tagline svi jezici |
| `66af432` | Admin login trim + rate-limit samo fail |
| `92403e8` | Prazan showcase PROJECT_LINKS |
| `98772b2` | Demo showcase i18n stringovi out |
| `9861587` | Navbar: bez duplog Kontakt, bez Prisutnost |
| `4834a6b` | Hydration fix (PageLoader + blog UTC) |
| `3bc309c` | Boot veil hide not remove |
| `5d062f9` | Legal consent, creator SEO graph, llms.txt, FAQ, sitemap/robots, blog SSG |
| `e373d1c` | Breadcrumbs, WebPage/ContactPage schema, portfolio ItemList, metadata enrich |

Sesija: `memory/sessions/2026-07-10-incident-recovery.md`

## Otvoreno (2026-07-11)

- [ ] ProtosLogo framer-motion circle cx/cy warning (kozmetički)

## Ručni TODO (vlasnik)

- [x] Live test: kontakt forma + newsletter (2026-07-07)
- [x] Env audit — sve platforme (2026-07-07)
- [x] Keep-alive cron nakon no-verify-jwt deploya
- [x] Stripe donacije LIVE (2026-07-11, `13a6083`) — Checkout + webhook + backup confirm
- [ ] Cloudflare MFA (My Profile → 2FA)
- [ ] Upisati prave URL-ove u `src/lib/config/team-profiles.ts` (TikTok, GoLance, Upwork, studio Facebook…)
- [ ] Opcionalno: Turnstile, Upstash, Brevo list ID

## Brand mark I'M (2026-07-22)

**Nalog (tvrdo):** slova **I ’ M** + efekti s Desktop referenci — **ne redizajn**.
- **I** = cyan glow + particle swirl (M-ref)
- **M** = metallic chrome + light-burst (R-ref)
- Putanje: `src/components/ui/ImLogo.tsx`, `public/brand/`, favicon SVG/PNG
- Arhitektura: brand UI → **Vercel `public/`**; CMS tekst → Supabase; veliki upload → Storage
- Animacija u React/Framer (`ImLogo`); CSS u SVG-as-`<img>` **ne radi**
- Google SERP favicon = cache lag; PNG 48px postoji — ne thrashati zbog SERP-a
- PR lanac #52–#61 = greške (kriva slova / improv); **#62 merged** (effects only + text glyphs)
- Learnings: `protos-web-brand-mark-effects-not-redesign`, `protos-web-brand-assets-vercel-public`
- Sesija: `memory/sessions/2026-07-22-07-im-logo-gmail-memory-dump.md`

## Korisnik

- GitHub: `@ProtosEschatos`
- Preferira hrvatski, minimalan ručni rad, automatizacija gdje moguće
- Admin email: `dario.admin@protosweb.eu`
- **Ne prikazivati placeholder/demo sadržaj** (portfolio, lažni projekti) dok nije stvarno spremno
- **Push mora završiti live na Vercelu** — ne samo GitHub
- **SEO ambicija:** #1 za `protos` na Googleu — entity layer postavljen; off-page i vrijeme ključni
- Jako osjetljiv na regresije nakon promjena; preferira revert na poznato dobro stanje
- **Ne izmišljati UI / logo** — slijedi reference i eksplicitan nalog; improvizacija = fail
- Ship preko **PR + merge**; `origin/main` = SoT; ne `vercel env pull` bez odobrenja
- Gmail IMAP **zauvijek van** dok eksplicitno ne zatraži povratak

## 2026-07-17 → 19 (historijski) — Vue eksperiment i povratak

**Kratka priča:** kroz 3 dana isprobana je puna Vue/Vite verzija Protos-Web-a s CF Pages deploy-em (funkcijama, cache purge middleware-om, DNS switch-om s Vercela). Konačna odluka **20. srpnja: napušteno, glavni site ostaje Next.js na Vercelu**. Sve buduće rade **samo na Next.js verziji** iz [`ProtosEschatos/Protos-Web`](https://github.com/ProtosEschatos/Protos-Web) glavne grane.

Detalji tog perioda: `sessions/2026-07-17-*.md`, `sessions/2026-07-18-*.md`, `sessions/2026-07-19-*.md`.

**Naslijeđeni patterni koje treba držati u Next verziji:**
- **GitHub `origin/main` = source of truth** — lokalni workspace nije autoritet.
  Vidi learning `github-remote-main-source-of-truth.md`.
- **Migration lock**: MCP `apply_migration` → odmah `list_migrations` → lokalni
  SQL fajl **MORA** nositi **isti** version stamp kao remote prije commit/push.
  (Prekršeno 2026-07-22: lokalni `42048` vs remote `42111` → Preview fail → PR #51.)
- **Placeholder secrets ban**: `scripts/check-env.mjs` mora fail-at ako env sadrži `placeholder`.
- **Migration duplication**: user je jako osjetljiv na duplicirane migracije (svjedok prošlih incidenata). Uvijek provjeriti `list_migrations` prije `apply_migration`.
- **Rotacija tajni**: u transkriptima iz tog perioda pojavljivale su se doslovne vrijednosti CF API token-a, R2 keys, admin lozinke i Supabase anon key-a. **Preporuka:** rotirati sve prije daljnjeg rada (novi CF token, novi R2 keys, novi Supabase anon key, nova admin lozinka).

## 2026-07-20 — Next.js restore + Ultimate admin panel

**Trenutni HEAD:** `2e7480d` (priručnik, 2026-07-20 večer). Raniji landmark: Ultimate panel + restore (vidi FAZA 1–5 ispod).

### FAZA 1-5 (Ultimate admin panel)

Cijeli plan u sesiji `sessions/2026-07-20-nextjs-restore-admin-ultimate-panel.md`. Kratak sažetak:

| Faza | Isporuka | Ključni fajlovi |
|---|---|---|
| 1 | Toast infrastruktura | `src/lib/stores/toast-store.ts`, `src/components/ui/ToastProvider.tsx` |
| 2 | Encrypted API keys vault (AES-256-GCM) | `src/lib/security/api-keys-crypto.ts`, `admin_api_keys` DB tablica, `/admin/kljucevi` |
| 3 | Automation webhooks (multi-event, SSRF-protected) | `src/lib/queries/admin/automations.ts`, `automation_webhooks` DB tablica, `/admin/automations` |
| 4 | 3D Configurator (R3F + Sketchfab) | `src/lib/stores/scene-store.ts`, `src/lib/config/sketchfab.ts`, `/admin/konfigurator` |
| 5 | Dashboard refresh + real stats | `src/lib/queries/admin/panel-stats.ts`, `/admin` |

### Nove DB tablice + migracije

- `admin_api_keys` (migracija `20260720062823_admin_api_keys.sql`)
- `automation_webhooks` (migracija `20260720063416_automation_webhooks.sql`)
- Oba imaju RLS `service_role only`
- Podaci šifrirani AES-256-GCM master key-om = env `ADMIN_KEYS_ENCRYPTION_KEY` (Vercel Production+Preview+Development)

### Nove admin rute

- `/admin/kljucevi` — vault
- `/admin/automations` — webhooks
- `/admin/konfigurator` — 3D configurator

### Nove tajne dodane u Vercel (produkcija)

- `ADMIN_KEYS_ENCRYPTION_KEY` (base64 32 bytes — obavezno)
- `SKETCHFAB_API_TOKEN` (opcionalno; fallback = vault)
- `CRON_SECRET` (sinkroniziran s GitHub Secrets)
- `KEEP_ALIVE_SECRET` (Supabase Edge + GitHub Actions cron)

### Nove tajne u Supabase Edge

- `STRIPE_WEBHOOK_SECRET` (whsec_… live) — verificira signature; testirano 400 na test bez sig
- `STRIPE_SECRET_KEY` (sk_live_…)

### Deploy incidenti riješeni

1. **Redirect loop `www` ↔ apex** — uklonjen `async redirects()` iz `next.config.js` (Vercel domain settings već rješava)
2. **Admin Inbox Sync 308 loop** — `curl -L` + kanonski `www.` host
3. **Supabase migration drift** — 3 drift migracije povučene s remote-a
4. **TypeScript strict fixes** za nove tablice — regen `database.types.ts` + explicit casts
5. **i18n-sync workflow uklonjen** — DeepSeek nije za prijevode

### Male dokumentacijske rupe u `.env.example`

Već u produkciji, ali nisu komentirane u templateu:
- `CRON_SECRET`
- `KEEP_ALIVE_SECRET`
- `SKETCHFAB_API_TOKEN`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (novi Supabase naming)

Backfill trivijalan, ali nije kritičan.

### Zadnji audit (2026-07-20)

- Live 200 na svih 7 lokala (`hr/en/de/it/es/sr/apex`)
- 14/14 admin ruta = 308 na login (auth radi)
- Kontakt/Newsletter/Donate API = 200
- Stripe webhook = 400 na test (znači secret setan)
- CI: sve zelene (ping, sync, Cloudflare DNS, Supabase, Build, Audit, Vercel)
- Sadržaj u DB: 81 blog, 7 portfolio, 20 subscribera, 14 kontakata

### Večer 2026-07-20 — publish, priručnik, OPEN BUG

**Trenutni HEAD (remote `main`):** `2e7480d` (priručnik). Prije toga: `39bc37a` publish+audit, `b17a8ab` JSON-LD XSS + PostCSS CVE.

Nove rute / tablice (sve pushano):
- `/admin/publish` — Bluesky, Mastodon, Threads, FB, IG, Ghost, Hashnode, Dev.to
- `/admin/audit` — `audit_events` pregled
- `/admin/prirucnik` — living README (stack, servisi, folderi, 12 pravila)
- `/admin/assets` — `admin_assets` + bucket `admin-uploads`
- `published_posts` tablica (`20260720171515`)

**Konfigurator + Assets crash — MERGED (PR #41, [7d1b51e](https://github.com/ProtosEschatos/Protos-Web/commit/7d1b51e)):**
- Root cause: nula `error.tsx`/`global-error.tsx` u App Router-u → svaki client throw = bijeli ekran
- Fix: `ClientErrorBoundary` reusable + 3 segment boundary-a (admin/locale/global) + per-panel wrap-ovi u ConfiguratorManager, AssetsWorkspace i sub-tabovima; `SceneErrorBoundary` proširen u ConfiguratorScene
- Sesija: `memory/sessions/2026-07-20-10-configurator-assets-crash-fix.md`
- Learning: `memory/learnings/protos-web-app-router-error-boundaries.md`

**Sentry — REMOVED 2026-07-22 (PR #47, `5d046b6`):**
- Integracija u potpunosti uklonjena (user request). Sekcije ispod su historija.
- Close-out: `memory/sessions/2026-07-22-06-sentry-rip-out-and-konfigurator-verify.md`
- Obriši dead `SENTRY_*` / `NEXT_PUBLIC_SENTRY_DSN` iz Vercel dashboarda kad hoćeš.

**Sentry adoption — MERGED pa UKLONJEN (PR #42 historija):**
- `@sentry/nextjs@10.67.0` wired end-to-end (server + edge + client + instrumentation + withSentryConfig)
- ClientErrorBoundary sad zove `Sentry.captureException` s tagovima; sve tri `error.tsx` također
- Session Replay on-error-only (quota-friendly), source maps ON (`widenClientFileUpload`, `hideSourceMaps`), `tunnelRoute: '/monitoring'` (ad-blocker + CSP friendly)
- Smoke test route: `/api/admin/sentry-test` (admin-guarded, `?mode=capture|throw`)
- Postojeći `src/lib/integrations/sentry.ts` status widget netaknut — počne raditi čim env vars stignu
- Sesija: `memory/sessions/2026-07-20-11-sentry-adoption.md`
- Learning: `memory/learnings/protos-web-sentry-app-router-wiring.md`

**Sentry env wire-up + DSN konsolidacija (2026-07-20 večer, sesija 12) — historija:**
- `NEXT_PUBLIC_SENTRY_DSN` postavljen na Vercelu (Production + Preview kao **jedan** Encrypted entry), verified u client bundleu (`/_next/static/chunks/0wts0fb01sd_r.js`) s tunnel route + Replay markerima
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG_SLUG`, `SENTRY_PROJECT_SLUG` bili već pre-set 12h ranije u Prod + Preview
- Dev DSN uklonjen — lokalni `npm run dev` ne šalje eventove (bez šuma iz HMR-a)
- Deploy `bpyxl96pm-…` Ready 2026-07-20 23:xx, Sentry sad enabled u produkciji
- Nauk (CLI ne zna multi-target single-call, workaround preko REST API-ja): `memory/learnings/vercel-env-multi-target-consolidation.md`
- Sesija: `memory/sessions/2026-07-20-12-sentry-env-wireup-consolidation.md`

**Sentry hardening — PR #43 merged pa UKLONJEN s #47:**
- Historija ignoreErrors / Replay canvas block — više nije u kodu
- Sesija: `memory/sessions/2026-07-20-13-sentry-hardening-pr-43.md`

### Ostalo otvoreno (2026-07-22+)

- [ ] **Osvježi `SUPABASE_SERVICE_ROLE_KEY` na Vercelu** (PostgREST 401 — createSession/revoke/writes)
- [ ] Obriši dead `SENTRY_*` env vars s Vercela
- [ ] Obriši leftover `GMAIL_STUDIO_*` s Vercela (kod već clean)
- [ ] I'M logo: ako user nije zadovoljan liveom — **samo** pojačaj efekte / blizinu referenci, **bez** novih slova (sesija 07)
- [ ] Showcase joystick (#58) — verified u PR; re-check mobile ako treba
- [ ] SR blogovi + `localePrefix: 'never'` — **STOP** dok user ponovno ne zatraži (0 `sr` postova u DB kad prekinuto)
- [ ] Locale drift — većim dijelom backfillan; re-check ako treba
- [ ] `.env.example` backfill s novijim env vars
- [ ] Supabase advisor WARN-ovi (pg_net, public bucket listing, intentional anon SECURITY DEFINER RPCs)
- [ ] Rotacija tajni iz historijskih transkripata (samo ako user zatraži — ne smarati)
