# Protos-Agent Memory

Trajna baza znanja za AI agente — odluke, projekti, greške i obrasci iz
stvarnog rada. Sve je plain Markdown + jedan JSONL index. Bez proprietary
formatova; svaki agent (Cursor, Kilo, Claude Code, Codex, ChatGPT) može ovo
konzumirati i pisati.

Cjelovita "constitution" agenata je [`../AGENTS.md`](../AGENTS.md); ovaj file
opisuje samo **shemu** i **workflow** za pisanje u `memory/`.

---

## Struktura

| Put                     | Svrha                                                                       |
| ----------------------- | --------------------------------------------------------------------------- |
| `memory/projects/*.md`  | Jedan evergreen sažetak po projektu (stack, tajne, ključne putanje, TODO)   |
| `memory/sessions/*.md`  | Jedan datirani log po značajnom checkpointu rada                            |
| `memory/learnings/*.md` | Ponovno upotrebljivi obrasci i fix-evi (izvučeni iz sesija, generalizirani) |
| `memory/index.jsonl`    | Jedan JSON red po sesiji; machine-readable index                            |
| `memory/scripts/`       | Utility skripte (validator, jsonl-from-frontmatter)                         |
| `memory/schemas/`       | Front-matter / index row templates                                          |

---

## Session file schema

Svaki file u `memory/sessions/` MORA imati YAML front-matter:

```yaml
---
id: 2026-07-20-01                    # YYYY-MM-DD-NN (2-digit sequence in day)
date: 2026-07-20                     # ISO 8601 (YYYY-MM-DD)
project: Protos-Web                  # exact name as in projects/<slug>.md
title: Next.js restore + Ultimate admin panel
run_id: 1a3c2640                     # optional: agent-run/chat identifier
commits:
  - 17f80c74                         # 8-char short SHA (consistent!)
learnings:
  - protos-web-ai-cascade            # slug matches memory/learnings/<slug>.md
topics:
  - ai-cascade
  - stripe-donations
  - referrals
tags: [production, admin-panel]      # optional free-form
---

# Session 2026-07-20 — Next.js restore, Ultimate admin panel, donations

## Kontekst
...
```

Rules:

- `id` MUST be globally unique (`YYYY-MM-DD-NN`); if you make a second session
  on the same day, use `-02`, `-03`, …
- `date` MUST match the date embedded in `id`.
- `project` MUST exist as a file at `memory/projects/<slug>.md`.
- `commits[]` uses **8-character short SHAs** (git default `--abbrev=8`).
- `learnings[]` entries are file slugs without `.md`.
- `topics[]` are free-form kebab-case; used for later grep / search.
- Filename convention: `YYYY-MM-DD-<slug>.md`. The `<slug>` should match the
  first 3–5 significant words of the title (kebab-case). One file per session
  `id`, not per day — multiple sessions per day are OK.
- Heading convention: `# Session YYYY-MM-DD — <human title>`. English framing;
  Croatian body OK.
- No overlapping date ranges in the title. If work spans midnight, close one
  session and start a new one.

---

## Learning file schema

```yaml
---
id: protos-web-ai-cascade
project: Protos-Web
extracted_from: 2026-07-20-01        # session id (references the origin)
topics:
  - ai
  - deepseek
  - gemini
  - gpt-oss
---

# GPT-OSS-120B / DeepSeek / Gemini cascade in Protos-Web admin

Reusable pattern for JSON-mode AI calls with failover.
...
```

Rules:

- Learning files reference their originating session by `id`; they don't
  duplicate the incident narrative — only the *generalised* rule / snippet.
- Add cross-links (`See also: memory/sessions/2026-07-19-*.md`) if multiple
  sessions produced the same lesson.

---

## Project file schema

```yaml
---
id: protos-web
name: Protos-Web
site: https://www.protosweb.eu
repo: https://github.com/ProtosEschatos/Protos-Web
status: active
last_updated: 2026-07-20
---

# Protos-Web

... evergreen summary ...
```

