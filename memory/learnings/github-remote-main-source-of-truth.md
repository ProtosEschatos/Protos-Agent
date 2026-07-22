---
id: github-remote-main-source-of-truth
project: Protos-Web
extracted_from: 2026-07-22-06
topics:
  - github
  - source-of-truth
  - supabase
  - migrations
  - mcp
  - forbidden-pattern
---

# GitHub `origin/main` = source of truth (not local, not MCP alone)

## TL;DR

User rule, repeated: **remote GitHub repo is the source of truth.** Local
disk and MCP side-effects are not. After any Supabase MCP `apply_migration`,
the remote `schema_migrations` version stamp wins — rename the local SQL
file to that exact stamp **before** commit/push. Never push a homemade
timestamp and leave remote on a different one (Supabase Preview:
`Remote migration versions not found in local migrations directory`).

## Failure (2026-07-22)

1. MCP applied `admin_session_verify_rpc` → remote version **`20260722042111`**
2. Repo committed file as **`20260722042048_…`**
3. Preview red on `main` until PR #51 renamed to match remote

Memory already said this (`protos-web.md` Migration lock; session
`2026-07-19-migration-lock`). Agent ignored it. Do not ignore again.

## Required sequence

```
1. git fetch && work from origin/main
2. list_migrations (MCP) — know remote versions first
3. apply_migration (MCP) if needed
4. list_migrations AGAIN — copy the exact new version stamp
5. Write/rename supabase/migrations/<EXACT_STAMP>_<name>.sql
6. commit + push + PR
7. Confirm Supabase Preview green
```

## Forbidden

- Treating local `supabase/migrations/` inventiveness as authority over remote
- Committing a stamp that differs from `list_migrations`
- Explaining Preview red as “duplicate files” when it is stamp drift

## Vidi također

- memory/projects/protos-web.md (Migration lock)
- memory/sessions/2026-07-19-migration-lock-cf-cache-poison.md
- memory/sessions/2026-07-22-03-security-hardening-pr-45.md (MCP re-timestamp note)
- PR #51 (`0b296b7`)
