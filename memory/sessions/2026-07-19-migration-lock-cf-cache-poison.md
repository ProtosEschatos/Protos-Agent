# Session 2026-07-19 — Migration lock, CF cache poison fix, persistent 3D canvas

**Sesija:** `18f754e9` (03:03 → 14:12, ~11h)
**Repo:** Protos-Web (Vue verzija, zadnji dan tog stack-a)
**Commiti:** `fab2aae` → `d22a46d` → `164c969` → `d4e74c1` → `1c036b9` → `d0373a5`

## 1) Migration-desync lock (`fab2aae`)

**Problem:** kroz Cursor MCP `apply_migration` primjenjivane migracije direktno na remote Supabase, ali repo nije uvijek imao sinkroni SQL file. Rezultat: divergencija između remote `supabase_migrations.schema_migrations` i lokalnog `supabase/migrations/`.

**Fix:**
- `scripts/assert-migration-history.sh` — CI guard koji uspoređuje remote migration verzije s lokalnim fajlovima; fail-a build ako drift
- Guard integriran u GitHub Actions `ci.yml` (obavezno)
- `AGENTS.md` sekcija: **"Migration lock"** — pravilo da kad se apply-a preko MCP-a, ODMAH commitat SQL s istim version stamp-om u repo

**Learning (permanent):** MCP `apply_migration` uvijek prati `supabase db pull` ili ručno preslikavanje SQL-a u repo. Nikad ne ostavljati remote-only migracije.

## 2) 1.5GB Next archive purge

- Stari `/tmp/protos-next-archive/node_modules` root-owned (docker leftover) — nije se dao brisati
- Rješenje: `docker run --rm -v /tmp:/host alpine:latest rm -rf /host/protos-next-archive/node_modules`

## 3) Placeholder anon-key ban (`d22a46d`)

- CI/deploy skripte imale fallback na `eyJhbGciOiJIUzI1NiIs...placeholder...` string za `SUPABASE_ANON_KEY`
- Prošlo neopaženo kad je pravi secret bio missing u env-u — publish s placeholderom → runtime 401 svugdje
- Fix: hard fail u `scripts/check-env.mjs` ako `NEXT_PUBLIC_SUPABASE_ANON_KEY` sadrži `placeholder`

## 4) Cloudflare cache poison fix (`164c969`)

**Simptom:** poslije novog deploya CF cache je vraćao STARO `index.html` s referencama na hash-eve fajlova koji više ne postoje → 404 na `.js`/`.css` chunk-ove.

**Root causes (tri paralelna):**
1. **`crossorigin` na `<link rel="stylesheet">`** — CF je različito cache-ao request s/bez `crossorigin` header-a, pa cache-hit s pogrešnim variantom
2. **`.pages.dev` preview URL** je isto bio public → Google indexirao, cache poison sekundarni
3. **SPA catch-all** je vraćao `index.html` za nepostojeće JS chunk-ove umjesto 404

**Fixevi (svi u istom commitu):**
- Uklonjen `crossorigin` atribut sa SSG `<link>` tag-ova
- **`functions/_middleware.js`** — 301 redirect `*.pages.dev/*` → `protosweb.eu/*` (kanonizacija)
- Uklonjen SPA catch-all iz `functions/[[path]].js`
- **Post-deploy skripte**: `scripts/cf-purge-cache.sh` + `scripts/cf-verify-hashes.sh` (provjerava da svaka referenca u `index.html` postoji na disku)

## 5) Persistent 3D canvas, FPS cap (`d4e74c1` → `1c036b9`)

**Problem:** kod navigacije između stranica R3F/Tres canvas se remount-ao → GL context flicker, 500ms freeze, memory leak.

**Fix:**
- Persistent `<TresCanvas>` na root layout-u (izvan router-view-a)
- Scene manager preuzima kameru/objekte na route change (`beforeRouteUpdate`)
- **30 FPS cap** za smanjenje CPU/GPU trošenja (dovoljno za dekorativne pozadine)

## 6) Preview readiness check na `main` (`d0373a5`)

- CI check "Pages preview readiness" bio skipped na `main` push-u → produkcija je znala imati broken assets
- Uključen obavezno

## Ishod

Vue stack tehnički čvrst — migration lock, cache stabilan, 3D perf ok. Ali kasno navečer / preko noći odluka: **vraćanje na Next.js**. Sve iduće (20.7.) je Next.js rad.
