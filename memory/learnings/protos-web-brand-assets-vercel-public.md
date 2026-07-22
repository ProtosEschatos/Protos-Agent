---
id: protos-web-brand-assets-vercel-public
project: Protos-Web
extracted_from: 2026-07-22-07
topics:
  - branding
  - vercel
  - public-assets
  - supabase-storage
  - favicon
  - architecture
---

# Brand UI assets live on Vercel `public/` (not invent CDN first)

## TL;DR

Agreed architecture for Protos-Web:

| Content | Where |
|---------|--------|
| Brand visuals (logo, favicon, boot art) | **Vercel** `public/` (served with the site) |
| CMS text / blog / portfolio rows | **Supabase** tables |
| Large admin uploads | Supabase Storage (`admin-uploads`, etc.) |

Do not block shipping brand work on Supabase Storage upload. Optional CDN
mirror to `site-assets/brand/` only if MCP/credentials available — never
`vercel env pull` without explicit user approval.

## Favicon realities

- Production layout points at Vercel `public/` assets (`server: Vercel`).
- Old orange favicon may still exist on Supabase CDN — **unused** if layout
  does not reference it.
- Google SERP favicon lags (cache). Ship PNG ≥48px (`favicon-48.png`) + SVG;
  hard-refresh / wait for Google recrawl — do not thrash redesigns for SERP.

## Agent ops

- Prefer shipping PNG/SVG under `public/brand/` + React `ImLogo` for motion.
- Do not invent migration stamps or Storage uploads as a substitute for
  fixing the live mark the site actually serves.
