---
id: protos-agent
name: Protos-Agent
site: https://github.com/ProtosEschatos/protos-agent
repo: https://github.com/ProtosEschatos/Protos-Agent
status: active
last_updated: 2026-07-20
---

# Protos-Agent

Meta-repo: memorija, konvencije i skill fileovi za **svaki AI agent** koji
radi na ProtosEschatos projektima (Protos-Web, Bodulica, budući klijenti).

## Struktura

| Direktorij         | Namjena                                                        |
| ------------------ | -------------------------------------------------------------- |
| `AGENTS.md`        | Golden Rule + tool-agnostic constitution                       |
| `rules/stack.md`   | Preferirani stack za **nove** greenfield projekte              |
| `memory/`          | Git-versioned baza znanja (sessions, learnings, projects, idx) |
| `memory/scripts/`  | Validator + index regenerator + FM backfiller                  |
| `memory/schemas/`  | Templates + JSON Schema                                        |
| `.github/workflows/validate-memory.yml` | CI za svaki push u `memory/**`         |
| `agents/`, `command/`, `skills/` | Kilo Code specifičan roster (opcionalno)         |

## Ključne konvencije

- **Session file** MORA imati YAML front-matter (`id`, `date`, `project`,
  `title`, `commits[]`, `learnings[]`, `topics[]`).
- **`id` format:** `YYYY-MM-DD-NN` (2-digit sequence po danu).
- **`memory/index.jsonl` je DERIVAT** iz session FM — generira ga
  `memory/scripts/index-from-fm.mjs`.
- **Validator** (`memory/scripts/validate.mjs`) blokira drift; CI ga runa.
- **Backfill legacy fileova** — `memory/scripts/backfill-frontmatter.mjs`
  (one-shot, idempotent).
- **`memory/projects/<slug>.md` je autoritativan** za stack tog projekta;
  `rules/stack.md` je preporuka za nove projekte, ne override.

## Aktivni projekti u ovoj bazi

- [Protos-Web](./protos-web.md) — Next.js 16 / React 19 / Vercel / Supabase
- [Bodulica](./bodulica.md) — vanilla HTML/JS / CF Pages / Supabase Edge (`status: stale`)

## Otvoreno / Sljedeći koraci

- [ ] Backfill YAML FM u 6 legacy learnings fileova (validator warna, ne error-a)
- [ ] Odlučiti hoće li se `agents/*.md` / `skills/*` refaktorirati za Cursor ili obrisati
- [ ] Wire jedan od 3 opcije iz `skills/auto-snapshot-30min/SKILL.md` (A/B/C)
- [ ] Redovita provjera `bodulica.md` — `status: stale` od 2026-07-10