Rules:

- Project files are **evergreen** — you edit them, you don't append forever.
  Keep a `## Timeline` section for milestones (short bullets) and let sessions
  hold the detail.
- Bump `last_updated` on every meaningful edit.
- `status: active | maintenance | archived | stale` — mark `stale` if there
  hasn't been a session in > 14 days and you can't confirm the state is OK.

---

## `index.jsonl` schema

One JSON object per line (JSON Lines, not a JSON array). Order: ascending by
`date`, then by `id` sequence.

```jsonc
{
  "id": "2026-07-20-01",                                       // = session front-matter id
  "date": "2026-07-20",                                        // = session front-matter date
  "project": "Protos-Web",
  "session": "memory/sessions/2026-07-20-nextjs-restore-admin-ultimate-panel.md",
  "project_doc": "memory/projects/protos-web.md",              // optional
  "learnings": ["memory/learnings/protos-web-ai-cascade.md"],  // 0..N paths
  "commits": ["17f80c74", "d1741a2c"],                         // 8-char SHAs
  "topics": ["ai-cascade", "stripe-donations", "referrals"],
  "title": "Next.js restore, Ultimate admin panel, donations"
}
```

Rules:

- Every field is REQUIRED except `project_doc` and `learnings` (default `[]`).
- `id` is the join key across sessions ↔ index rows. Two rows with the same
  `id` = validator error.
- SHA length: fixed at 8 characters. `git log --abbrev=8 --pretty=format:%h` is
  the canonical command.
- Paths are POSIX (forward slashes), relative to repo root.
- Do not hand-edit this file — generate it from session front-matter (see
  §Scripts). Manual entries are OK as long as they pass the validator.

---

## Workflow (append after every meaningful checkpoint)

```
1) Write memory/sessions/<id>.md    ← YAML front-matter + narrative
2) Optional: add memory/learnings/<slug>.md if you extracted a rule
3) Update memory/projects/<name>.md ← bump last_updated, timeline bullet, TODO
4) Append the derived row to memory/index.jsonl
5) node memory/scripts/validate.mjs
6) git add memory/ && git commit -m "docs(memory): session <id>" && git push
```

The GitHub Action `.github/workflows/validate-memory.yml` runs the validator on
every push touching `memory/**`. Any drift (missing field, dangling path,
duplicate id, wrong SHA length, out-of-order date) fails the check.

---

## Scripts

| Script                         | Purpose                                                       |
| ------------------------------ | ------------------------------------------------------------- |
| `memory/scripts/validate.mjs`  | Validates every session, learning, and index row against schema |
| `memory/scripts/index-from-fm.mjs` | Regenerates `index.jsonl` from every session's front-matter |

Both are dependency-free Node scripts (Node ≥ 20). Run with plain `node`.

---

## Aktivni projekti

- [Protos-Web](./projects/protos-web.md) — `www.protosweb.eu` (Next.js 16 + React 19, Vercel, Supabase)
- [Bodulica](./projects/bodulica.md) — `bodulica.shop` (vanilla HTML/JS, Cloudflare Pages, Supabase Edge, Stripe)

## Tajne

Nikad puni API ključevi u ovom repou. Samo *gdje* žive:

- **Vercel env vars** — Protos-Web runtime (Supabase, Stripe secret, Resend,
  admin auth, AI cascade keys).
- **Supabase Edge secrets** — Edge Functions runtime (Stripe webhook,
  donation-checkout).
- **GitHub Secrets** — CI/CD workflows (Supabase DB push, Cloudflare DNS check,
  Vercel deploy hooks).
- **Cloudflare account** — DNS, R2 storage, Pages projects.

Ako se cijela vrijednost ključa ikad pojavi doslovno u chatu, transkriptu, PR
diff-u ili commit poruci — tretiraj ga kao kompromitiran, zapiši rotate
zahtjev u odgovarajući `projects/<name>.md`, i pobrini se da rotacija bude
napravljena prije zatvaranja te sesije.
