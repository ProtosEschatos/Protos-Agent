---
id: protos-web-brand-mark-effects-not-redesign
project: Protos-Web
extracted_from: 2026-07-22-07
topics:
  - branding
  - logo
  - im-logo
  - references
  - forbidden-pattern
  - user-preference
---

# Brand mark I'M — effects only, never redesign letters

## TL;DR

User order (repeated, angry when violated): brand mark is letters **I ’ M**.
Apply **visual effects from reference images** to those letters. Do **not**
invent new letterforms, swap glyphs (M/R plates), “improve” layout, or ship
a different logo. Wrong letter = failure even if effects look cool.

## Spec (source of truth)

| Glyph | Effect language (from Desktop refs) |
|-------|-------------------------------------|
| **I** | Cyan glow + cosmic particle swirl (M-icon ref aesthetic) |
| **M** | Metallic chrome + radiating light-burst (R-icon ref aesthetic) |
| **’** | Between I and M |

References (user Desktop; filenames may vary):
- `Screenshot_*_3D-*` swirl / cyan frame plate (M-ref)
- `Screenshot_*_3D-*` chrome / burst plate (R-ref)

Surfaces: favicon, nav, loading / boot (`ImLogo` + `public/brand/*`).

## Forbidden patterns (already failed PRs #52–#61)

- Inventing animated SVG “letter-like” shapes that are not I/M
- Embedding raw M/R PNG plates and calling that the logo
- Hand-broken path glyphs that read as W / upside-down M / wrong letter
- Unifying into a “better” wordmark that changes spacing/identity without ask
- CSS `@keyframes` inside SVG served as `<img>` — **animation does not run**;
  animate in React (`framer-motion` on `ImLogo`)

## Required pattern

1. Keep **real upright typography** (SVG `<text>` I / ’ / M preferred over
   invented paths).
2. Layer effects only: bloom, particles/swirl on I; chrome gradient + rays on M.
3. Same dark navy plate + cyan rounded frame language as refs — do not invent
   a new plate system unless user asks.
4. Ship via PR → merge → verify live hard-refresh.

## Key paths

- `src/components/ui/ImLogo.tsx`
- `public/brand/im-logo.png`, `public/favicon.svg`, `public/favicon-48.png`
- Boot veil / `PageLoader` / Header / Footer consumers

## See also

- `memory/learnings/protos-web-brand-assets-vercel-public.md`
- Session `2026-07-22-07`
