---
id: 2026-07-20-05
date: 2026-07-20
project: Protos-Web
title: Visual reference library — 39 mood-boards, >320 komponenti u admin_assets
learnings:
  - protos-web-visual-asset-library
topics:
  - visual-references
  - moodboard
  - admin-assets
  - supabase-storage
  - decomposition
  - manifest
tags: []
---

# Session 2026-07-20-05 — Visual reference library

## Kontekst

User: "1 pa 2 i obrati paznju da je u vecini slika vise komponenti i efekata
u jednoj slici ako si sposoban to razaznati."

Prije toga smo napravili portfolio showcase updates (Apartman-Mihael,
Auto-Precision, Protos-Admin-Console). User je tražio da pregledam mapu
`~/Desktop/Za Protos Web/` — 39 PNG-ova / 90 MB koji služe kao inspiracija
za 3D-style komponente Protos-Weba — i onda:

1. **Spremim katalog kao learning file** u Protos-Agent.
2. **Prebacim slike u Supabase Storage** (`admin-uploads` bucket, tag
   `visual-reference`) kroz pipeline koji smo prije toga izgradili u sesiji
   2026-07-20-01 (assets pipeline).

Ključno upozorenje: **većina slika sadrži više komponenti/efekata** — treba
ih razaznati.

## Što je napravljeno

- **Vizualni pregled svih 39 fajlova** kroz Read-image tool. Rezultat:
  potvrđeno da su 30+ mood-board grid-ovi (npr. `card-3d-effects-mega-pack`
  = 16 hover state-a, `loading-animations-complete` = 12 spinner-a,
  `transition-effects-library` = 12 tranzicija).
- **Manifest `scripts/visual-references-manifest.mjs`** — 39 entry-ja,
  svaki s `filename / slug / label / group / tags / components[] /
  protosWebTargets[]`. Ukupno **320+ komponenti** ručno dekomponirano.
- **Skripta `scripts/upload-visual-references.mjs`** — dvostupanjski pipeline:
  1. `PUT storage/v1/object/admin-uploads/visual-references/<slug>.<ext>` s
     `x-upsert: true`,
  2. `POST rest/v1/admin_assets?on_conflict=storage_path` s
     `Prefer: resolution=merge-duplicates` — upsert metadatuma po slici.
  Idempotent, WARN-not-FAIL na stale service-role key (isti pattern kao
  `upload-showcase-assets.mjs`).
- **`docs/visual-references.md`** — dokumentacija: pipeline, env vars,
  kako pokrenuti, kako proširiti biblioteku.
- **`package.json`** — dodan `npm run upload:visual-references`.
- **Learning file `memory/learnings/protos-web-visual-asset-library.md`**
  — pravila dekompozicije, zamke, snippet-i.

## Odluke i tradeoffi

- **Dekompozicija u manifest, ne u imenima fajlova.** Alternativa je bila
  splittati svaku PNG na 4–16 zasebnih fajlova pa uploadati svaku posebno.
  Odbijeno jer: (a) gubimo original kompozit koji je koristan za sourcing
  kad ga se pokazuje klijentu, (b) inflation broja Storage objekata s ~39 na
  ~320+, (c) svaki sub-crop bi zahtijevao ručno kadriranje.
- **`is_published = false` po defaultu.** Biblioteka je isključivo interna.
  `getPublishedAssets()` ne smije je izvući u javni bundle.
- **GH Actions workflow otkazan.** Fajlovi žive na maintainerovom desktopu,
  ne u repou. Runner ne može do njih bez release-asset ceremonije. Rješenje:
  `npm run upload:visual-references` lokalno.
- **90 MB slika ne ide u git.** Ostaju na disku, samo se manifest i
  skripta commit-aju.
- **Stale service-role key = WARN.** User je izričito rekao "ne smaraj me
  s rotacijom kljuceva" — script tretira 401/403/signature-mismatch kao
  neblokirajuće upozorenje, nakon rotacije re-run pokupi zaostale fajlove.
- **Fantasy scene su `group: inspiration`.** `floating-islands` i
  `underwater-bioluminescent` idu u ConfiguratorScene GLB search, ne u
  React komponente.

## Upload — izvršen

Nakon originalnog blokiranja (Vercel "Sensitive" flag skriva
`SUPABASE_SERVICE_ROLE_KEY` u `vercel env pull`), user je paste-ao ključ u
chat, script pokrenut lokalno inline:

```
Source: /home/protos/Desktop/Za Protos Web
Target: https://laqnnzavwbojntfiqmxj.supabase.co
Entries in manifest: 39
Total components tracked: 335

Uploaded : 39
Warned   : 0
Failed   : 0
Missing  : 0
```

Verifikacija SQL query-jem:

```sql
select count(*) as total,
       sum((metadata->>'component_count')::int) as total_components,
       count(distinct metadata->>'group') as groups
from public.admin_assets
where 'visual-reference' = any(tags);
-- → { total: 39, total_components: 335, groups: 13 }
```

`.env.local` obrisan nakon uploada. Ključ nije zapisan nigdje osim u
shell-history-ju koji user može očistiti (`history -c`).

## Otvoreno / Sljedeći koraci

- [ ] Extend `AssetLibrary.tsx` — detail modal koji prikazuje
      `metadata.components` listu ispod svakog thumbnaila (currently je
      samo file thumbnail vidljiv).
- [ ] Kad user odabere komponentu iz manifest liste u admin panelu, opcija
      "→ target file" da otvori `protosWebTargets[0]` u editoru za wire-up.
- [ ] Odlučiti: unflag-ati Vercel "Sensitive" na service key za buduće
      lokalne skripte, ili držati flow "paste inline + očistiti" kao
      standardni obrazac.

## Reference

- Skripta: `scripts/upload-visual-references.mjs`
- Manifest: `scripts/visual-references-manifest.mjs`
- Docs: `docs/visual-references.md`
- Learning: `memory/learnings/protos-web-visual-asset-library.md`
- Prethodna sesija (assets pipeline): `memory/sessions/2026-07-20-nextjs-restore-admin-ultimate-panel.md`
