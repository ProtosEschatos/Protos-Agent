---
id: bodulica
name: Bodulica
site: https://bodulica.shop
repo: https://github.com/ProtosEschatos/Bodulica
status: stale
last_updated: 2026-07-10
---

> **Napomena (audit 2026-07-20):** Status `stale` — projekt nije doticao od
> 2026-07-10, a `Otvoreno` sekcija na dnu ovog dokumenta ima nerazriješene
> stavke (Resend/Brevo/Gmail IMAP env vars, `CRON_SECRET`). Prije sljedeće
> sesije provjeri s ownerom je li produkcija još stabilna.

# Bodulica

**Repo:** [ProtosEschatos/Bodulica](https://github.com/ProtosEschatos/Bodulica)  
**Live:** https://bodulica.shop  
**Admin:** https://bodulica.shop/admin (redirect s `/admin.html`)  
**Klijentica:** Ljubica — butiga u Betini, Murter

## Stack (produkcija — NE mijenjati arhitekturu)

| Sloj | Tehnologija |
|------|-------------|
| Frontend | **Vanilla HTML/JS** — `bodulica-deploy/index.html`, `admin.html` |
| Deploy | **Cloudflare Pages** (push na `main`) |
| API | **Supabase Edge Function** `bodulica-api` (Deno/TS) |
| Baza | **Supabase Postgres** (`mbputwgppweoeujiszgv`) |
| Plaćanje | **Stripe** (live mode) |
| DNS / CDN | Cloudflare (`bodulica.shop`) |

> Nije Next.js ni Java. Jedan SPA shop + zaseban admin HTML.

## Arhitektura

- **Shop** (`index.html`): jedna stranica, proizvodi iz API-ja, Dynamic Product Sync v6
- **Kategorije** (7): `moda`, `delicije`, `kozmetika`, `rucni-rad`, `art`, `djeca`, `pokloni` — client-side filter, `.cat-header` sekcije
- **Admin** (`admin.html`): login → HMAC token u `localStorage` (`bod-admin-token`)
- **API base:** `https://mbputwgppweoeujiszgv.supabase.co/functions/v1/bodulica-api`

### Ključne putanje

```
bodulica-deploy/index.html          # shop, SEO, Sync v6, kontakt forma
bodulica-deploy/admin.html          # admin panel (noindex)
bodulica-deploy/sitemap.xml         # homepage + 7 kategorija
bodulica-deploy/_headers            # CSP, HSTS, admin noindex
bodulica-deploy/robots.txt
supabase/functions/bodulica-api/index.ts
supabase/migrations/20260710180000_tighten_rls_policies.sql
supabase/migrations/20260710210000_product_labels_bundles_orders.sql
.github/workflows/keep-alive.yml    # cron ping + inbox sync
.github/workflows/deploy-edge-function.yml
```

## Admin auth

- Lozinka: Supabase secret `ADMIN_PASSWORD` (nije mijenjana u valovima — ista za klijenticu)
- Token: HMAC (`JWT_SECRET` ili fallback na `ADMIN_PASSWORD`) — **stari tokeni u localStorage ne vrijede** nakon security fixa
- Rate limit na `POST /api/login`
- Admin rute: `isAdmin` provjera na svim `/api/*` osim javnih

## Stripe i narudžbe

- `stripe_mode`: `test` | `live` — iz Stripe ključa i webhooka
- Stats default: `live_only=true` — test narudžbe isključene iz prihoda
- Dashboard: gumb **Sync Stripe** (`POST /api/admin/stripe/sync`)
- **Stanje baze (2026-07-10):** 0 narudžbi (testovi očišćeni), prihod 0, 45 aktivnih proizvoda, arhiva prazna

## Proizvodi (DB polja)

- `description`, `desc_en`, `name_en`, `brand_en`
- `labels` (pipe u adminu), `keywords` (zarez), `bundle_items` (JSONB za poklone)
- `sort_order`, `stripe_mode` na orders

## SEO (nevidljivo na UI)

Implementirano u `index.html` `<head>` + JS:

- Meta: `author` (Dario Imsirovic), `designer` (Martina Markulin), `creator`, `keywords`
- `link rel="me"`: Dario FB/IG, Martina IG, Bodulica IG
- JSON-LD `@graph`: WebSite, Store, Person (Dario + Martina), CreativeWork
- Dinamički: `CATEGORY_SEO`, `updateCategorySeo()`, URL `?cat=` + `history.replaceState`
- `ItemList` + `Product` JSON-LD nakon synca / pri otvaranju modala
- Sitemap: 7 kategorijskih URL-ova + hreflang

### Creator linkovi (potvrđeni)

| Osoba | URL |
|-------|-----|
| Dario FB | https://www.facebook.com/imsirovicdario23/ |
| Dario IG | https://www.instagram.com/protos_eschatos/ |
| Martina IG | https://www.instagram.com/everybodycries/ |
| Bodulica IG | https://www.instagram.com/bodulica_betina/ |

Martinin Facebook **nije** u schema (nije javno verificiran povezan s IG).

## Tajne — mapa (bez vrijednosti)

| Secret | Gdje |
|--------|------|
| `ADMIN_PASSWORD`, `JWT_SECRET` | Supabase Edge secrets |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Supabase Edge |
| `RESEND_API_KEY`, `RESEND_FROM` | Supabase Edge — **još nije** |
| `IMAP_HOST`, `IMAP_USER`, `IMAP_PASS` | Supabase Edge — Gmail, **sutra** |
| `CRON_SECRET` | Supabase + GitHub repo secret (keep-alive workflow) |
| Zoho SMTP fallback | postojeći u edge funkciji |

## Poznati fixevi

### Contact forma — inbox schema
`POST /api/contact` pao jer `customer_name` nije postojao na `inbox_threads`. Fix: ime u `body_text` poruke. Commit `b3d92c9`.

### Test podaci cleanup
Sve narudžbe bile testovi — obrisane iz DB + inventory_log + webhook_events; arhiva (49 neaktivnih proizvoda) očišćena; zalihe vraćene gdje je inventory_log smanjio stock.

### Security (`c8751ab`)
HMAC admin token, CORS whitelist, rate limit, upload validacija, webhook idempotency, RLS migracija.

## Zadnji commiti (main)

| Commit | Sadržaj |
|--------|---------|
| `c74696d` | SEO atribucija Dario/Martina, kategorije, sitemap, Product JSON-LD |
| `b3d92c9` | Contact inbox schema fix |
| `1cc96ea` | Kategorije, labele, recenzije nakon dostave, Stripe sync |
| `c8751ab` | Security + SEO foundations |

## Otvoreno / sljedeći koraci

1. **Mail:** Resend + Brevo + Gmail IMAP — env vars + end-to-end test
2. **CRON_SECRET** u GitHub secrets za inbox sync
3. Martinin FB URL kad bude potvrđen
4. IG caption mapiranje na proizvode (@bodulica_betina — scrape blokiran)
5. Admin UX dorade (kasnije, po dogovoru s klijenticom)

## Deploy

- **Cloudflare Pages:** auto s pusha na `main` (~30s)
- **Edge function:** `deploy-edge-function.yml` ili `supabase functions deploy bodulica-api`
- **Migracije:** `supabase db push` / MCP `apply_migration`

## Povezanost s Protos-Web

Bodulica je jedan od demo portfolio projekata na protosweb.eu — deaktiviran u CMS-u (`active=false`). Live shop je zaseban projekt na `bodulica.shop`.
