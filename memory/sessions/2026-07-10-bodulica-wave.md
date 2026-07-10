# Sesija 2026-07-10 — Bodulica security, features, cleanup, SEO (Bodulica)

## Kontekst

- Klijentica: Ljubica, butiga Bodulica u Betini (Murter)
- Prioritet: sigurnost + SEO prvo; admin UX kasnije
- Stack ostaje vanilla HTML/JS + Cloudflare + Supabase Edge — bez rezanja arhitekture
- Dario (web) + Martina Markulin (dizajn) — SEO atribucija nevidljiva na UI

## Kronologija commita

### 1. Security + SEO foundations (`c8751ab`)

- HMAC admin token (stari localStorage tokeni ne vrijede)
- CORS whitelist, rate limit na login
- Upload validacija, webhook idempotency
- RLS migracija `20260710180000_tighten_rls_policies.sql`
- SEO: meta, sitemap, `_headers`, H1 sr-only, JSON-LD LocalBusiness, robots.txt

### 2. Feature wave (`1cc96ea`)

Migracija `20260710210000_product_labels_bundles_orders.sql`:
- `products`: `labels`, `keywords`, `bundle_items`, `sort_order`
- `orders`: `stripe_mode`, `delivered_at`, `review_invite_sent_at`, `stripe_amount_cents`

Edge API + admin + shop:
- Proizvodi po kategorijama (`sortProductsByCategory`, Sync v6)
- Stats `live_only=true` (test narudžbe izvan prihoda)
- Checkout/webhook postavlja `stripe_mode`
- Recenzije tek nakon `delivered` + email invite
- `POST /api/contact` → inbox
- `GET /api/cron/keepalive` + GitHub workflow
- `POST /api/admin/stripe/sync`
- Admin: bundle picker za poklone, TEST badge na narudžbama

### 3. Contact fix (`b3d92c9`)

- `POST /api/contact` fail: kolona `customer_name` ne postoji na `inbox_threads`
- Fix: uklonjen insert `customer_name`; ime u `body_text` poruke
- Redeploy edge funkcije

### 4. Test data cleanup (DB, bez commita)

Korisnik: sve narudžbe bile testovi, prihod treba 0.

- Obrisano: 24 narudžbe, order_items, inventory_log, webhook_events, inbox
- Obrisano: 49 arhiviranih (neaktivnih) proizvoda uklj. test junk (`asdasdasdas`, `Test Product`, …)
- Vraćene zalihe iz inventory_log
- Uklonjen duplikat unikata „Baš je Mali Brodić Tvoj“
- Rezultat: 0 narudžbi, 45 aktivnih proizvoda, arhiva prazna

### 5. SEO atribucija (`c74696d`)

Bez vidljivih linkova na UI za Dario/Martinu:

- Meta `author`, `designer`, `creator`, `keywords`
- `link rel="me"` za potvrđene profile
- JSON-LD `@graph` (WebSite, Store, Person ×2, CreativeWork)
- `CATEGORY_SEO` + `updateCategorySeo()` + `?cat=` URL sync
- `ItemList` + `Product` JSON-LD
- Sitemap proširen s 7 kategorija
- DB: `keywords` i `desc_en` na svih 45 proizvoda

Creator URL-ovi:
- Dario: FB `imsirovicdario23`, IG `protos_eschatos`
- Martina: IG `everybodycries` (FB nije verificiran)
- Bodulica: IG `bodulica_betina`

## Live provjera (2026-07-10)

- Health API OK
- Admin login OK (HMAC token)
- Kontakt forma `{"ok":true}`
- Stats: 0 narudžbi, 0 prihod, 45 proizvoda
- Security headeri (CSP, HSTS) aktivni
- Nema vidljivih creator linkova na UI

## Otvoreno

| Stavka | Status |
|--------|--------|
| Resend + Brevo + Gmail | Čeka env vars |
| CRON_SECRET u GitHub | Nije postavljen |
| Martinin Facebook | Nije pronađen / nije upisan |
| IG opisi proizvoda | Djelomično (keywords batch); puni caption map čeka |
| Admin UX dorade | Kasnije |

## Memorija

- Bodulica repo ostaje čist na `c74696d` — znanje u `Protos-Agent/memory/projects/bodulica.md`
- Sljedeći fokus: **Protos-Web**
