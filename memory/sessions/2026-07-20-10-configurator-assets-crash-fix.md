---
id: 2026-07-20-10
date: 2026-07-20
project: Protos-Web
title: Fix — /admin/konfigurator + /admin/assets error boundaries (PR #41)
run_id: cursor-2026-07-20-agent-session
commits:
  - 27c5f5e
learnings:
  - protos-web-app-router-error-boundaries
topics:
  - admin-panel
  - konfigurator
  - assets
  - error-boundary
  - r3f
  - bugfix
  - app-router
tags:
  - followup
---

# Session 2026-07-20 — Konfigurator + Assets crash fix

## Kontekst

Nastavak sesije `2026-07-20-09-configurator-assets-crash.md`. Prethodno je
bio zapisan samo diagnostic pass (nema fix commit-a); user zatražio
"provjeri, ima posla" pa smo krenuli u fix.

## Root cause (potvrđeno)

Cijelo `Protos-Web` App Router stablo **nije imalo nijedan `error.tsx` ni
`global-error.tsx`**. Bilo koji client throw pod `/admin/konfigurator`
(R3F Canvas mount, `Environment` HDRI, `useGLTF`, Sketchfab/PolyPizza
paneli) ili `/admin/assets` (uploader / library) propuhao je do
Next.js-ovog generic handlera → bijeli ekran.

Obje rute dijele `useSceneStore` (uvučen preko `AssetLibrary`), što
objašnjava zašto se "assets ne rade" javljalo sinkrono s crashom
konfiguratora — jedno client stablo pada, oba prikaza gube UI.

Postojeći `SceneErrorBoundary` u `ConfiguratorScene.tsx` je pokrivao
samo `Environment` i `LoadedGltf`; `<Primitive />`, `<ContactShadows>`,
`<OrbitControls>` i sam `<Canvas>` mount bili su nezaštićeni. Dodatno
`ConfiguratorManager` nije imao vanjski error boundary za sve child
panele (chat, controls, tabs).

## Što je napravljeno

1. **Novi reusable client boundary** — `src/components/ui/ClientErrorBoundary.tsx`
   (class, admin-styled fallback + reset gumb, opcionalni custom fallback,
   `onError` hook za buduću audit integraciju).

2. **Novi Next.js segment error boundaries**:
   - `src/app/[locale]/admin/error.tsx` — admin fallback s "Pokušaj ponovo"
     i linkom na `/admin`.
   - `src/app/[locale]/error.tsx` — locale-level safety net za javne rute.
   - `src/app/global-error.tsx` — zadnja crta s vlastitim `<html>/<body>`
     per Next.js contract.

3. **`ConfiguratorManager`** wrappan cijeli u `ClientErrorBoundary`; per-panel
   boundary-ji oko `ConfiguratorScene` (s custom text fallbackom umjesto
   praznog Canvasa), `SceneChatPanel`, `ConfiguratorControls`, i svakog
   taba (Assets / Poly.Pizza / Sketchfab).

4. **`AssetsWorkspace`** — outer boundary + odvojene boundary-e oko
   `AssetUploader` i `AssetLibrary`.

5. **`ConfiguratorScene`** — `SceneErrorBoundary` proširen na `<Primitive />`,
   `<ContactShadows>`, `<OrbitControls>`.

## Verifikacija

- `npx tsc --noEmit` — clean.
- `npx eslint` na touched fajlovima — clean (dva namjerna `<a>` u
  boundary-ima disable-ana per-linijski jer full reload iz error tree-a
  je bolji od `Link` reuse-a broken stabla).
- `npm run build` — passes (14 admin ruta + 7 lokala bilda; error boundary
  route-ovi prepoznati).

## Odluke i tradeoffi

- **Više malih boundary-ja umjesto jednog outer**: da bi crash u jednom
  panelu (npr. Sketchfab fetch failure) ostavio ostatak scene / kontrola
  interaktivnim, umjesto full-page fallbacka. Cijena je verbositet u
  `ConfiguratorManager`, ali admin UX >> DX ovdje.
- **`<a href="/">` u error boundary umjesto `Link`**: intentional full
  navigation — ako je client tree pao, ne želimo ga reusa-ti kroz `Link`.
  `eslint-disable-next-line` per linija.
- **Boundary poruke na hrvatskom** (admin-only UI); global-error je
  neutralnih boja jer se render prije root layout-a.
- **Nema Sentry integracije ovaj rev** — `ClientErrorBoundary.onError` je
  već exposed kao API, follow-up wiring u `audit_events` je odvojen PR.

## Otvoreno / Sljedeći koraci

- [ ] Merge PR #41 nakon što user provjeri live
- [ ] Post-merge: user testira `/admin/konfigurator` i `/admin/assets`
      na produkciji; ako se scenario "bijeli ekran" ponovi, sada je barem
      poruka vidljiva → možemo debugirati konkretan throw
- [ ] Follow-up: wire `ClientErrorBoundary.onError` → `audit_events`
      (Sentry-lite in-house)
- [ ] Iščešljati ostatak client-heavy admin panela istim patternom
      (`/admin/inbox`, `/admin/publish`, `/admin/audit`)
- [ ] Ako se ustanovi konkretan R3F/drei crash source, ciljati fix
      (npr. `Environment` HDRI CDN fallback, WebGL detection prije Canvas
      mount-a)

## Reference

- PR: <https://github.com/ProtosEschatos/Protos-Web/pull/41>
- Commit: [27c5f5e](https://github.com/ProtosEschatos/Protos-Web/commit/27c5f5e)
- Predsjesija (dijagnoza): `memory/sessions/2026-07-20-09-configurator-assets-crash.md`
- Learning: `memory/learnings/protos-web-app-router-error-boundaries.md`
