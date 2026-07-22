---
id: protos-web-portfolio-repo-vs-deploy-distinction
project: Protos-Web
extracted_from: 2026-07-22-05
topics:
  - portfolio-showcase
  - github
  - cloudflare-pages
  - repo-visibility
  - deploy-visibility
  - showcase-allowlist
  - decision-pattern
---

# Private GitHub repo NE isključuje public deploy — uvijek probaj live URL

## TL;DR

Za portfolio / showcase kartice: **repo visibility ≠ deploy visibility**.
Cloudflare Pages, Vercel, Netlify, itd. deploy-i imaju svoj public URL
neovisan od GitHub repo statusa. Prije nego što donesetš odluku da neki
projekt "nije showcase-friendly" jer je repo private:

1. `curl -sSI https://<slug>.pages.dev/` — probaj default pattern
2. `curl -sSI https://<slug>.vercel.app/` — Vercel default
3. Pogledaj vlasnikov production custom domain

Ako bilo koji od ovih daje 200 OK → projekt JESTE showcase-friendly.
`projectUrl` treba biti taj live URL, ne repo URL, ne "gated" alternative.

## Kontekst

**Kada primijeniti**: bilo koji task koji dodaje / mijenja entry u
`src/lib/showcase/showcase-allowlist.ts` ili slično portfolio-related
konfiguraciji.

**Ne primijeniti**: ako je projekt zaista nedeployed (samo repo,
`gh-pages` isključen, nema `.pages.dev` / `.vercel.app` / custom
domena) — tada je `repoOnly: true` legitiman.

## Konkretna greška iz 2026-07-20 do 2026-07-22

Commit `f9f506e` (2026-07-20) je swap-ao portfolio treći frame iz
Mark23 CAP u Protos Admin Console sa opravdanjem:
> "Mark23 CAP repo is private and would 404 for public visitors."

Ali `https://protos-web-mark23-custom-admin-panel.pages.dev/` je uvijek
bio public i live (200 OK). Private repo znači samo da klik na "GitHub"
gumb 404-a — ne blokira live deploy pristup.

Kaskadna greška u PR #44 (`d6d9957`, 2026-07-22): novi treći entry
(Protos Admin Console) je pointed na `admin-console.pages.dev`, ali
taj deploy je Cloudflare Access gated (serve-a sign-in page javnosti).
Trebalo je probati druge alternative prije nego što se ušlo u gated URL.

Fix u PR [#46](https://github.com/ProtosEschatos/Protos-Web/pull/46)
(squash `9fb2fa3`) — treći frame vraćen na Mark23 CAP + live pages.dev URL.

## Snippet — decision tree

```
For each portfolio entry:

  1. Does the project have a live deploy?
     ├─ Yes → probe URLs (do NOT rely on repo state):
     │        - <slug>.pages.dev
     │        - <slug>.vercel.app
     │        - custom domain from vercel projects ls / cloudflare API
     │
     │  Live URL returns 200 → set as projectUrl. Done.
     │  All URLs 4xx/5xx → treat as no deploy, go to step 2.
     │
     └─ No → repoOnly: true, projectUrl = repo URL.

  2. Is the live URL gated (Cloudflare Access, HTTP Basic Auth, etc.)?
     ├─ Yes → NOT showcase-friendly. Either:
     │        - Find alternative live URL (staging, preview)
     │        - Mark as repoOnly with note "Demo available on request"
     │        - Skip the entry entirely
     │
     └─ No → use as projectUrl.
```

## Gotchas

- **`curl -sSI` ne razlikuje Cloudflare Access gated od normal 200**.
  Access-gated URL vraća 200 sa HTML sign-in page-om. Provjeri body
  content (`curl -sS <url> | head -20`) ili sadržaj `<title>` — ako je
  "Sign in with Access" ili slično, deploy JESTE tehnicki up ali NIJE
  showcase-friendly.
- **Private repo `repoUrl` na kartici**: klik na "GitHub" gumb će
  404-ati za public visitor-a. Opcije:
  - Ostavi kao pragmatičan default (glavni CTA je `projectUrl`)
  - Ekstenziraj tip da `repoUrl` bude optional
  - Napiši u description "Repo je privatan" da postaviš očekivanje
- **Ako user premjesti Mark23 u public**: ova napomena više ne vrijedi
  za taj konkretan entry.
- **Default pages.dev slug pattern**: repo naziv lowercased, sa
  `-` umjesto `_`. Za `Protos-Web-Mark23-Custom-Admin-Panel` →
  `protos-web-mark23-custom-admin-panel.pages.dev`. Ne skraćuj.

## Vidi također
- memory/sessions/2026-07-22-05-showcase-mark23-cap-revert.md (fix session)
- memory/sessions/2026-07-22-02-portfolio-showcase-urls-pr-44.md (initial wrong PR + correction annotation)
- `src/lib/showcase/showcase-allowlist.ts` u Protos-Web (source of truth)
