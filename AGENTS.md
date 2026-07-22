# Protos-Agent — Agent Instructions

Single source of truth for any AI coding agent (Cursor, Kilo Code, Claude Code,
Codex CLI, or plain LLM chat) working on projects owned by
[ProtosEschatos](https://github.com/ProtosEschatos).

This file is intentionally tool-agnostic. Anything that mentions specific MCP
servers, IDE features, or vendor UIs is optional and clearly labelled.

---

## 1. Golden Rule — Read Project Memory First

Every project owned by ProtosEschatos has a single durable summary at
`memory/projects/<name>.md` in **this repository**.

Before touching a project's code you MUST:

1. Read `memory/projects/<project>.md` in full (stack, secrets map, open items).
2. Skim the last 3 entries in `memory/index.jsonl` that reference the same
   project — you will find the current state of open work + known-broken things.
3. Only then start planning or coding.

The per-project doc is authoritative for that project's real stack. This
repository also ships a `rules/stack.md` file that describes the **default**
stack for **new** greenfield clients (Nuxt 4 + Vue 3 + Tailwind); it does **not**
override an existing project. If the project doc says the project runs on
Next.js + React + Vercel, that is the truth for that project — do not try to
migrate it without an explicit user request.

---

## 2. Memory System (this repo)

Git-versioned, plain-Markdown knowledge base. Full schema and rules live in
[`memory/README.md`](./memory/README.md); the short version:

| Path                    | Purpose                                                                     |
| ----------------------- | --------------------------------------------------------------------------- |
| `memory/projects/*.md`  | One evergreen summary per project (stack, secrets map, key paths, open TODO)|
| `memory/sessions/*.md`  | One dated log per meaningful work checkpoint                                |
| `memory/learnings/*.md` | Reusable patterns / error fixes (extracted from sessions, generalised)      |
| `memory/index.jsonl`    | One JSON row per session; the machine-readable index                        |

**After significant work you MUST:**

1. Append a new file to `memory/sessions/YYYY-MM-DD-<slug>.md` with the YAML
   front-matter described in `memory/README.md`.
2. Update the relevant `memory/projects/<name>.md` (append to timeline, adjust
   stack row if changed, tick / add TODOs).
3. If the work yielded a reusable pattern or a hard-earned fix, add a file to
   `memory/learnings/` and reference the source session in its front-matter.
4. Add a row to `memory/index.jsonl` derived from the session's front-matter.
5. Run `node memory/scripts/validate.mjs` locally to catch schema drift before
   pushing. CI runs the same validator on every push touching `memory/**`.

**Never store real secret values.** Only the env-var name and where it lives
(Vercel / GitHub / Supabase Edge / Cloudflare). If a secret ever appears
literally in an agent transcript or PR body, treat it as compromised and open a
"rotate" item in `memory/projects/<name>.md`.

---

## 3. Optional External Memory (only if configured)

Some agents / IDEs support persistent knowledge-graph MCP servers such as
`thoth-mem`, ByteRover, Context7, mem0. If they are available:

- Treat them as **derived, disposable indices** over the git-versioned memory
  in this repo, not as separate sources of truth.
- The git repo wins on every conflict. If a graph observation contradicts a
  file under `memory/`, update the graph, not the file (unless the file is
  actually stale and you fix it explicitly in the same commit).
- If a project doc changes, re-index; do not maintain the same fact by hand in
  two places.

If none of those tools are configured, this section does not apply.

---

## 4. Post-Work Workflow (agent-agnostic)

After every completed plan (all checks pass, work merged / pushed):

1. **Auto-commit** — if `git status` shows changes in the project workspace,
   `git add -A && git commit -m "<conventional message>" && git push`.
   Do not ask for permission (the user has already asked you to ship).
2. **Auto-memorise** — write the session + project + learnings + index row as
   described in §2. Do not ask for permission.
3. **Auto-derive** — if any external memory graph is configured (§3), sync it.
4. **Report** — leave the user a short summary: what shipped, what smoke-tested,
   what remains open (linked to the relevant TODO in the project doc).

Never silently drop incomplete tasks. If a plan finishes with N of M items done,
the leftover items belong in `memory/projects/<name>.md` under a dated
`Otvoreno / Open` heading, not just in chat.

---

## 5. Agent Roster (only if your runtime supports subagent dispatch)

Some agent runtimes (Cursor subagents, Kilo Code agents, Claude Code
subagents) allow named specialists. Files under `agents/` describe an
opinionated Kilo Code roster. Cursor users can safely ignore that folder — the
built-in Cursor subagents (`explore`, `generalPurpose`, `shell`, `browser-use`,
`ci-investigator`, …) cover the same needs.

If you dispatch a subagent, always instruct it to read this file and the
relevant `memory/projects/<name>.md` before doing anything.

---

## 6. Skills and Commands (optional)

Reusable instruction bundles live in `skills/` and slash-command definitions in
`command/`. They were authored for Kilo Code — Cursor users may load them
manually via the `Skill` mechanism (`.cursor/skills/`) or ignore them entirely.
They are **not required reading**; the golden rule (§1) is.

---

## 7. Constraints (universal)

- **GitHub `origin/main` is the source of truth** for every ProtosEschatos
  repo (code + migrations). Local workspace is a checkout, not authority.
  Before inventing timestamps, filenames, or “what we applied”, run
  `git fetch` + compare to `origin/main` and (for Supabase)
  `list_migrations`. Never invent a local migration stamp and hope it
  matches remote later — that is what broke Supabase Preview on 2026-07-22
  (`42048` local vs `42111` remote).
- **Supabase MCP `apply_migration`**: after apply, immediately
  `list_migrations`, then rename/commit the local SQL file to the **exact
  remote version stamp** before push. Same rule already in
  `memory/projects/protos-web.md` (Migration lock) — obey it every time.
- **Do NOT commit local IDE config** (`kilo.json`, `.cursor/`, `.vscode/`) —
  these are personal and gitignored.
- **Do NOT modify agent definition files** (`agents/*.md`, `skills/*/SKILL.md`,
  `rules/stack.md`) unless the user explicitly asks — they are policy files.
- **Prefer project-level conventions** (found in `memory/projects/<name>.md`
  and the project's own repo) over anything in this file.
- **Every UI change is responsive** — test at ≤ 375 px and ≥ 1024 px.
- **Never mention alternative AI tools** to the user unless they ask.
- **Environment defaults** — assume Linux (user runs Linux Mint Cinnamon).
  Editor is VS Codium; extensions come from Open VSX only.
- **Error boundaries (`error.tsx` / `global-error.tsx` / client boundaries)** —
  before editing, ensure the file has **no** top-level
  `import * as Sentry`, `useTranslations`, `useLocale`, or any other
  context-dependent import. Boundaries must render with plain React +
  plain `<a href>` only. See learning
  `memory/learnings/protos-web-error-boundary-self-contained.md`.
- **`'use server'` modules** — never import non-async constants/arrays into
  Client Components from those files (they are not real values on the
  client). Put shared constants in `src/lib/*-types.ts`. See
  `memory/learnings/protos-web-use-server-no-client-constants.md`.

---

## 8. Housekeeping — Contradictions & Drift

If you find that a rule in this file, a project doc, a session log, or a
learning file contradicts something you just observed in the real code /
Vercel / Supabase, do not just work around it. Do all three:

1. Fix the code / config so the reality matches the intent.
2. Update the memory file(s) so future agents see the new truth.
3. Note it in the session log so it shows up in the next daily briefing.

**This file (AGENTS.md) wins over `rules/stack.md` and `agents/*.md`.**
`memory/projects/<name>.md` wins over both, for that project.

---

## 9. Meta

- **Last audited:** 2026-07-22 (Sentry removed; error-boundary + use-server
  rules added — see `memory/sessions/2026-07-22-06-*.md`).
- **Owner:** Dario Imširović (`dario.admin@protosweb.eu`).
- **Repo:** [ProtosEschatos/Protos-Agent](https://github.com/ProtosEschatos/Protos-Agent).
