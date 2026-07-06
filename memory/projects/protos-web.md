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
- Lozinka = env `ADMIN_SECRET` (**samo Vercel**, ne Supabase)
- HttpOnly cookie `protos-admin-session` (HMAC SHA-256)
- Middleware štiti `/admin/*` osim `/admin/login`
- Rate limit: 5 pokušaja / 15 min na `/api/admin/login`
- Nav link **PANEL** vidljiv samo kad je session aktivan (`AdminNavLink` + `/api/admin/session`)

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

### 1. Prazan admin panel (boot veil)
**Uzrok:** `#boot-ssr-veil` ostaje jer `AppChrome` za `/admin` preskače `PageLoader` ali ne zove `clearBootPending()` / `removeBootSsrVeil()`.  
**Fix:** `AdminShell` + admin rute u `AppChrome` potpuno izvan boot gatea, PageLoadera, CookieBannera.

### 2. Build: `Cannot access 'n' before initialization`
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

## Ručni TODO (vlasnik)

- [ ] Provjeriti `SUPABASE_SERVICE_ROLE_KEY` na Vercelu (CMS status na dashboardu)
- [ ] Obrisati `ADMIN_SECRET` iz Supabase Edge secrets ako još postoji
- [ ] Upisati prave URL-ove u `src/lib/social-links.ts`
- [ ] 2FA na Vercel, GitHub, Supabase, Cloudflare, Zoho

## Korisnik

- GitHub: `@ProtosEschatos`
- Preferira hrvatski, minimalan ručni rad, automatizacija gdje moguće
- Admin email: `dario.admin@protosweb.eu`
