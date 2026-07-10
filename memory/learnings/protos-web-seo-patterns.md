# Protos-Web — Next.js SEO i creator atribucija

## hreflang bez `/hr/` prefiksa

`next-intl` s `localePrefix: 'as-needed'` — HR na rootu (`/o-meni`), ostali s prefiksom (`/en/o-meni`).

**Obrazac:** `buildPageMetadata()` u `src/lib/seo.ts` emitira:
- `alternates.canonical` — locale-aware URL
- `alternates.languages` — hr, en, de, it, es + `x-default` → HR root URL

Ne migrirati na `/hr/` bez 301 plana — hreflang je važniji od prefiksa.

## Nevidljiva creator SEO (Martina)

Zahtjev: Dario + Martina vidljivi crawlerima/AI, Martina **samo na `/o-meni`** u UI.

**Implementacija:**
- `src/lib/creator-seo.ts` — `@graph`: WebSite, Organization, Person×2, CreativeWork, ProfessionalService
- `LocaleCreatorSeo.tsx` u `[locale]/layout.tsx` `<head>` — meta author/designer, `rel=me`, JSON-LD
- `public/llms.txt` — eksplicitno imena + kontakt za AI crawlers

**Ne:** footer badge, skriveni DOM tekst, vidljivi linkovi na profile izvan O nama.

## Structured data po ruti

| Ruta | Schema |
|------|--------|
| Global (layout) | `@graph` creator + ProfessionalService |
| `/usluge` | FAQPage (HTML accordion + `faqPageJsonLd`) |
| `/blog/[slug]` | BlogPosting |
| Portfolio (kad ima itema) | ItemList of CreativeWork — faza 2b |

## Tehnički SEO fajlovi

- `src/app/sitemap.ts` — priority (home 1.0, usluge/kontakt 0.9, legal 0.3, showcase 0.4), `lastModified`
- `src/app/robots.ts` — `*`, GPTBot, ClaudeBot, PerplexityBot, Google-Extended; disallow `/admin`
- `public/llms.txt` — statički u `public/`, servira se na `/llms.txt`

## Consent gate (ne SEO, ali utječe na crawl)

`SiteConsentModal` + `boot-gate` v11 — korisnik mora prihvatiti uvjete prije ulaska. Legal stranice (`/terms`, `/privacy`, `/cookies`) i `/admin` zaobilaze gate. Crawleri vide HTML bez interakcije.

## CWV brzi fixevi

- `loading="lazy"` na PortfolioGrid, SpaceGallery, ShowcaseFallback
- 3D: `dynamic(..., { ssr: false })` — već postoji
- Boot video: sessionStorage skip za returning visitors

## Off-page (ručno)

Search Console, Bing Webmaster, Google Business Profile, Clutch — agent ne može.
