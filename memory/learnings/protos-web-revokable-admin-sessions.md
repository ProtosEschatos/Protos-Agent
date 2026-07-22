---
id: protos-web-revokable-admin-sessions
project: Protos-Web
extracted_from: 2026-07-22-03
topics:
  - admin-auth
  - session-management
  - opaque-token
  - sha256
  - supabase
  - rls
  - service-role
  - edge-runtime
  - node-runtime
---

# Revokable admin sessions — opaque token + DB row + sha256 hash

## TL;DR

Za admin auth: **nikad HMAC(secret)** kao cookie value (svi cookie-i su
byte-identični, revoke traži rotaciju secret-a). Umjesto toga:
- Cookie value = `randomBytes(32).toString('hex')` (64 chars, opaque).
- DB row drži `sha256(token)` u `token_hash` column (UNIQUE + INDEX).
- `verify` = query po `token_hash`, provjeri `revoked_at IS NULL` + `expires_at > now()`.
- Revoke = set `revoked_at = now()` na jedan row (bez utjecaja na ostale).

## Kontekst

**Kada primijeniti:**
- Bilo koji custom admin/user auth gdje ne koristiš gotovi Auth provider
  (Supabase Auth, Clerk, NextAuth, Auth0).
- Kada treba per-session revoke, IP/UA tracking, "log out all other
  devices" funkcionalnost.

**Kada NE primijeniti:**
- Ako Supabase Auth / Clerk / NextAuth već rješava tvoj auth — nemoj
  duplirati infrastrukturu, koristi njihove server-side revoke API-je.

**Trade-off:** +1 DB query per admin request. Za low-traffic admin panel
(<100 QPS) nevidljivo. Za high-traffic user session — cache-aj u Redis-u
sa short TTL.

## Snippet

**Migracija (Supabase):**

```sql
CREATE TABLE public.admin_sessions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash   text        NOT NULL UNIQUE,
  ip           text        NULL,
  user_agent   text        NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  revoked_at   timestamptz NULL
);
CREATE INDEX admin_sessions_token_hash_idx ON public.admin_sessions (token_hash);
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
-- Deliberately NO policies. service_role bypasses RLS.
```

**Create session (Node runtime, server action):**

```ts
import 'server-only'
import { randomBytes, createHash } from 'node:crypto'

const TTL_MS = 60 * 60 * 24 * 7 * 1000 // 7 days

const token = randomBytes(32).toString('hex')
const tokenHash = createHash('sha256').update(token).digest('hex')
const expiresAt = new Date(Date.now() + TTL_MS)

const { data } = await supabaseAdmin
  .from('admin_sessions')
  .insert({ token_hash: tokenHash, ip, user_agent: ua, expires_at: expiresAt.toISOString() })
  .select('id')
  .single()

// Set as httpOnly + Secure + SameSite=Lax cookie sa `expires: expiresAt`.
cookies().set('admin_session', token, { httpOnly: true, secure: true, sameSite: 'lax', expires: expiresAt })
```

**Verify (Node runtime):**

```ts
export async function verifySessionToken(token: string | null): Promise<Row | null> {
  if (!token) return null
  const tokenHash = createHash('sha256').update(token).digest('hex')

  const { data } = await supabaseAdmin
    .from('admin_sessions').select('*').eq('token_hash', tokenHash).single()

  if (!data || data.revoked_at || new Date(data.expires_at).getTime() <= Date.now()) return null

  // Timing-safe re-check (defensive; index equality is already O(1) but a
  // downstream refactor could accidentally introduce partial-match logic).
  const a = Buffer.from(data.token_hash), b = Buffer.from(tokenHash)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null

  // Fire-and-forget last_seen_at bump — never await.
  supabaseAdmin.from('admin_sessions').update({ last_seen_at: new Date().toISOString() })
    .eq('id', data.id).then(() => {}, () => {})

  return data
}
```

**Verify (Edge middleware, WebCrypto + REST):**

```ts
async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyAdminSessionEdge(token: string): Promise<boolean> {
  const url = process.env.SUPABASE_URL!
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const tokenHash = await sha256Hex(token)
  const res = await fetch(`${url}/rest/v1/admin_sessions?token_hash=eq.${tokenHash}&select=revoked_at,expires_at`, {
    headers: { apikey: svc, authorization: `Bearer ${svc}`, accept: 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok) return false
  const rows = await res.json()
  const row = rows[0]
  return row && !row.revoked_at && new Date(row.expires_at).getTime() > Date.now()
}
```

## Gotchas

- **Cookie value plaintext, DB hash-only** — nikad ne pohranjuj plaintext
  u DB, i nikad ne pohranjuj samo hash u cookie (klijent ne bi znao
  regenerirati). Ovo je isti pattern kao password hashing.
- **`sha256` je OK za opaque token verify** — nije potreban bcrypt/argon2
  jer token ima 256 bita entropije (`randomBytes(32)`), brute-force je
  matematički nemoguć. bcrypt bi bio potreban samo ako je token
  user-choosen (npr. lozinka).
- **Fire-and-forget `last_seen_at` update** — inače dodaješ ~50ms per
  request. `.then(() => {}, () => {})` da consumer promise da ga event
  loop ne kicka kao unhandled rejection.
- **Edge runtime nema `node:crypto`** — WebCrypto SHA-256 + direct REST
  fetch (ne `@supabase/supabase-js`) jer je bundle bloat.
- **RLS enabled + zero policies** — service_role bypass-a RLS, tako da
  server code radi normalno. Anon/authenticated blokirani na tabelu i
  bez policy statement-a.

## Vidi također
- memory/sessions/2026-07-22-03-security-hardening-pr-45.md
- `src/lib/auth/admin-sessions.ts` (implementacija)
- `src/lib/auth/admin-auth-shared.ts` (edge verify)
