---
description: Every ~30 minutes of active admin-panel work, pause briefly and snapshot the current session state (context, decisions, open TODOs, latest commit) into the Protos-Agent memory repo. Use when the user wants continuous memory hygiene during a long working session without manually asking to update memory.
alwaysApply: false
---

# Auto-snapshot every 30 minutes

## Purpose

Long working sessions in `/admin/*` (Protos-Web) accumulate context that never
lands in `memory/` until the session formally ends. If the agent (Cursor,
Kilo, Claude Code) crashes, the context is lost. This skill formalises a
30-minute checkpoint pattern.

**Trigger:** internal timer OR user says "checkpoint" / "snapshot" /
"memoriraj gdje smo stali".

## Runtime options

Cursor Desktop / CLI (2026+) doesn't yet ship a wall-clock timer for agents,
so we mount this in one of three ways depending on the environment:

### Option A — Cursor hook (recommended when using Cursor)

Ready to use. Copy `hooks.json.example` (repo root) to `~/.cursor/hooks.json`
(or merge with existing) and adjust `AGENT_REPO` / `TARGET_REPO` paths.

```json
{
  "hooks": [
    {
      "event": "post-tool-use",
      "match": {
        "tool": ["StrReplace", "Write", "EditNotebook"],
        "path_glob": "**/Protos-Web/src/app/[locale]/admin/**"
      },
      "throttle_seconds": 1800,
      "env": {
        "AGENT_REPO": "/home/protos/Protos-Agent",
        "TARGET_REPO": "/home/protos/Protos-Web",
        "PROJECT_SLUG": "protos-web"
      },
      "command": "node ${AGENT_REPO}/memory/scripts/checkpoint.mjs"
    }
  ]
}
```

The hook fires at most once every 30 min per session, but only after actual
admin-panel edits, so it never spams the memory repo during passive browsing.

The `checkpoint.mjs` script (`memory/scripts/checkpoint.mjs`, real, working):

1. Refuses to run if the target working tree is dirty.
2. Refuses if last checkpoint was < `MIN_INTERVAL_SEC` (default 1800s) ago.
3. Refuses if no commits landed since the last checkpoint.
4. Otherwise creates `memory/sessions/YYYY-MM-DD-checkpoint-NN.md` with
   proper front-matter, lists commit shortlogs, regenerates the index,
   validates, and pushes. If validator errors, keeps the file locally and
   does not push.

### Option B — Kilo Code / Claude Code (agent-side cron)

Add to `~/.config/kilo/hooks/on-tick.md`:

> Every 1800 seconds, if the current task involves editing files in
> `Protos-Web/src/app/**/admin/**`, invoke the `auto-snapshot-30min` skill.

The skill instructs the agent to:

1. Summarise the last 30 min in ≤ 200 words.
2. List commits made (via `git log --since=30.minutes.ago --pretty=%h`).
3. Extract open TODOs from the assistant's own recent messages.
4. Append a new session file to `Protos-Agent/memory/sessions/YYYY-MM-DD-NN.md`
   with `id: <date>-<next-seq>`, `run_id: <chat id>`, `title: Checkpoint <NN>`,
   commits[], topics[].
5. Regenerate index (`node memory/scripts/index-from-fm.mjs`).
6. Validate (`node memory/scripts/validate.mjs`).
7. Commit + push. If validator fails, do NOT push — leave the file on disk
   with a big `TODO: fix validator errors before next push` comment.

### Option C — GitHub Actions cron (host-side, no agent runtime)

For projects where the agent is stateless (e.g. cloud subagents), a scheduled
Action in Protos-Agent polls the Protos-Web repo for admin activity and, if
found, opens a PR with an auto-generated checkpoint file. Skeleton lives in
`.github/workflows/checkpoint-poll.yml.example` — not enabled by default.

## Content template (per checkpoint)

Front-matter MUST follow the standard session schema
(`memory/schemas/session.template.md`). Body is minimal:

```markdown
# Session YYYY-MM-DD — Checkpoint NN

## Sažetak posljednjih 30 min
<≤200 riječi>

## Novi commiti
- <shortsha> <first line>

## Otvoreno
- [ ] <TODO>

## Reference
- Chat: <run_id>
```

## Guardrails

- **Never push if the agent's own message history is < 5 turns** since the
  last checkpoint — nothing meaningful has happened.
- **Never push if the git working tree in Protos-Web is dirty** — checkpoint
  the state before commit, not mid-edit.
- **Never inline secret values** — even if they appear in the chat transcript,
  the snapshot script must scrub anything matching `sk_live_`, `sbp_`, `AIza`,
  `Bearer ` before writing.
- If validator warns (not errors), commit anyway; if it errors, hold the file
  locally and surface the errors to the user next time they interact.

## Status

**Ready.** Option A ships as `memory/scripts/checkpoint.mjs` + `hooks.json.example`.
Option B is per-agent-runtime configuration (Kilo/Claude Code); the checkpoint
script itself is reused. Option C skeleton is not yet wired (needs GH App
credentials to open PRs). See session `2026-07-20-02` for the design.

## Manual invocation

To fire a one-off checkpoint from the CLI (bypassing the throttle if needed):

```bash
MIN_INTERVAL_SEC=0 \
AGENT_REPO=/home/protos/Protos-Agent \
TARGET_REPO=/home/protos/Protos-Web \
PROJECT_SLUG=protos-web \
node /home/protos/Protos-Agent/memory/scripts/checkpoint.mjs
```

Use `DRY_RUN=1` to preview without writing.
