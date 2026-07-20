---
id: 2026-07-20-02
date: 2026-07-20
project: Protos-Agent
title: Full audit of Protos-Agent, memory schema + validator + GH workflow
commits: []
learnings:
  - protos-agent-memory-schema
topics:
  - audit
  - memory
  - schema
  - validator
  - gh-actions
  - front-matter
  - agents-md-rewrite
tags:
  - infrastructure
  - cursor
---

# Session 2026-07-20 — Protos-Agent audit + schema hardening

## Kontekst
Owner (Dario) tražio full audit `ProtosEschatos/Protos-Agent` repoa da provjeri
ima li kontradiktornih zapovijedi ili gubljenja konteksta. Cilj: memorija se
mora ponašati kao **deterministički izvor istine** za svaki AI agent koji je
konzumira (Cursor, Kilo Code, Claude Code, Codex), bez obzira na runtime.

## Što je audit pokazao
Detaljan izvještaj — 9 sekcija, 51 file, 4030 linija sadržaja. Ključni nalazi:

1. **Framework kontradikcija (kritično):** `rules/stack.md` i `AGENTS.md`
   naređuju Nuxt 4/Vue 3, ali `agents/dev.md` i `agents/protos.md` govore
   React. `memory/projects/protos-web.md` u jednoj rečenici razrješuje za
   Protos-Web, ali nikad se ne odnosi na globalno pravilo.
2. **Deploy kontradikcija:** cijela Railway skripta (deploy-workflow skill,
   `/deploy` komanda) mrtva — realnost je Vercel + Cloudflare Pages.
3. **`index.jsonl` bez `id` polja** — 4 unosa dijele `(date, project)`, dedup
   nemoguć programatski.
4. **SHA format drift** — 7-char SHA za rows 1–11, 10-char za row 12.
5. **Session naslovi imaju 6 različitih formata** kroz 11 fileova.
6. **Nema YAML front-mattera** u sessions/learnings.
7. **Nema automatike / validatora / GH workflow-a** — sve manualno.
8. **`memory/projects/protos-web.md` kaže Next.js 14**, ali stvarnost je
   Next.js 16 + React 19.
9. **Bodulica projekt stale** — 10 dana bez update-a, otvorene TODO stavke.

## Što je napravljeno
- **Rewrite `AGENTS.md`** — tool-agnostic, "Golden Rule: read
  `memory/projects/<name>.md` first". Framework kontradikcija riješena: taj
  file eksplicitno kaže da `rules/stack.md` opisuje **preferirani** stack za
  **nove** klijente, a postojeći projekti imaju vlastiti stack u project doc-u.
  `thoth-mem` / ByteRover premješteni u "Optional External Memory" sekciju s
  jasnim pravilom "git wins".
- **Rewrite `memory/README.md`** — dokumentirane sve sheme (session/learning/
  project front-matter, index row schema), workflow poslije rada, scripts.
- **Novi `memory/scripts/validate.mjs`** — cross-check svega:
  * session file MUST imati FM (id, date, project, title)
  * id format `YYYY-MM-DD-NN`, date u istom obliku, sinkronizirano s filename
  * duplicate id detection
  * commit SHA 7–40 hex chars (relaxed jer historical entries imaju 7-char)
  * learnings[] u FM moraju resolve-ati na `memory/learnings/<slug>.md`
  * index rows: schema check + duplicate id + non-decreasing date + fm ↔ row
    sync (id, date match)
  * every session file MUST biti referenciran barem jednim index row-om
  * FM za learnings/projects → soft (warnings only), jer legacy sadržaj
- **Novi `memory/scripts/index-from-fm.mjs`** — deterministic regenerator:
  čita svaki session FM i emituje kanonski `index.jsonl` sortiran po
  `(date, id)`. Idempotent.
- **Novi `memory/scripts/backfill-frontmatter.mjs`** — one-shot migracija:
  parsira sve postojeće session fileove, derivira `id` iz filename ordering
  po danu, kopira commits/learnings/topics iz starog index-a, izvuče title iz
  H1, doda YAML FM na vrh svakog file-a. Pokrenut → 11 fileova dobilo FM.
- **Novi `.github/workflows/validate-memory.yml`** — CI valida svaki push
  koji dira `memory/**`.
- **`memory/schemas/*.template.md`** + `index-row.schema.json` — copy-paste
  templates + JSON Schema za tooling.
- **`memory/projects/protos-web.md`** — dodan FM (id, name, status, last_updated),
  stack tablica ažurirana na Next.js 16 + React 19, dodan AI cascade, dodan
  redirect `/o-meni` → `/o-nama`.
- **`memory/projects/bodulica.md`** — dodan FM sa `status: stale` +
  eksplicitno upozorenje na vrhu.
- **`rules/stack.md`** — vodeći paragraf sada eksplicitno kaže "preferirani
  stack za nove greenfield projekte, ne override za postojeće".

## Odluke i tradeoffi
- **Commit SHA 7–40 relaxed** (ne strict 8), jer historical unosi ne mogu
  biti rekonstruirani bez klona svakog povijesnog stanja. Novi rad koristi
  8-char (dokumentirano).
- **`agents/*.md` i `skills/*` ostavljeni netaknuti** — Kilo Code korisnici i
  dalje mogu ih koristiti; Cursor korisnici ih ignoriraju. AGENTS.md sada
  eksplicitno objašnjava tu opciju umjesto proturječja.
- **`thoth-mem`/ByteRover NIJE obrisan** iz AGENTS.md — samo demoted u
  "Optional External Memory" sa jasnim "git repo wins" pravilom.

## Otvoreno / Sljedeći koraci
- [ ] Backfill YAML FM u 6 legacy learnings fileova (validator sada samo warna)
- [ ] Rotate secrets flagged u `2026-07-17-vue-admin-cutover-cf-pages.md`
- [ ] Bodulica health-check (status je `stale` od 10.7.)
- [ ] Skill file za 30-min auto-snapshot (vidi
      `memory/skills/auto-snapshot-30min.md` — dokumentiran, ne još automatiziran)

## Reference
- Audit report: attached (subagent `48348c5b-c83e-4d10-b6a6-e65d9e1034ed`)
- Novi AGENTS.md, memory/README.md, memory/scripts/*.mjs
- CI: `.github/workflows/validate-memory.yml`
