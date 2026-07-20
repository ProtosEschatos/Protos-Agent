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

Add to `~/.cursor/hooks.json`:

```json
{
  "hooks": [
    {
      "event": "post-tool-use",
      "match": {
        "tool": ["StrReplace", "Write", "EditNotebook"],
        "path_glob": "**/src/app/[locale]/admin/**"
      },
      "throttle_seconds": 1800,
      "command": "node ~/.cursor/plugins/protos-agent/snapshot.mjs"
    }
  ]
}
```

The hook fires at most once every 30 min per session, but only after actual
admin-panel edits, so it never spams the memory repo during passive browsing.

`snapshot.mjs` shells out to `git log -1`, reads current chat context via
Cursor's `--print-transcript` flag (or via the transcript file at
`~/.cursor/projects/*/agent-transcripts/*.jsonl`), calls
`node memory/scripts/append-checkpoint.mjs` in the Protos-Agent repo, and
pushes.

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

Not yet automated — this file is a specification. Wire it via Option A/B/C
when the user opts in. See session `2026-07-20-02` for the discussion that led
to this skill.
