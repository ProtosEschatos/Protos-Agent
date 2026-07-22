---
id: 2026-07-22-09
date: 2026-07-22
project: Protos-Web
title: Memory dump — SERVICE_ROLE already on Vercel; online 3D = CSP/proxy not local CLI
run_id: cursor-2026-07-22-memory-dump-service-role
commits:
  - 7d55989
learnings:
  - protos-web-service-role-already-on-vercel
  - protos-web-brand-mark-effects-not-redesign
  - protos-web-brand-assets-vercel-public
  - protos-web-gmail-studio-removed
  - protos-web-local-3d-toolchain
topics:
  - supabase
  - service-role
  - vercel
  - konfigurator
  - csp
  - gltf-proxy
  - agent-failure
  - memory-dump
tags: [memory-dump, production]
---

# Session 2026-07-22 (09) — Full dump + SERVICE_ROLE ban

## Owner order

**Memorize everything. Stop repeating `SUPABASE_SERVICE_ROLE_KEY` refresh.**
Key is already on Vercel. Do not nag again.

## Hard user preferences (carry forward)

1. GitHub `origin/main` = SoT; ship via PR + merge.
2. Do **not** invent UI / logo — I'M = effects from refs only (sesija 07).
3. Brand visuals → Vercel `public/`; CMS → Supabase tables; large uploads → Storage.
4. No `vercel env pull` without explicit approval.
5. No homemade Supabase migration stamps.
6. Gmail studio **removed** — do not reopen.
7. Local Blender/Krita/gltf CLI ≠ “make 3D work online”. Online = live site.
8. **Never** tell owner to refresh `SUPABASE_SERVICE_ROLE_KEY` (already on Vercel).
   Learning: `protos-web-service-role-already-on-vercel`.

## What shipped today (relevant)

| Item | Status |
|------|--------|
| I'M logo effects PR #62 | merged earlier |
| Local 3D toolchain (Krita Flatpak, gltf CLI) | host + PR #63 merged — **optional host tooling only** |
| Online konfigurator CSP + `/api/admin/gltf-proxy` PR #64 | **merged** `2026-07-22T16:58:50Z` |
| Gmail remove #54–#55 | done earlier |

## Online 3D — real blockers (NOT service_role nag)

After PR #64:
- External GLB load goes through same-origin admin proxy (CSP fixed).
- Poly.Pizza requires `POLY_PIZZA_API_KEY` or vault `polypizza`.
- Sketchfab needs `SKETCHFAB_API_TOKEN` or vault `sketchfab` **if** using those tabs.
- Assets/signed URLs use existing service_role on Vercel — if something fails,
  debug the failure; do **not** ask to re-add the key.

## Agent failures this day (do not repeat)

- Invented logo redesigns instead of effects on I/M.
- Installed local CLI/2D tools when user wanted **online** konfigurator working.
- Kept saying “refresh SERVICE_ROLE on Vercel” after it was already there.

## Open (real)

- [ ] Optional: Sketchfab / Poly keys if owner uses those import tabs
- [ ] Dead `SENTRY_*` / leftover `GMAIL_STUDIO_*` on Vercel — delete when owner wants
- [ ] SR blogs / `localePrefix: never` — only if owner asks again
- [ ] I'M logo polish — effects only, no redesign

## See also

- Sesije 07 (logo/gmail), 08 (local toolchain), learning service-role-already-on-vercel
