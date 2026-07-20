# Session 2026-07-18 — Admin login unblock, astronaut room widgets, showcase screenshots

**Sesije:** `f6302337` (03:36 → 16:33) + `a725099e` (17:21 → 20:14)
**Repo:** Protos-Web (tada još Vue/Vite verzija)
**Commiti (kronološki):** `4b038cf` → `c8324fc` → `26e36a3` → `3209e22` → `4cd064a` → `7d46df3` → `80054d8` → `20285b1` → `6f2e436`

## Popodne (f6302337)

### 1) Admin login odblokiran (`auth.users` insert)
**Problem:** admin login vraćao "invalid credentials" iako je `ADMIN_SECRET` bio točan u Vercelu.
**Root cause:** Vue admin arhitektura je koristila Supabase Auth za login (ne HMAC cookie kao Next verzija), a `dario.admin@protosweb.eu` uopće nije postojao u `auth.users` tablici.
**Fix:** direktan SQL insert nove auth.users rowe s bcrypt hash-om lozinke.
**Learning:** kod cutover-a na drugi auth model, prvo migrirat/kreirat korisnike.

### 2) Astronaut room widgeti (`4b038cf`)
- Broj ekrana u 3D "astronaut room" sceni udvostručen
- Live admin widgeti (CMS status, inbox count) prikazuju se na ekranima u realtime-u

### 3) Firecrawl screenshots u Supabase Storage (`c8324fc`)
- Umjesto stock/generiranih thumbnaila portfolio projekata → **prave live screenshotove** preko Firecrawl API-ja
- Upload u bucket `showcase` s novom RLS policy: authenticated upload only, public read
- Cache invalidation na svakom deployu

### 4) Cosmic Blueprint uklonjen s wall-a (`26e36a3`)

## Večer (a725099e)

### 5) SEO pipeline finalized (`3209e22`)
- PNG OG slike umjesto SVG (bolji social preview support)
- Hreflang sitemap uključuje blog slug-ove (bilo skipano ranije)
- Security headers (`Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`) u CF Pages headers config
- JSON-LD strukturirani podaci (Organization, Person, Article) po stranici
- `<html lang>` per locale u SSR outputu
- **CF Pages Git-integration deploy path** (auto-build iz `main`, ne manual push)

### 6) Mobile joystick centriran + `SpaceGallery.vue` uklonjen (`4cd064a`)

### 7) Brand sweep (`7d46df3`)
- Nova paleta: **orange + cyan** kao brand naglasci
- Font: **DM Sans** kao primary UI font
- Svi hard-kodirani stariji brandovi (indigo/purple) očišćeni

### 8) CI regression — uklonjeni Cursor CTA (`80054d8`)
- Prethodni commit je pobrisao referencu na CursorCTA komponentu ali ne i import → build fail
- Revert import-a, komponenta stvarno mrtva

### 9) Cosmic Blueprint saga (`20285b1` → `6f2e436`)
- Dodan natrag s email-gate (unos emaila prije pregleda)
- Odlučeno ipak ukloniti — jedini "gate" ostaje **System Boost** (registracija za pristup)

## Ishod
Vue verzija u tvrdo poziciji: SEO ready, brand konzistentan, admin funkcionalan. Sljedeći dan (19.7.) — odluka o vraćanju na Next.js stack.
