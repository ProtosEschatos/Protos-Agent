---
id: protos-web-local-3d-toolchain
project: Protos-Web
extracted_from: 2026-07-22-08
topics:
  - 3d
  - blender
  - krita
  - gltf
  - r3f
  - toolchain
  - forbidden-pattern
---

# Protos-Web local 3D toolchain (Blender → GLB → R3F)

## TL;DR

Local pipeline for Protos-Web 3D work must stay aligned with the **existing**
Next 16 + React 19 runtime:

`three@0.185` + `@react-three/fiber@9` + `@react-three/drei@10`

**Do not** install TresJS, Babylon, or a second `three` major.

## Host tools

| Tool | How | Role |
|------|-----|------|
| Blender 4.0.2 | apt `/usr/bin/blender` | model + UV + export `.glb` |
| Krita 5.3.x | Flatpak `org.kde.krita` + `~/.local/bin/krita` wrapper | PBR / texture paint |
| numpy (user) | `pip3 install --user --break-system-packages numpy` | required for apt Blender glTF export (system Python 3.12) |

Blender apt package may warn that Draco `.so` is missing — compress with
`gltf-transform` instead of Blender Draco.

## Project CLI (devDependencies only)

In `Protos-Web/package.json`:

- `@gltf-transform/cli` — `npm run 3d:inspect` / `3d:optimize`
- `gltf-pipeline` — `npm run 3d:pipeline`
- `gltfjsx` — `npm run 3d:jsx` (GLB → R3F TSX; does not affect prod until imported)

## Workflow

1. Model/UV in Blender → Export glTF 2.0 Binary (`.glb`)
2. Textures in Krita → assign in Blender materials
3. `npm run 3d:optimize -- in.glb out.glb`
4. App: `useGLTF(url)` (Configurator) **or** `npm run 3d:jsx -- model.glb -o Model.tsx -t`

## Forbidden

- Bumping `three` / R3F / drei without an explicit request
- Adding TresJS / Babylon / Vue 3D stacks to this repo
- Treating apt Krita as required — Flatpak user install is the working path when sudo apt is blocked
