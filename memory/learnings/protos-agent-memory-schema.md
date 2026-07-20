---
id: protos-agent-memory-schema
project: Protos-Agent
extracted_from: 2026-07-20-02
topics:
  - memory
  - schema
  - front-matter
  - validator
---

# Deterministički memory pipeline (front-matter → index.jsonl → validator)

## TL;DR
Session files nose autoritativan YAML front-matter. `index.jsonl` je derivat
generiran skriptom `index-from-fm.mjs`. Validator (`validate.mjs`)
cross-checka sve, i CI ga runa na svaki push u `memory/**`. Manuelno
editiranje `index.jsonl` je moguće, ali validator će ga baciti ako drifta od
FM.

## Kontekst
Bez ovog pipeline-a događalo se:
- 4 index rowa s istim `(date, project)`, nemoguć dedup
- SHA-ovi različitih dužina (7 vs 10 chars) u istom file-u
- Session naslovi u 6 različitih formata kroz 11 fileova
- Learning fileovi copy-paste-ali cijele blokove iz session-a (silent drift)

## Snippet — session front-matter (obavezno)

```yaml
---
id: 2026-07-20-02              # YYYY-MM-DD-NN (2-digit seq per day)
date: 2026-07-20               # ISO
project: Protos-Agent          # exact name; must have memory/projects/<slug>.md
title: Short human title       # single line, no date prefix
commits:
  - 12345678                    # 7–40 lowercase hex chars
learnings:
  - protos-agent-memory-schema  # bare slugs, must have memory/learnings/<slug>.md
topics: [audit, memory]         # inline list also OK
---
```

## Snippet — validator run

```bash
node memory/scripts/validate.mjs
# ✓ All memory files pass validation.
# Warnings-only exit code = 2 (still passes CI)
# Any error → exit 1, CI fails
```

## Snippet — regenerate index.jsonl

```bash
node memory/scripts/index-from-fm.mjs
# Wrote memory/index.jsonl with N rows.
# Deterministic sort: (date asc, id asc)
```

## Common failure modes (validator catches all)

| Symptom                                              | Root cause                                 |
| ---------------------------------------------------- | ------------------------------------------ |
| `duplicate session id "..."`                         | Two sessions share `id`, or index row and FM disagree |
| `commit "abc" must be 7–40 hex chars`                | Full-SHA or non-hex garbage                |
| `session id "..." is not referenced by any row`      | Wrote session file, forgot to regenerate index |
| `session file "..." does not exist`                  | Index references a session that was renamed/deleted |
| `date "..." out of order`                            | Manually inserted row above a newer one    |

## Vidi također
- `memory/README.md` — full schema documentation
- `memory/sessions/2026-07-20-agent-audit-schema-hardening.md` — origin session
- `memory/scripts/{validate,index-from-fm,backfill-frontmatter}.mjs`
- `.github/workflows/validate-memory.yml`
