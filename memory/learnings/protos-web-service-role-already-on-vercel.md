---
id: protos-web-service-role-already-on-vercel
project: Protos-Web
extracted_from: 2026-07-22-09
topics:
  - vercel
  - supabase
  - service-role
  - forbidden-pattern
  - user-preference
---

# `SUPABASE_SERVICE_ROLE_KEY` is ALREADY on Vercel — never nag to “refresh” it

## TL;DR

**User rule (hard, repeated angrily):** the service role key **is already set** on
Vercel. Do **not** tell the owner to “osvježi / rotiraj / postavi
`SUPABASE_SERVICE_ROLE_KEY`” again unless they explicitly ask to rotate
secrets, or you have **fresh proof** the key string on Vercel is wrong
(not “401 somewhere in old logs”).

## What actually happened historically

2026-07-22 session 06 saw PostgREST `401` on `admin_sessions` when Edge/Node
used **service_role for session verify**. That was fixed by **anon
SECURITY DEFINER RPC** (`verify_admin_session_by_hash`) — not by missing env.

Agents then kept an open TODO “refresh SERVICE_ROLE on Vercel”. Owner
confirmed the var is already there. Repeating that TODO = wasted trust.

## Allowed agent behavior

- Assume `SUPABASE_SERVICE_ROLE_KEY` exists on Vercel Production (+ CI as mapped).
- If writes/assets fail: debug **code path, RLS, bucket policies, vault crypto,
  CSP, API keys for Sketchfab/Poly** — not “go refresh the service role”.
- Only mention rotation if owner asks, or after proving the *current* deployed
  key is invalid (e.g. owner-approved check, not speculation from old memory).

## Forbidden

- Opening every 3D / admin / inbox ticket with “refresh SERVICE_ROLE”.
- Treating old session-06 TODO as still actionable.
