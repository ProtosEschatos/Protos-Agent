---
id: protos-web-admin-session-edge-anon-rpc
project: Protos-Web
extracted_from: 2026-07-22-06
topics:
  - admin-sessions
  - supabase
  - edge
  - middleware
  - security-definer
  - service-role
  - vercel-env
---

# Admin session verify on Edge/Node via anon SECURITY DEFINER RPC

## TL;DR

Do **not** verify admin cookies on Edge (or Node) with
`SUPABASE_SERVICE_ROLE_KEY` REST GETs to `admin_sessions`. If that key is
stale on Vercel, every admin request 401s → fail-closed → login redirect
loop (or Unauthorized 500 after the gate).

Use `POST /rest/v1/rpc/verify_admin_session_by_hash` with
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. Function is `SECURITY DEFINER`, returns
only `revoked_at` + `expires_at`, `GRANT EXECUTE` to anon. Caller must
already know the sha256 hash (no enumeration).

Writes (`createSession`, revoke) still use service_role on Vercel.
**Do not** tell the owner to “refresh” that key — it is already set
(see `protos-web-service-role-already-on-vercel`). If writes fail, debug
the code/RLS path; only discuss rotation if the owner asks or you have
fresh proof the deployed key is invalid.

## Decision tree

```
verify cookie?
  → RPC + anon key (Edge + Node)
create / revoke session?
  → service_role (must be current on Vercel)
```

## Vidi također
- memory/sessions/2026-07-22-06-sentry-rip-out-and-konfigurator-verify.md
- memory/learnings/protos-web-revokable-admin-sessions.md
- Protos-Web `src/lib/auth/admin-auth-shared.ts`, `admin-sessions.ts`
- migration `20260722042048_admin_session_verify_rpc.sql`
