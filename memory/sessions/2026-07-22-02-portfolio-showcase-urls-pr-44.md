---
id: 2026-07-22-02
date: 2026-07-22
project: Protos-Web
title: Portfolio showcase URLs — 3 entry-ja vode na deploy (PR #44)
run_id: cursor-2026-07-22-agent-session
commits:
  - d6d9957
topics:
  - portfolio-showcase
  - cloudflare-pages
  - content-fix
  - cloudflare-access
  - url-probing
tags: []
---

# Session 2026-07-22 (02) — Portfolio showcase URLs (PR #44)

## KOREKCIJA 2026-07-22 (5:35 CEST)

**Treći entry je postavljen na pogrešan projekt.** User je pojasnio da
treći showcase frame treba biti **Mark23 CAP**
(`https://protos-web-mark23-custom-admin-panel.pages.dev/`), NE
**Protos Admin Console** koji ima Cloudflare Access-gated deploy
(`admin-console.pages.dev`, koji za public visitor-a serve-a sign-in).

Root cause propust:
- Prethodni commit `f9f506e` (2026-07-20) je swap-ao treći frame iz
  Mark23 CAP u Protos Admin Console na osnovu pogrešne pretpostavke
  da private GitHub repo znači da je deploy nedostupan. Mark23 CAP
  pages.dev deploy je uvijek bio public i live.
- Moj PR #44 je onda pojačao tu grešku, pointing na `admin-console.pages.dev`.
- Kad je user rekao "kad je bio jedan dostupan za display i public koji
  ja ne koristim", mislio je Mark23 CAP. Ja sam pogrešno protumačio i
  otišao u Cloudflare Access gated URL.

Fix: PR [#46](https://github.com/ProtosEschatos/Protos-Web/pull/46)
(squash `9fb2fa3`) je vratio treći entry na Mark23 CAP + live pages.dev URL.

Detaljna sesija: [`2026-07-22-05-showcase-mark23-cap-revert`](2026-07-22-05-showcase-mark23-cap-revert.md).

**Novi learning ekstrahovan**: [`protos-web-portfolio-repo-vs-deploy-distinction`](../learnings/protos-web-portfolio-repo-vs-deploy-distinction.md)
— private GitHub repo NE isključuje public pages.dev deploy; uvijek probaj
live URL kao primary showcase.

---

## Kontekst

User javio da 3 kartice u `/portfolio-showcase` (3D "prozori") vode na
GitHub repo URL umjesto na deploy. Sve tri su `repoOnly: true` iz
`src/lib/showcase/showcase-allowlist.ts` — postavljene kad su projekti
tek nastali i još nisu bili deployed. Sad postoje deploy-i, treba
prebaciti CTA na live URL.

## Što je napravljeno

- Read-only audit `src/lib/showcase/showcase-allowlist.ts`: potvrđeno
  da je `projectUrl` polje single-source za CTA click; `repoUrl` je u
  tipu ali se nigdje ne konzumira u renderer-ima. Fix je čisto data
  problem — nema wiring izmjena.
- Discovery live URL-ova (deploy-i nisu bili zapisani nigdje u kodu):
  - Vercel CLI `vercel projects ls` — pokazao samo 3 Vercel projekta
    (protos-web, golden-pawn, auto-moto). Ova tri nisu tu → Cloudflare
    Pages.
  - Cloudflare API nije bio dohvatljiv (nema `CLOUDFLARE_API_TOKEN`
    u env, wrangler nije autentificiran).
  - **Pattern-probing** `https://<slug>.pages.dev` sa curl-om:
    - `apartman-mihael.pages.dev` — 200 OK, bosanski sadržaj ✅
    - `auto-precision.pages.dev` — 200 OK, "Auto Precision | Servis i Gume"
      (bosanski) ✅. `auto-precision.com` (bez slug pattern-a) je nečiji
      DRUGI biznis (WordPress, engleski) — NIJE tvoj.
    - `admin-console.pages.dev` — 200 OK, ali sadržaj je Cloudflare
      Access sign-in page. To je live deploy CRM-a, samo iza gated
      pristupa.
  - Alternative za `protos-admin-console` slug (`protos-admin.pages.dev`,
    `protoseschatos-admin.pages.dev`, `.netlify.app`, `.web.app`, itd.) —
    svi 000/404. Repo GitHub metadata `homepage: null`, `has_pages: false`.
- Fix 3 entry-ja u `src/lib/showcase/showcase-allowlist.ts`:
  - `apartman-mihael` → `https://apartman-mihael.pages.dev`
  - `auto-precision` → `https://auto-precision.pages.dev`
  - `protos-admin-console` → `https://admin-console.pages.dev`
- Uklonjen `repoOnly: true` iz sva 3 (field je definisan u tipu, ali se
  nigdje ne konzumira; ostaje u tipu za buduće koristenje).
- Verifikacija: `npx tsc --noEmit` clean, `npx eslint` clean,
  `npm run build` clean (32s, route table intact).
- PR #44 → CI clean → squash merge → commit `d6d9957` na `main`.

## Odluke i tradeoffi

- **`admin-console.pages.dev` iza Cloudflare Access**: prihvaćeno kao
  "showcase demo gate". Random visitor vidi Access sign-in page kad
  klikne — što je legitiman signal da projekt postoji i da traži demo
  pristup preko kontakta. Alternative bi bio (a) napraviti javnu demo
  verziju (više posla) ili (b) ostaviti repo-only (nepošteno prema
  usporedbi sa ostala 2). User je eksplicitno rekao "svih tri, jedan
  je bio dostupan za display".
- **URL probing umjesto Cloudflare API**: brže i ne traži CF token.
  Radi jer je pages.dev naming pattern deterministički (slug =
  repo-name-lowercased).
- **Odbijeni `auto-precision.com`**: ekstenzivna verifikacija sadržaja
  (curl → title + h1) potvrdila da je to nezavisan biznis. Ne smije se
  koristiti (linkovanje na tuđi biznis = pogrešan showcase + potencijalna
  konfuzija visitor-a).
- **Ostavljen `repoOnly?: boolean` u tipu**: field može trebati u
  budućnosti (npr. za projekte koji su stvarno bez deploy-a). Nije
  breaking change.

## Otvoreno / Sljedeći koraci

- [ ] Ako `admin-console.pages.dev` demo pristup postane bitan za
  konverziju posjetitelja, razmisliti o public read-only demo instanci
  sa seed data (mini staging bez Access-a).

## Reference

- PR: <https://github.com/ProtosEschatos/Protos-Web/pull/44>
- Squash commit: [d6d9957](https://github.com/ProtosEschatos/Protos-Web/commit/d6d9957)
- Live URL-ovi:
  - <https://apartman-mihael.pages.dev>
  - <https://auto-precision.pages.dev>
  - <https://admin-console.pages.dev> (Cloudflare Access gated)
