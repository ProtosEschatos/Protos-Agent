# Sesija: Refaktor, branding, full stack audit (2026-07-11)

**Protos-Web `main`:** `b12a0f0` (synced GitHub + Vercel READY)  
**Prethodni:** `8f600e8` (refaktor A–F), `3452b1a` (admin sidebar)

---

## Full stack checklist — što je gdje

### GitHub (Protos-Web repo) — SVE commitano

| Kategorija | Putanja / artefakt | Status |
|----------|-------------------|--------|
| Next.js App Router | `src/app/`, `src/components/features/`, `src/lib/` | ✅ u gitu |
| API rute (Vercel Functions) | `src/app/api/` — contact, subscribe, blog, og, admin/* | ✅ u gitu |
| Supabase edge funkcije | `supabase/functions/` — keep-alive, submit-form, subscribe, content | ✅ 4 fn u gitu |
| DB migracije | `supabase/migrations/` — 7 migracija | ✅ u gitu |
| GitHub Actions | `.github/workflows/` — CI, security, keep-alive, edge deploy, showcase upload | ✅ CI zelen na `b12a0f0` |
| Vercel config | `vercel.json` | ✅ u gitu |
| Cloudflare | `docs/cloudflare-dns.md`, `scripts/fix-cloudflare-dns.sh` | ✅ docs + skripta (nema CF Worker koda) |
| Lokalni docs | AGENTS.md, README.md, PROJECT-MEMORY.md, docs/security.md, .env.example | ✅ `b12a0f0` |

**Namjerno izvan gita (ispravno):**
- Vercel env vars — `ADMIN_SECRET`, `DEEPSEEK_API_KEY`, `GITHUB_TOKEN`, `NEXT_PUBLIC_*` (potvrđeno u Vercel Dashboardu, Production + Preview)
- Supabase Edge secrets — `RESEND_API_KEY`, `BREVO_API_KEY`, `KEEP_ALIVE_SECRET`, …
- Cloudflare DNS zapisi — samo Cloudflare UI
- `public/design/` — untracked po dogovoru

**Nema zasebnog Cloudflare Workers projekta.** „Workeri” = Vercel Functions (Next.js API) + Supabase Edge Functions.

### Vercel (produkcija)

| Stavka | Status |
|--------|--------|
| Auto deploy `main` → https://www.protosweb.eu | ✅ READY |
| `DEEPSEEK_API_KEY` | ✅ Production + Preview |
| `GITHUB_TOKEN` | ✅ Production + Preview (privatan Protos-Agent repo) |
| `ADMIN_SECRET` | ✅ Production (+ Development) |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | ✅ Production |
| `vercel.json` | Iz gita |

### Supabase (`laqnnzavwbojntfiqmxj`)

| Stavka | Status |
|--------|--------|
| Edge fn kod u gitu | ✅ 4 funkcije |
| Deploy workflow | Trigger na `supabase/functions/**` push |
| Keep-alive cron | ✅ GitHub Actions svakih 10 min, zadnji success |
| Migracije u gitu | ✅ uklj. `author_slug` |
| Webhook contacts → submit-form | Dashboard konfiguracija (dokumentirano u `supabase/functions/README.md`) |
| Edge secrets | Dashboard only (Resend, Brevo, KEEP_ALIVE, …) |

### Cloudflare

| Stavka | Status |
|--------|--------|
| DNS MX Zoho, Resend send, Brevo, DMARC | ✅ (2026-07-06 verify) |
| Apex grey cloud → Vercel | ✅ |
| Worker kod | Nema — samo DNS |

### GitHub Actions secrets (izvan gita)

- `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` — edge deploy
- `SUPABASE_URL`, `KEEP_ALIVE_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` — keep-alive + showcase upload

---

## Promjene u kodu (refaktor `8f600e8`)

- `admin/pages/` → `admin/stranice/`
- `components/sections/` → `components/features/home/sections/`
- `components/admin/` → `components/features/admin/`
- `lib/admin/*-queries.ts` → `lib/queries/admin/`
- `lib/site.ts`, `seo.ts`, … → `lib/config/`
- `lib/admin-auth*.ts` → `lib/auth/`
- `actions/blog.ts`, `actions/portfolio.ts` → `lib/queries/` + `types/`
- `main-nav-routes.ts` → `lib/routes/main-nav.ts`
- Obrisan `AdminActivityFeed`

## Branding (`b12a0f0`)

- `aboutPage.heroTitleHighlight`: „Protos Web”
- `aboutPage.heroTitleLine2`: „Full Stack Duo iz Zagreba.” (+ en/de/it/es)
- OG `/api/og?type=about` — Full Stack Duo tekst

## Build fix (`b12a0f0`)

- `AdminStaticPagePanel` → `'use client'` (circular TDZ na `admin/stranice/*` pri `npm run build`)

## Integracije — status

| Servis | Status |
|--------|--------|
| DeepSeek `/admin/ai` | Kod + `DEEPSEEK_API_KEY` na Vercelu ✅ |
| Protos-Agent `/admin/memory` | `GITHUB_TOKEN` na Vercelu ✅ (repo privatan — raw URL 404 bez tokena) |
| Zoho Mail | DNS MX only — **nema env var** |
| Stripe | DB kolone postoje — **nema SDK/API integracije** |
| Resend/Brevo | Supabase Edge secrets |

---

## Live smoke test (2026-07-11, anon)

| Test | Rezultat |
|------|----------|
| `GET /o-meni` | 200 — „Full Stack Duo iz Zagreba” ✅ |
| `GET /admin` | 200 — login shell ✅ |
| `GET /admin/ai` | 200 — stranica učitana ✅ |
| `GET /admin/memory` | 200 — stranica učitana ✅ |
| `POST /api/admin/ai` (bez cookie) | 401 Unauthorized ✅ (auth gate radi) |
| `POST /api/contact` `{}` | 400 Missing fields ✅ (ruta živa) |
| `GET /api/og?type=about` | 200 ✅ |
| Supabase keep-alive cron | GitHub Actions success ✅ |

**Napomena:** Pun E2E DeepSeek odgovor i memory lista zahtijevaju admin session cookie — env ključevi potvrđeni u Vercel Dashboardu, ne ponavljati „postavi env“.

---

## Pointer

Kanonska memorija: `memory/projects/protos-web.md` (ažurirano u istoj sesiji).
