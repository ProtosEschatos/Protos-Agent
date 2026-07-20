---
id: 2026-07-20-06
date: 2026-07-20
project: Protos-Web
title: SEO + security + bug re-audit — JSON-LD XSS, PostCSS CVE, trigger search_path
commits: []
learnings:
  - json-ld-xss-safe-serializer
topics:
  - security
  - seo
  - json-ld
  - xss
  - postcss
  - cve
  - supabase-advisors
  - search_path
  - audit
---

# Session — 2026-07-20 · Re-audit Protos-Web + Protos-Agent

User request:
> "ajde jos jednom prekontroliraj i SEO i sigurnost i da slucajno nema neki bug ili nesto i ceg god se jos sjetis i za protos-web i protos-agenta. nemoj da ti promakne neki error."

## Nalazi

### Kritično — popravljeno

1. **JSON-LD XSS risk** (6 kontekst-a)
   - `JSON.stringify` po defaultu ne escapea `</script>`, `<!--`, U+2028/9.
   - Blog title/description → RSS/CMS → JSON-LD `<script>` = potencijalni breakout.
   - Fix: novi `src/lib/seo/json-ld.ts` s `serializeJsonLd()` koji escape-a
     `<`, `>`, `&`, `\u2028`, `\u2029` u `\u00XX` formu.
   - Migrirali: `JsonLd.tsx`, `LocaleCreatorSeo.tsx`, `FaqSection.tsx`,
     `o-nama/layout.tsx`, `blog/page.tsx`, `blog/[slug]/page.tsx`.

2. **PostCSS < 8.5.10** (CVE-2026-41305 / GHSA-qx2v-qp2m-jg93, medium)
   - Dependabot alert #1 — transitive kroz `next` (8.4.31).
   - Fix: `package.json` overrides → `postcss: ^8.5.10`.
   - Rezultat: sve postcss instance su sada 8.5.20.

### Warning — popravljeno

3. **Supabase advisor `function_search_path_mutable`** × 3 funkcije:
   - `set_admin_api_keys_updated_at`, `set_automation_webhooks_updated_at`,
     `admin_assets_set_updated_at`
   - Fix: migracija `20260720160826_harden_trigger_function_search_path.sql`
     → `alter function … set search_path = pg_catalog, public;`

### Namjerno ostavljeno (WARN, s obrazloženjem)

- `rls_enabled_no_policy` × 4 (admin_mail_sync, agent_memories, audit_events,
  design_elements): admin-only tablice — samo service_role, RLS blokira anon.
- `extension_in_public` (pg_net): Supabase-controlled ekstenzija.
- `public_bucket_allows_listing` × 2 (showcase, site-assets): namjerno,
  javni CDN buckets — sadržaj se ionako pushuje deploy pipelineom.
- `anon_security_definer_function_executable` (get_donation_totals, submit_contact):
  namjerno — public site MORA moći zvati bez logina (kontakt/metriche).
- `auth_leaked_password_protection`: ne koristimo Supabase Auth.

## Ostali nalazi (Protos-Web)

- `tsc --noEmit` → 0 errors.
- `eslint --max-warnings=0` → 0 warnings (nakon uklanjanja unused `statSync`).
- `npm run build` → sve rute + middleware zeleno.
- CI (zadnjih 30 runa) → sve zeleno na `main`.
- `next-intl` catalog: HR/EN/DE/IT/ES/SR — 0 missing / 0 extra na svih 6 lokala.
- Supabase migracije: 44 lokalno == 44 remote (potpuni sync).
- Knip: 3 "duplicate exports" su aliasi (`INSTAGRAM_URL`/`DARIO_INSTAGRAM_URL`
  itd.) — namjerno.
- `dangerouslySetInnerHTML`: koristi se samo za JSON-LD (sad safe-serializer).

## Protos-Agent

- Validator: 13 sessions / 8 learnings / 3 projects / 13 index rows → 0 errors.
- Detektiran drift u naslovu jedne sesije vs index — regeneriran preko
  `memory/scripts/index-from-fm.mjs` (single source of truth = front-matter).

## Sljedeći koraci (opcionalno)

- Enable `HaveIBeenPwned` leaked-password protection ako ikada uključimo
  Supabase Auth za user-facing prijave.
- Vertikalne policije na `admin_mail_sync`/`agent_memories`/`audit_events`
  (`create policy … for all to service_role`) da uklonimo INFO advisor.
- Automatizirati `npm audit --production` + Snyk u CI (već imamo GH
  Dependabot alerts).
