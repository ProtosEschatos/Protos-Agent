---
id: 2026-07-22-08
date: 2026-07-22
project: Protos-Web
title: Local 3D toolchain — Krita + GLTF CLI aligned with R3F
run_id: cursor-2026-07-22-3d-toolchain
commits: []
learnings:
  - protos-web-local-3d-toolchain
topics:
  - 3d
  - blender
  - krita
  - gltf-transform
  - gltfjsx
  - toolchain
tags: [local-setup, tooling]
---

# Session 2026-07-22 (08) — Local 3D toolchain

## Kontekst

User zatražio lokalne alate za 3D konstruiranje/dizajn usklađene s
Next.js + React Three Fiber stackom (bez novih frameworka).

## Što je instalirano / dodano

### Host
- **Blender 4.0.2** — već bio; potvrđen
- **Krita 5.3.2.1** — Flatpak user (`org.kde.krita`) + wrapper `~/.local/bin/krita`
  (apt sudo tražio password → Flatpak put)
- **numpy** (user, PEP 668 `--break-system-packages`) — apt Blender glTF export
  inače pada na `ModuleNotFoundError: numpy`

### Protos-Web (dev only)
- `@gltf-transform/cli`, `gltf-pipeline`, `gltfjsx`
- skripte: `3d:inspect`, `3d:optimize`, `3d:pipeline`, `3d:jsx`
- Runtime **ne dirnut**: three 0.185 / fiber 9 / drei 10

## Verifikacija
- `type-check` OK, `build` OK
- Blender export cube → `3d:inspect` / `3d:optimize` / `3d:jsx` OK

## See also
- Learning: `protos-web-local-3d-toolchain`
