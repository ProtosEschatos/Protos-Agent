---
id: 2026-07-20-09
date: 2026-07-20
project: Protos-Web
title: Assets + 3D Konfigurator crash — dijagnoza (fix još nije gotov)
commits: []
topics:
  - admin-panel
  - konfigurator
  - assets
  - r3f
  - crash
  - bug
---

# Session — 2026-07-20 · Assets / 3D Konfigurator crash

User report:
> "assets i 3D konfigurator ne rade...."

Clarification (user picked):
> `/admin/konfigurator` ruši stranicu (bijeli ekran / error boundary)

## Stanje memorije prije ove sesije

Zadnje spremljeno u Protos-Agent remote bilo je:
- `2026-07-20-08` — `/admin/prirucnik` ([08631d6](https://github.com/ProtosEschatos/Protos-Agent/commit/08631d6))
- Protos-Web remote do [2e7480d](https://github.com/ProtosEschatos/Protos-Web/commit/2e7480d) (priručnik)

Ova sesija (crash dijagnoza) **nije** bila zapisana do ovog checkpointa.

## Što je pregledano (read-only)

Relevantni fajlovi:
- `src/app/[locale]/admin/assets/page.tsx` — tanki Server Component → `AssetsWorkspace`
- `src/app/[locale]/admin/konfigurator/page.tsx` — tanki Server Component → `ConfiguratorManager`
- `src/actions/admin-assets.ts` — signed upload/read, list, CRUD (izgleda kompletno)
- `src/components/features/admin/AssetsWorkspace.tsx` — uploader + library
- `src/components/features/admin/AssetLibrary.tsx` — lista + signed thumbs + `useSceneStore.loadGltf`
- `src/components/features/admin/ConfiguratorManager.tsx` — dynamic `ConfiguratorScene` (`ssr: false`), tabovi assets / Poly.Pizza / Sketchfab / URL
- `src/components/features/admin/ConfiguratorScene.tsx` — R3F Canvas, `Environment`, `useGLTF`, `SceneErrorBoundary`
- `src/lib/stores/scene-store.ts` — Zustand scene state

## Hipoteze (još ne potvrđene runtime-om)

1. **Client crash u R3F / drei** — `Environment` HDRI ili `useGLTF` baca grešku koja escapea lokalni `SceneErrorBoundary` i ruši cijeli client tree (bijeli ekran).
2. **Import / bundle issue** — `AssetLibrary` vuče `useSceneStore` i na `/admin/assets`; manje vjerojatno za full-page crash, ali dijeljeni client tree može pojačati simptom.
3. **WebGL / Canvas mount** — parent layout (visina `lg:h-[62vh]`, overflow) + Canvas `style={{ width/height: 100% }}` — prijašnji blank-scene bug je bio “prazna scena”, user sada kaže **crash** (error boundary), pa je fokus na JS exception, ne samo prazan WebGL.
4. **Assets “ne radi”** može biti sekundarno: ista R3F/store greška, ili Supabase `admin_assets` / signed URL fail (toast error), a ne nužno isti crash.

## Što NIJE urađeno

- Nema fix commit-a u Protos-Web.
- Nema browser/runtime repro s console stackom.
- Nema potvrde da li pada i `/admin/assets` samostalno ili samo konfigurator.

## Sljedeći korak (kad user kaže “fixaj”)

1. Repro u browseru: `/admin/konfigurator` → console + React overlay.
2. Ako je R3F: ojačati error boundary oko cijelog `ConfiguratorManager` (ne samo GLTF), fallback UI umjesto bijelog ekrana.
3. Provjeriti `Environment` preset / CDN i `ContactShadows` kao crash izvore.
4. Zasebno smoke: `/admin/assets` list/upload bez Canvas-a.
5. Commit + push + memory learning kad fix prođe.
