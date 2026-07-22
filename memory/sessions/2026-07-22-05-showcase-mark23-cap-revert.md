---
id: 2026-07-22-05
date: 2026-07-22
project: Protos-Web
title: Portfolio treći frame — vraćen Mark23 CAP sa live pages.dev URL (PR #46)
run_id: cursor-2026-07-22-agent-session
commits:
  - 9fb2fa3
learnings:
  - protos-web-portfolio-repo-vs-deploy-distinction
topics:
  - portfolio-showcase
  - mark23-cap
  - cloudflare-pages
  - private-repo-public-deploy
  - correction
  - revert
tags: []
---

# Session 2026-07-22 (05) — Portfolio treći frame Mark23 CAP revert (PR #46)

## Kontekst

Nakon što je user pročitao PR #45 (security) summary, primijetio je da
je i **treći portfolio frame pogrešan** — što je pokazatelj problema
koji je proteže još od `f9f506e` (commit 2026-07-20).

Historija greške:
1. Commit `5811a94` (2026-07-20) originalno je dodao **Mark23 CAP** kao
   treći portfolio frame, sa napomenom "spojen s Apartman Mihael
   projektom" u opisu.
2. Commit `f9f506e` (isti dan, 15:47 CEST) swap-ao treći frame iz
   Mark23 CAP u **Protos Admin Console** sa objašnjenjem: "Mark23 CAP
   repo is private and would 404 for public visitors."
3. Moj PR #44 (`d6d9957`, 2026-07-22) je zatim postavio
   `admin-console.pages.dev` kao live URL za treći entry — bez da sam
   verificirao da je taj URL Cloudflare Access gated (traži sign-in).
4. Kad je user rekao "kad je bio jedan dostupan za display i public
   koji ja ne koristim", mislio je **Mark23 CAP** koji ima public
   pages.dev deploy. Ja sam ga pogrešno protumačio.

Root cause razmišljanja koje je dovelo do greške:
- `f9f506e` autor (u commit poruci) je pretpostavio da private repo
  znači nedostupan deploy. To NIJE tako — Cloudflare Pages deploy
  ima svoj public URL nezavisno od GitHub repo visibility-ja.
- Ja u PR #44 sam nastavio istu pretpostavku i nisam probao Mark23
  pages.dev URL kao alternativu prije nego što sam ušao u Cloudflare
  Access gated `admin-console.pages.dev`.

## Što je napravljeno

PR [#46](https://github.com/ProtosEschatos/Protos-Web/pull/46)
(squash `9fb2fa3`) sa 3 izmjene:

1. **`src/lib/showcase/showcase-allowlist.ts`** — treći entry vraćen na:
   ```ts
   {
     slug: 'mark23-cap',
     title: 'Mark23 Custom Admin Panel',
     tag: 'Admin Console',
     description: 'Standalone custom admin panel (React + TS, Cloudflare Pages) — spojen s Apartman Mihael projektom. Repo je privatan, ali deploy je live.',
     projectUrl: 'https://protos-web-mark23-custom-admin-panel.pages.dev',
     repoUrl: 'https://github.com/ProtosEschatos/Protos-Web-Mark23-Custom-Admin-Panel',
     posterImage: '/images/portfolio/mark23-cap.svg',
     sortOrder: 7,
   },
   ```
2. **`public/images/portfolio/mark23-cap.svg`** — poster asset vraćen iz
   pre-swap state-a (`git checkout f9f506e^ -- ...`).
3. **`public/images/portfolio/protos-admin-console.svg`** — obrisan.
4. **Apartman Mihael description** — vraćen pomen "Mark23 CAP kao admin"
   koji je bio uklonjen u `f9f506e`.

## Verifikacija

- `curl -sSI https://protos-web-mark23-custom-admin-panel.pages.dev/` → **HTTP/2 200**
- `npx tsc --noEmit` clean
- `npm run build` clean
- `rg -i 'admin-console\.pages\.dev|protos-admin-console' src/ public/` → **0 hits**
- CI checks all green: Build, Supabase Preview, Cloudflare DNS, Vercel Preview
- Squash merge na `main` (`9fb2fa3`), Vercel prod deploy pokrenut

## Odluke i tradeoffi

- **`repoUrl` ostavljen na private repo URL**: Public visitor koji klikne
  "GitHub" na kartici dobiće 404 dok user ne otvori repo za javnost. To
  je pragmatičan default — glavni CTA (`projectUrl` na live pages.dev)
  radi. Alternative bi bile: obrisati `repoUrl` (traži type change,
  breaking) ili postaviti duplicate URL (funkcionalno neispravno).
  Ako user hoće drukčije, sitan follow-up PR.
- **Description**: napisano "Repo je privatan, ali deploy je live" da
  postavlja očekivanje — visitor zna zašto GitHub link 404-a.
- **Poster asset recovery**: `git checkout f9f506e^ -- ...` je funkcionirao
  jer je stara verzija SVG-a bila 100% čist tekst (nema LFS).

## Otvoreno / Sljedeći koraci

- [ ] Ako user planira otvoriti Mark23 CAP repo za javnost (učiniti public),
  klikom na "GitHub" gumb na kartici radit će normalno. Do tada 404 je
  očekivani behavior.
- [ ] Follow-up razmisliti: bi li bilo bolje da `repoUrl` bude optional
  na tipu, tako da entry-i sa private repo-om ne prikazuju "GitHub"
  gumb uopće? Sitan refactor, ne blokira ništa.

## Reference

- PR: <https://github.com/ProtosEschatos/Protos-Web/pull/46>
- Squash commit: [9fb2fa3](https://github.com/ProtosEschatos/Protos-Web/commit/9fb2fa3)
- Reverted commit: `f9f506e` (chore(showcase): swap third frame from Mark23 CAP to Protos Admin Console)
- Prethodna korekcija sesija: [`2026-07-22-02`](2026-07-22-02-portfolio-showcase-urls-pr-44.md)
- Novi learning: [`protos-web-portfolio-repo-vs-deploy-distinction`](../learnings/protos-web-portfolio-repo-vs-deploy-distinction.md)
