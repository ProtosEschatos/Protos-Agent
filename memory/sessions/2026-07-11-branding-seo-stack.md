# Sesija 2026-07-11 — Branding, dual stackovi, SEO entiteti

**Repo:** ProtosEschatos/Protos-Web  
**Live:** https://protosweb.eu  
**Glavni commit:** `1baa74d` — branding + SEO plan (sve faze 0–5)  
**Prethodni:** `cd657c4` (Instagram Dario/Martina), `7e8fea3` (GSC verification)

## Što je odrađeno

### Tim & i18n (5 jezika)
- Nove uloge: Dario = AI inženjer & Full Stack Cross-Web; Martina = Frontend/shop UI dizajnerica
- `onlinePresence` → **"Naša/Our online prisutnost"** (timski ton)
- `metadata.about` opisi ažurirani s ulogama i dual-stack porukom
- Expertise tagovi po članu tima na `/o-meni`

### Javni tech stackovi (bez infrastrukture)
- Novi `src/lib/tech-stacks.ts` — `PROTOS_WEB_STACK`, `BODULICA_STACK`, `PROTOS_WEB_MARQUEE`
- Javno: jezici + framework (TS, JS, HTML, CSS, Next.js, React, Three.js, Tailwind, Framer Motion)
- **Uklonjeno iz javnog UI:** Supabase, Stripe, Cloudflare, Drizzle, DevOps
- Korišteno na: `/proces`, `/portfolio`, home marquee (`Portfolio.tsx`)

### Bodulica showcase
- `DualStacksSection.tsx` na `/o-meni` — "Dva stacka, ista stručnost"
- Vanilla HTML/CSS/JS shop (prvi klijentski projekt) vs moderni Protos Web stack
- **Bez live shop linka** (po zahtjevu)
- Bodulica repo (`/home/protos/sandboxes/Bodulica`) — **nije diran**

### Socijalne mreže & freelance struktura
- Novi `src/lib/team-profiles.ts` — `studioSocialItems`, `darioSocialItems`, `martinaSocialItems`, `freelancePlatformItems`
- `OnlinePresence.tsx` — 3 podsekcije: Studio | Dario | Martina + freelance platforme
- TikTok, GoLance, Upwork itd. = `href: '#'` + `pending: true` dok korisnik ne pošalje URL
- Instagram (live):
  - Studio/Dario: `https://www.instagram.com/protos_eschatos/`
  - Martina: `https://www.instagram.com/everybodycries/`
- `social-links.ts` re-exporta iz `team-profiles.ts`

### SEO entitet sloj
- Fragment IDs na `/o-meni`: `#dario-imsirovic`, `#martina-markulin`
- `AboutPage` JSON-LD u `o-meni/layout.tsx` (`buildAboutPageJsonLd`)
- Root layout: oba autora u `metadata.authors`, keywords (`protos`, `protosweb`, ASCII `Imsirovic`)
- `creator-seo.ts`: ažurirane uloge, `alternateName`, `sameAs` iz live URL-ova, person `url` s locale fragmentima
- OG: `/api/og?type=about` — template s imenima i ulogama
- `public/llms.txt` — tim, dva stacka, fragment linkovi

### Blog authorship
- Migracija `20260711030000_blog_posts_author_slug.sql` — stupac `author_slug` (`dario`|`martina`|`both`)
- **Primijenjeno na remote Supabase** (MCP `apply_migration`)
- Byline UI na blog postu + pojedinačni JSON-LD autor
- Blog index: `Blog` + `ItemList` schema (`blogIndexJsonLd`)

### GitHub hardening
- Branch protection na `main`: required check **CI**
- `security.yml`: uklonjen `continue-on-error` na critical audit
- README: `SUPABASE_SERVICE_ROLE_KEY` u GitHub secrets tablici

## SEO cilj (korisnik)

| Upit | Realno očekivanje |
|------|-------------------|
| `Protos Web`, `protosweb`, `Protos Web Zagreb` | Primarni brand cilj — entity layer spreman |
| `Dario Imsirović web developer`, `Martina Markulin UI` | Osobni entiteti — schema + about fragments |
| Samo **`protos`** | Teško (generička riječ); treba off-page + topical authority + vrijeme |

**Sljedeći SEO koraci (sutra+):**
1. GSC/Bing — resubmit `https://protosweb.eu/sitemap.xml` nakon deploya
2. Korisnik pošalje URL-ove → jedan commit u `team-profiles.ts` aktivira sve platforme
3. Portfolio projekti u Supabase (`portfolio_items`) + puni case studies
4. Blog postovi s `author_slug` po autoru (topical authority)
5. Off-page: Google Business, Clutch, sameAs profili, IndexNow (opcionalno)

## Nije commitano

- `public/design/` — untracked, namjerno izvan gita

## Ključne datoteke (brzi lookup)

```
src/lib/tech-stacks.ts          # javni stackovi
src/lib/team-profiles.ts        # social/freelance struktura
src/lib/creator-seo.ts          # Person/Org schema, AboutPage builder
src/lib/seo.ts                  # blogIndexJsonLd, author_slug JSON-LD
src/components/sections/DualStacksSection.tsx
src/components/sections/OnlinePresence.tsx
src/app/[locale]/o-meni/layout.tsx   # AboutPage schema + OG about
supabase/migrations/20260711030000_blog_posts_author_slug.sql
```

## Deploy

Push `1baa74d` → `main` → Vercel auto-deploy. Build lokalno ✅ (`npm run build`).
