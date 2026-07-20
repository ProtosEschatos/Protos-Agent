---
id: protos-web-visual-asset-library
project: Protos-Web
extracted_from: 2026-07-20-05
topics:
  - visual-references
  - moodboard
  - admin-assets
  - supabase-storage
  - r3f
  - ui-inventory
  - decomposition
---

# Protos-Web — vizualna referentna biblioteka (39 slika / >320 komponenti)

## TL;DR

Sve slike u `~/Desktop/Za Protos Web/` su **kompozitne mood-board mreže** —
jedan PNG obično sadrži 4–16 zasebnih UI komponenti ili efekata. Katalog
smo eksplicitno **dekomponirali** u manifest (`scripts/visual-references-manifest.mjs`)
i uploadali u Supabase (`admin-uploads` bucket, prefix `visual-references/`,
`admin_assets.is_published = false`) sa strukturiranim `metadata.components`
i `metadata.protos_web_targets` po slici. Nikad ne surface-a se javno; samo
`/admin/assets` s tagom `visual-reference`.

## Kada primijeniti dekompoziciju

Kad dobiješ novu "asset paketu" od klijenta:

- **Ne** tretiraj svaku PNG kao jedan asset.
- Otvori sliku i **pobroji sub-komponente** — svaka ćelija grida je zasebna
  komponenta / efekt (loading spinner, gumb, ikona, tranzicija, cursor…).
- Za svaku sub-komponentu zabilježi: `name`, `note` (vizualni detalj),
  ciljni Protos-Web fajl gdje bi mogla ući.
- Rezultat drži u jednom manifestu, ne u imenima fajlova.

Razlog: bez dekompozicije `admin_assets` grid pokazuje 39 nedeskriptivnih
thumbnaila umjesto knjižnice od ~320 pretraživih efekata.

## Struktura kataloga (grupe → primjeri)

| Grupa         | Primjeri slika                                         | Tipični output                                                                             |
| ------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `hero`        | `hero-header-backgrounds-set.png` (8 BG-ova)           | `src/components/three/backgrounds/*Background.tsx`                                         |
| `background`  | `light-effects-backgrounds.png` (12 light FX)          | Novi `three/lighting/*` + pattern overlay                                                  |
| `cards`       | `card-3d-effects-mega-pack.png` (16 hover states)      | `src/components/ui/Card.tsx` + variant CSS                                                 |
| `icons`       | `service-card-icons.png`, `blog-category-icons.png`    | `ServiceCard`, `BlogCategoryTag`                                                            |
| `ui-controls` | `navigation-ui-set.png`, `dividers-*`                  | `Header`, `MobileMenuButton`, novi `SectionDivider`                                        |
| `forms`       | 3 varijante Contact forme (glass, constellation, shatter) | `ContactForm.tsx` + error-state variant                                                    |
| `motion`      | `text-animation-effects`, `transition-effects-library` | Novi `motion/AnimatedText.tsx`, `motion/PageTransition.tsx`                                |
| `cursors`     | 2 kolekcije po 12 (holo + liquid metal)                | `public/cursors/*` + `styles/globals.css`                                                  |
| `inspiration` | 2 fantasy scene (islands, underwater)                  | **Samo** za GLB inspiration, ne za direktni copy                                            |

Full lista po slici je u `scripts/visual-references-manifest.mjs`.
Ukupno: **39 fajlova, 320+ komponenti, 13 grupa.**

## Pipeline (dvostupanjski, idempotent)

```
~/Desktop/Za Protos Web/*.png
      │  scripts/upload-visual-references.mjs
      ▼
storage.objects  (admin-uploads/visual-references/<slug>.<ext>)
      │  PUT ... x-upsert: true
      ▼
public.admin_assets  (on_conflict=storage_path, merge-duplicates)
```

- **Storage upload** koristi `service_role` (bucket je private, RLS dozvoljava
  samo `service_role` write; anon SELECT dozvoljen samo za `is_published=true`
  redove, koje ovaj library nema).
- **REST upsert** ide na `/rest/v1/admin_assets?on_conflict=storage_path`
  s `Prefer: resolution=merge-duplicates` — omogućuje ažuriranje metadata-e
  bez brisanja retka.
- **Stale key = WARN, ne FAIL** — script prepoznaje `401/403/"signature
  verification failed"` i demotira ih na `console.warn` (isti pattern kao
  `upload-showcase-assets.mjs`). To znači: rotacija ključa nije blokirajuća
  za razvoj, upload se pokreće opet nakon rotacije.

## Snippet — kako se writeamo redak

```js
const row = {
  category: 'image',
  bucket: 'admin-uploads',
  storage_path: `visual-references/${entry.slug}.${ext}`,
  mime_type: contentType,
  size_bytes: bytes.length,
  width, height,
  original_filename: entry.filename,
  label: entry.label,
  tags: ['visual-reference', entry.group, ...entry.tags],
  metadata: {
    source: 'Za Protos Web (desktop)',
    group: entry.group,
    components: entry.components,          // ← ključni dio
    protos_web_targets: entry.protosWebTargets,
    component_count: entry.components.length,
  },
  is_published: false,
}
```

Konzumacija u `/admin/assets` je automatska — postojeći `AssetLibrary`
filtrira po tagu i renderira `metadata.components` (planirani PR: prikazati
listu komponenti unutar detail modal-a).

## Zamke koje smo izbjegli

1. **Nemoj tretirati slike kao jedan asset.** Prvi instinkt bio je uploadati
   39 fajlova s minimalnim tagovima i gotov. To je davalo useru "sranje na
   ekranu" bez ikakve pretražive vrijednosti. Detaljna dekompozicija u
   manifest je nužna, ne opcija.

2. **Ne commit-aj 90 MB fajlova u git.** Ukupna veličina slika je ~90 MB —
   ne ide u repo. Skripta čita s diska, uploada u Supabase Storage.

3. **Ne petljaj s GitHub Actions workflowom.** Fajlovi žive na maintainerovom
   desktopu, ne u repou i ne na URL-u. GH runner ih ne može dohvatiti bez
   dodatnih ceremonija (release assets / signed URL / branch commit).
   Rješenje: lokalni `npm run upload:visual-references`.

4. **`is_published` mora ostati `false`.** Inače će `getPublishedAssets()`
   izvući cijelu mood-board biblioteku u JS bundle produkcijskog sitea.

5. **Fantasy scene su za GLB inspiration, ne za web copy.** `floating-islands`
   i `underwater-bioluminescent` su render-only reference — kroz njih se
   traži GLB assets za `ConfiguratorScene`, ne portiraju se kao React
   komponente.

## Rast biblioteke

Za dodavanje: dropni fajl na desktop → dodaj entry u manifest s dekompozicijom
→ `npm run upload:visual-references`. Skripta na kraju printa listu on-disk
fajlova **koji nisu u manifestu** — čini gap eksplicitan.

## Vidi također

- `Protos-Web/scripts/visual-references-manifest.mjs` — cijeli katalog.
- `Protos-Web/scripts/upload-visual-references.mjs` — upload skripta.
- `Protos-Web/docs/visual-references.md` — user-facing dokumentacija.
- `memory/sessions/2026-07-20-05-visual-reference-library.md` — sesija.
- `memory/projects/protos-web.md` — projekt overview.
