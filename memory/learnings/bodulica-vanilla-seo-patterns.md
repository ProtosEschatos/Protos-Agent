---
id: bodulica-vanilla-seo-patterns
project: Bodulica
extracted_from: 2026-07-10-02
topics:
  - seo
  - vanilla-spa
  - cloudflare-pages
  - supabase-edge
---

# Bodulica — vanilla SPA SEO i edge obrasci

## SPA SEO bez zasebnih HTML stranica

Bodulica je jedan `index.html`. Kategorije nisu zasebne rute — filter u DOM-u.

**Obrazac:**

1. `CATEGORY_SEO` mapa (hr/en) po slug-u kategorije
2. `updateCategorySeo(cat)` mijenja `title`, `meta description`, `keywords`, OG/Twitter, `canonical`
3. `history.replaceState` za URL: `?cat=delicije&lang=hr`
4. Na load: parsiraj `?cat=` → `applyCategoryFilter(cat)`
5. `sitemap.xml` listaju iste URL-ove za crawlere (iako je ista SPA datoteka)

**Zašto:** Google vidi konzistentan canonical i meta po „virtualnoj“ kategoriji bez novih HTML fajlova.

## Nevidljiva creator atribucija

Zahtjev: Google vidi Dario + Martina + Bodulica vezu, **bez** UI linkova/gumbova.

**Što radi:**

- `<meta name="author|designer|creator">` u `<head>` only
- `<link rel="me" href="...">` za socijalne profile
- JSON-LD `Person` + `knows` + `CreativeWork` s `creator`/`contributor`
- Meta description (ne hero tekst) može diskretno spomenuti „web dizajn: …“

**Što NE raditi:**

- Footer „Designed by“ badge
- Vidljivi linkovi na osobne profile
- `display:none` tekst na stranici (koristi head + JSON-LD)

**Oprez:** Ne upisivati neverificirane FB profile (Martina) — samo potvrđeni IG.

## Dinamički Product / ItemList schema

- Nakon `fetch(/products)`: injektiraj `ItemList` u `<script id="itemListLd">`
- Pri `oM(slug)` (modal): ažuriraj `<script id="productLd">` s `Product` + `Offer`
- Pri `cM()` (zatvaranje modala): očisti `productLd`

Crawleri koji ne izvršavaju JS vide statički `@graph` u headu; JS-enabled crawleri vide i dinamičke proizvode.

## Supabase Edge kao jedini admin backend

- Shop i admin zovu istu edge funkciju `bodulica-api`
- RLS zategnut — javni insert na orders/products uklonjen
- Edge koristi `service_role` za admin/checkout
- Admin token: HMAC, ne JWT library — secret iz `JWT_SECRET` ili `ADMIN_PASSWORD`

## Stripe live vs test

- `getStripeMode()` iz prefiksa `sk_test_` / `sk_live_`
- Webhook i checkout postavljaju `stripe_mode` na order
- Admin stats: `?live_only=true` default — test ne ulazi u prihod
- Admin UI: TEST badge na narudžbama s `stripe_mode=test`

## Contact → inbox bez pogrešnog schema

`inbox_threads` nema `customer_name`. Kontakt forma:

1. Insert thread (subject, email, …)
2. Insert message s imenom u `body_text`

Provjeri stvarne kolone prije inserta — seed/migracije mogu biti starije od koda.

## Deploy napomene

- Cloudflare Pages: `admin.html` → 308 na `/admin`
- Edge function deploy odvojen od Pages pusha
- `supabase/.temp/*` ne commitati
