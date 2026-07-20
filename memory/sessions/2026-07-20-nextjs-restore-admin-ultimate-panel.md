# Session 2026-07-20 — Next.js restore, Ultimate admin panel (FAZA 1-5), redirect loop fix

**Sesije:** `2baf67f2` (02:39) + `06a0c810` (04:02) + `6e2da65d` (05:32) + `b3c22b21` (05:47) + `1a3c2640` (12:17, trenutna)
**Repo:** [Protos-Web](https://github.com/ProtosEschatos/Protos-Web) (Next.js verzija — puni restore)
**Krajnji HEAD (danas):** `42822a9aef` — `chore: remove i18n-sync workflow and translate script`

## Prekretnica: povratak na Next.js

Nakon 3 dana Vue eksperimenta (17-19. srpanj) — konačna odluka: **glavni site ostaje Next.js 16 + React 19 + Vercel**. Vue verzija ostavljena u `Protos-Web-Next-Archive` (i drugim arhivama). Sav novi rad ide u Next.js glavni repo.

## Radne faze

### FAZA 1 — Toast infrastruktura (`674bfa568d`)
- **Zustand store** `src/lib/stores/toast-store.ts` (`ToastType`, `Toast`, `newId()`, `useToastStore`, imperative `toast.info/success/warning/error`)
- **Provider** `src/components/ui/ToastProvider.tsx` — Lucide ikone, boje po tipu (indigo/emerald/amber/rose), `aria-live`, `role=region`
- Mount u `src/app/[locale]/layout.tsx` unutar `<LenisProvider>`
- Barrel export: `src/lib/stores/index.ts`

### FAZA 2 — API Keys vault (`5d68ce6c8a`, `2b9fdbd774`, `6a0f64e3be`)
- **Supabase tablica** `admin_api_keys` (migracija `20260720062823_admin_api_keys.sql`) — kolone: `id, provider, label, env_target, masked_hint, ciphertext, iv, auth_tag, notes, is_active, last_used_at`
- **RLS**: samo `service_role` može CRUD (nikad anon/authenticated)
- **AES-256-GCM enkripcija** — [`src/lib/security/api-keys-crypto.ts`](src/lib/security/api-keys-crypto.ts)
  - Master key = env `ADMIN_KEYS_ENCRYPTION_KEY` (base64 32 bytes)
  - `encryptSecret()` → `{ciphertext, iv, authTag}`; `decryptSecret()` reverse
  - `maskSecret()` = safe hint (npr. `sk_l...wxyz`)
- **Provider registry** [`src/lib/config/api-key-providers.ts`](src/lib/config/api-key-providers.ts) — OpenAI, Stripe, Sketchfab, itd. s docs URL-ovima
- **Zod schemas** `src/lib/schemas/api-key.ts`, **queries** `src/lib/queries/admin/api-keys.ts`, **server actions** `src/actions/admin-api-keys.ts` — sve iza `requireAdmin()`
- **UI** `/admin/kljucevi` — [`src/app/[locale]/admin/kljucevi/page.tsx`](src/app/[locale]/admin/kljucevi/page.tsx) + `ApiKeysManager.tsx`
- Warning banner ako `ADMIN_KEYS_ENCRYPTION_KEY` nedostaje (aplikacija ne pada, samo blokira reveal)

### FAZA 3 — Automation webhooks (`ac4b93de3b`)
- **Supabase tablica** `automation_webhooks` (migracija `20260720063416_automation_webhooks.sql`) — kolone: `id, name, url, method, event, auth_type, auth_header_name, auth_ciphertext, auth_iv, auth_tag, headers_json, body_template, notes, is_enabled, last_fired_at, last_status_code, last_response, fire_count`
- **RLS**: service_role only
- **Auth tipovi**: `none | bearer | basic | custom` (header + AES-encrypted vrijednost)
- **Eventovi**: `manual | contact.received | subscriber.new | donation.completed | portfolio.published | blog.published`
- **SSRF zaštita**: URL blokira `localhost`, `127.*`, `10.*`, `192.168.*`, `169.254.*`, IPv6 loopback
- **Queries/actions**: `src/lib/queries/admin/automations.ts`, `src/actions/admin-automations.ts`
- **UI**: `/admin/automations` — [`AutomationsManager.tsx`](src/components/features/admin/AutomationsManager.tsx) grupira po eventu, akcije fire/toggle/delete

### FAZA 4 — 3D Configurator (`b62e828590`)
- **Scene store** [`src/lib/stores/scene-store.ts`](src/lib/stores/scene-store.ts) — primitive (box/sphere/torus), gltfUrl, material props (metalness, roughness, emissive), lighting, HDRI env, background, wireframe, autoRotate
- **`ConfiguratorScene.tsx`** — R3F `<Canvas>` + Drei `Environment/OrbitControls/ContactShadows`; dynamic import (SSR off)
- **`ConfiguratorControls.tsx`** — UI grupe Mesh/Material/Lighting bind na store
- **Sketchfab integracija** [`src/lib/config/sketchfab.ts`](src/lib/config/sketchfab.ts) — token iz `admin_api_keys` vault-a ili env `SKETCHFAB_API_TOKEN`
  - `searchSketchfabModels()`, `requestSketchfabDownloadUrl()` (signed GLTF/GLB URL)
- **`SketchfabBrowser.tsx`** — search input, results grid s thumbnail/author/license, "Učitaj" gumb → download → scene store
- **Manager** [`ConfiguratorManager.tsx`](src/components/features/admin/ConfiguratorManager.tsx) — split view scene lijevo / kontrole desno
- **UI**: `/admin/konfigurator`

### FAZA 5 — Dashboard refresh (`a53a78c7e8`)
- Nova query [`src/lib/queries/admin/panel-stats.ts`](src/lib/queries/admin/panel-stats.ts) `getUltimatePanelStats()` — brojevi iz `admin_api_keys` i `automation_webhooks`
- **`AdminHeader.tsx`** refresh gumb sada zove `toast.success()` nakon `router.refresh()`
- Nova sekcija "Ultimate panel" na `/admin` s `AdminStatGrid` (aktivni ključevi, aktivni webhookovi, ukupno fires, zadnji fire timestamp)
- Nova "Studio" sekcija s karticom za 3D Configurator
- Warning banner ako `ADMIN_KEYS_ENCRYPTION_KEY` nije setan

## Deploy incidenti i fixevi

### 1) Redirect loop `www` ↔ apex (`e482850d79`)
**Simptom:** cijeli site `ERR_TOO_MANY_REDIRECTS` — Vercel redirect-ao apex → www, `next.config.js` je imao redirect www → apex → beskonačna petlja.
**Fix:** uklonjen `async redirects()` iz `next.config.js`. Kanonski host bira se u Vercel Domain Settings, ne u aplikaciji.
**Learning:** kada koristiš Vercel domain redirect, NIKAD ne diraj `redirects()` u kodu za isti par host-ova.

### 2) Admin Inbox Sync 308 loop (`5b19770b9a`)
**Simptom:** GitHub Actions `admin-inbox-sync` fail-a s `curl: (47) Maximum (50) redirects followed`.
**Fix:** `curl -L` (follow) + `SITE_URL=https://www.protosweb.eu` (kanonski host, ne apex). Poslije stvarnog root fixa (br. 1) redirect više nije problem, ali `-L` ostaje kao safety.

### 3) Supabase migration drift (`d4eb3fb942`)
- Supabase Preview CI fail: "Remote migration versions not found in local migrations directory"
- 3 drift migracije povučene s remote-a: `20260716210000_agent_memories_and_audit.sql`, `20260717210030_agent_memories_and_audit.sql`, `20260719004641_page_backgrounds.sql`
- Sve idempotentne (`create table if not exists ...`)

### 4) TypeScript strict fixevi za nove tablice (`6a0f64e3be`, `2b9fdbd774`)
- Nakon dodavanja `admin_api_keys` i `automation_webhooks`: TS errors "Argument of type ... is not assignable to parameter of type 'never'"
- Fix: `generate_typescript_types` preko MCP → `src/lib/database.types.ts` regeneriran
- Explicit cast `row as Database['public']['Tables'][TableName]['Insert']` u query fajlovima

### 5) Analytics + Google Business defaults (`8eee3c4b4e`)
- `src/lib/config/site.ts` hard-coded fallbacks:
  - `GA4_MEASUREMENT_ID` = `G-BGR7VHFCB2`
  - `GOOGLE_BUSINESS_PROFILE_URL` = `https://share.google/WMPSacg3oKW1Gy8W8`
  - `PLAUSIBLE_DOMAIN` = `protosweb.eu`
- `src/components/providers/Analytics.tsx` — sada čita iz `site.ts` (ne direktno iz `process.env`)

### 6) Supabase DB Push workflow (`.github/workflows/supabase-db-push.yml`)
- Validacija `SUPABASE_ACCESS_TOKEN` i `SUPABASE_PROJECT_REF` format-a prije `db push`
- Skip s warning-om umjesto fail-a ako secrets nedostaju/su malformed

### 7) i18n-sync workflow uklonjen (`42822a9aef`)
- `DEEPSEEK_API_KEY` nije za prijevode — samo za admin AI asistenta
- Uklonjen `.github/workflows/i18n-sync.yml` + `scripts/translate-i18n.mjs`
- Lokalizacija ostaje **ručno preko `next-intl` messages**

## Sigurnosni model API keys vault-a

```
Plaintext key (user input)
   │
   ▼
[encryptSecret(k, master=ADMIN_KEYS_ENCRYPTION_KEY)]
   │
   ├── ciphertext (base64) ─┐
   ├── iv (base64) ─────────┤ INSERT INTO admin_api_keys (...)
   └── auth_tag (base64) ───┘        [RLS: service_role only]
   │
   ▼
maskSecret(k) → "sk_l...wxyz"    [stored kao masked_hint]
```

**Reveal flow** (samo za admin actions):
```
requireAdmin() → serviceRole.select(row) → decryptSecret(...) → plaintext
     │
     └─ stamp last_used_at = now()
```

**Gubitak `ADMIN_KEYS_ENCRYPTION_KEY` = svi vault entries nečitljivi.** Backup master key izvan Vercela (npr. password manager).

## Trenutna produkcijska mapa

| Stavka | Status |
|---|---|
| Live site (svih 7 lokala) | ✓ 200 |
| Admin rute (14/14) | ✓ 308 na login (auth radi) |
| Kontakt POST | ✓ 200 |
| Newsletter POST | ✓ 200 |
| Donate POST | ✓ 200 (Stripe cs_live URL) |
| Stripe webhook | ✓ verificira signature (400 na test bez sig) |
| CI checks | ✓ Cloudflare DNS, Supabase, Build, Audit, Vercel |
| Sadržaj u DB | 81 blog, 7 portfolio, 20 subscribera, 14 kontakata |

## Divergencija lokal ↔ remote (razriješena)

- Lokalni checkout `/home/protos/Protos-Web` bio je 86 commita ispred (stariji Vue-doba rad) i 420 iza (moji API commit-ovi FAZE 1-5)
- **Backup grana** `local-backup-2026-07-20` pushana na GitHub — sve povijesti sigurne
- Hard reset lokala na `origin/main` predložen; ključevi ostaju netaknuti (žive u Vercelu/Supabase/GitHub Secretima, ne u gitu)

## Novi env vars koje treba dokumentirati u `.env.example`

Već u produkciji, ali nedostaju kao komentar-hint:
- `CRON_SECRET` (koristi `src/app/api/cron/sync-inbox/route.ts`) → Vercel
- `KEEP_ALIVE_SECRET` (koristi `supabase/functions/keep-alive/index.ts`) → Supabase Edge
- `SKETCHFAB_API_TOKEN` (koristi `src/lib/config/sketchfab.ts`) → Vercel (opcionalno, fallback vault)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (novi Supabase naming) → Vercel

## Sljedeći koraci

1. Backfill `.env.example` s gore navedenim env varsima
2. Dizajn dorada (user impatient za UI polish)
3. Locale drift zakrpat (de/it/es fale 27 stringova u MAIN + 23 u LEGAL)
4. Supabase advisor WARN-ovi (opcionalno) — pg_net iz public schema, RLS policies na 4 tablice, function search_path
