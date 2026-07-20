---
id: protos-web-seo-patterns
project: Protos-Web
extracted_from: 2026-07-11-01
topics:
  - seo
  - nextjs
  - next-intl
  - hreflang
  - creator-attribution
  - json-ld
---

# Protos-Web — Next.js SEO i creator atribucija

## hreflang bez `/hr/` prefiksa

`next-intl` s `localePrefix: 'as-needed'` — HR na rootu (`/o-nama`), ostali s prefiksom (`/en/about`).

**Obrazac:** `buildPageMetadata()` u `src/lib/seo.ts` emitira:
- `alternates.canonical` — locale-aware URL
- `alternates.languages` — hr, en, de, it, es + `x-default` → HR root URL
- Opcionalno `ogImagePath` (npr. `/api/og?type=about` za About stranicu)

Ne migrirati na `/hr/` bez 301 plana — hreflang je važniji od prefiksa.

## Entity layer — Person ↔ HTML povezivanje (2026-07-11)

**Obrazac:** stabilni fragment ID-ovi na `/o-meni` + schema `url` koji pokazuje na isti fragment:

```html
<div id="dario-imsirovic">...</div>
<div id="martina-markulin">...</div>
```

```ts
// creator-seo.ts
url: `${SITE_URL}${buildLocalePath(locale, '/o-meni')}#dario-imsirovic`
```

- `@id` ostaje globalno: `${SITE_URL}/#dario-imsirovic` (u `@graph`)
- `AboutPage` JSON-LD: `mainEntity` → oba Person `@id`
- Root layout `metadata.authors` → oba imena s URL-ovima na fragmente

## Nevidljiva creator SEO (Martina)

Zahtjev: Dario + Martina vidljivi crawlerima/AI; Martina **primarno na `/o-meni`** u UI (ne footer badge).

**Implementacija:**
- `src/lib/creator-seo.ts` — `@graph`: WebSite, Organization, Person×2, CreativeWork, ProfessionalService
- `LocaleCreatorSeo.tsx` u `[locale]/layout.tsx` `<head>`
- `public/llms.txt` — imena, uloge, dva stacka, fragment linkovi
- `sameAs` samo iz **live** URL-ova (`getLiveProfileUrls` u `team-profiles.ts`) — ne `#`

## Javni tech stackovi vs infra

**Javno (UI, proces, marquee):** `src/lib/tech-stacks.ts` — jezici + framework only.

**Ne prikazivati u javnom UI:** Supabase, Stripe, Cloudflare, Drizzle, DevOps.

Infra može ostati u `knowsAbout` / llms za AI crawl, ali ne u vidljivim badgeovima.

## Dual stack showcase (Bodulica)

- `DualStacksSection` na `/o-meni` — Protos Web (TS/React) vs Bodulica (vanilla)
- **Bez live shop linka** na Protos-Webu
- Bodulica repo je odvojen — samo marketing opis na glavnom siteu

## Social struktura (`team-profiles.ts`)

```ts
studioSocialItems | darioSocialItems | martinaSocialItems | freelancePlatformItems
```

- `pending: true` + `href: '#'` dok korisnik ne pošalje URL
- Jedan commit u `team-profiles.ts` aktivira sve platforme kad URL-ovi stignu
- `social-links.ts` re-exporta za backward compat

## Blog authorship (`author_slug`)

| Stupac | Vrijednosti | Default |
|--------|-------------|---------|
| `blog_posts.author_slug` | `dario`, `martina`, `both` | `dario` |

- UI byline: `blog.authorBy` + `authorDario`/`authorMartina`/`authorBoth`
- JSON-LD: `buildBlogAuthorGraph(locale, authorSlug)` — jedan ili dva autora
- Index: `blogIndexJsonLd` → `Blog` + `ItemList`

## Structured data po ruti

| Ruta | Schema |
|------|--------|
| Global (layout) | `@graph` creator + ProfessionalService |
| `/o-meni` | AboutPage + Person fragment URLs |
| `/usluge` | FAQPage (HTML accordion + `faqPageJsonLd`) |
| `/blog` | Blog + ItemList |
| `/blog/[slug]` | BlogPosting (per-author) |
| Portfolio (kad ima itema) | ItemList of CreativeWork |

## OG slike

- Default: `/api/og`
- About: `/api/og?type=about` — imena + uloge u templateu

## Tehnički SEO fajlovi

- `src/app/sitemap.ts` — priority, `lastModified`
- `src/app/robots.ts` — AI bot rules; disallow `/admin`
- `public/llms.txt` — statički, servira se na `/llms.txt`

## SEO ciljevi — realno očekivanje

| Upit | Strategija |
|------|------------|
| `Protos Web`, `protosweb` | Brand entity + schema + consistent NAP |
| Osobna imena + uloge | About fragments + blog authorship |
| Samo `protos` | Generička riječ — treba off-page (GSC, GBP, profili), topical blog, vrijeme |

## Consent gate (ne SEO, ali utječe na crawl)

`SiteConsentModal` + `boot-gate` — korisnik mora prihvatiti uvjete. Legal + `/admin` zaobilaze gate. Crawleri vide HTML.

## CWV brzi fixevi

- `loading="lazy"` na PortfolioGrid, SpaceGallery, ShowcaseFallback
- 3D: `dynamic(..., { ssr: false })`
- Boot video: sessionStorage skip za returning visitors

## Off-page (ručno)

Search Console, Bing Webmaster (resubmit sitemap), Google Business Profile, Clutch, live `sameAs` profili — agent ne može zamijeniti.
