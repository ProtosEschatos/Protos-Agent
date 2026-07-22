---
id: protos-web-upstash-rate-limit-fallback
project: Protos-Web
extracted_from: 2026-07-22-03
topics:
  - rate-limit
  - upstash
  - redis
  - serverless
  - vercel
  - lambda-cold-start
  - graceful-fallback
  - opt-in-config
---

# Distribuirani rate-limit na Vercel — Upstash + in-memory fallback

## TL;DR

**Problem:** `Map`-based rate-limit u serverless-u je efektivno bez cap-a.
Svaka lambda instanca ima svoju memoriju, invocation-i se rasprostiru na
N lambdi, tako da napadač koji radi paralelne request-e dobija `N × limit`
umjesto `limit`.

**Rješenje pattern:** Upstash Redis sliding-window RA-te limiter, sa
in-memory fallback-om kad Upstash env vars **nisu** postavljene. Sve iza
iste `checkRateLimit(...)` sync signature — backward-compat za sve
postojeće call site-ove.

## Kontekst

**Kada primijeniti:**
- Bilo koji Next.js/Vercel API route ili server action koji radi
  authentication attempt, external LLM/AI call, image processing, itd.
- Environment gdje trebaš opt-in Redis (npr. dev bez Upstash-a, prod sa).

**Kada NE primijeniti:**
- Ako ti je backend jedan long-running Node proces (ne serverless) —
  in-memory Map je dovoljan.
- Ako imaš Cloudflare Workers → koristi njihov built-in Durable Object
  rate-limiter umjesto Upstash-a.

## Snippet

**Instalacija:**

```bash
npm install @upstash/redis @upstash/ratelimit
```

**`src/lib/security/rate-limit.ts` (skica):**

```ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

type Verdict = { allowed: boolean; remaining: number; reset: number }

const REDIS =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

const limiters = new Map<string, Ratelimit>()
function upstashLimiter(bucket: string, limit: number, windowSec: number): Ratelimit | null {
  if (!REDIS) return null
  const key = `${bucket}:${limit}:${windowSec}`
  if (!limiters.has(key)) {
    limiters.set(
      key,
      new Ratelimit({
        redis: REDIS,
        limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
        prefix: `rl:${bucket}`,
        analytics: false,
      }),
    )
  }
  return limiters.get(key)!
}

// In-memory fallback (per-lambda).
const memBuckets = new Map<string, { count: number; resetAt: number }>()
function memoryCheck(id: string, limit: number, windowMs: number): Verdict {
  const now = Date.now()
  const entry = memBuckets.get(id)
  if (!entry || entry.resetAt <= now) {
    memBuckets.set(id, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, reset: now + windowMs }
  }
  entry.count++
  return { allowed: entry.count <= limit, remaining: Math.max(0, limit - entry.count), reset: entry.resetAt }
}

/**
 * Sync signature. Returns immediately; if Upstash is configured we
 * fire-and-forget an async check to invalidate the in-memory verdict for
 * future requests, but the FIRST request still gets its answer from
 * in-memory (avoids adding latency on hot path). For endpoints where you
 * MUST wait for Upstash verdict, use `checkRateLimitStrict`.
 */
export function checkRateLimit(id: string, limit: number, windowSec: number): Verdict {
  const memVerdict = memoryCheck(id, limit, windowSec * 1000)
  const upstash = upstashLimiter(id.split(':')[0] ?? 'default', limit, windowSec)
  if (upstash) {
    void upstash.limit(id).then(res => {
      // Cache the redis verdict so future memoryCheck calls converge.
      const now = Date.now()
      memBuckets.set(id, {
        count: limit - res.remaining,
        resetAt: res.reset || now + windowSec * 1000,
      })
    }).catch(() => {})
  }
  return memVerdict
}

export async function checkRateLimitStrict(id: string, limit: number, windowSec: number): Promise<Verdict> {
  const bucket = id.split(':')[0] ?? 'default'
  const upstash = upstashLimiter(bucket, limit, windowSec)
  if (upstash) {
    try {
      const res = await upstash.limit(id)
      return { allowed: res.success, remaining: res.remaining, reset: res.reset }
    } catch {
      // Fail-open with in-memory fallback if Redis is down (avoid outage cascade).
      return memoryCheck(id, limit, windowSec * 1000)
    }
  }
  return memoryCheck(id, limit, windowSec * 1000)
}
```

**Callsite:**

```ts
// API route
const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
const rl = await checkRateLimitStrict(`admin-ai:${ip}`, 10, 60)
if (!rl.allowed) {
  return NextResponse.json({ error: 'rate limited' }, {
    status: 429,
    headers: { 'retry-after': String(Math.ceil((rl.reset - Date.now()) / 1000)) },
  })
}
```

## Gotchas

- **`checkRateLimit` sync + fire-and-forget Upstash** — prvi request kroz
  lambdu dobiva in-memory verdict (0ms extra). Async check konvergira DB
  state za sljedeći request. Za auth login endpoint koristi `strict`
  varijantu (možda `+30ms`, ali je bitno da prvi request također dobije
  točan verdict).
- **`fail-open` na Redis outage** — bolje je pustiti request-e nego biti
  down zbog Redis-a. Alternativa (fail-closed) daje DDoS attack surface
  gdje Redis outage = cijeli site 429.
- **Bucket naming** — koristi `bucket:identifier` (npr. `login:1.2.3.4`).
  Prefix (`rl:${bucket}`) ide u Redis, ne u ID. To spriječi cross-bucket
  interferenciju.
- **Sliding window > fixed window** — user na kraju window-a može poslati
  `2 × limit` request-a u kratkom periodu sa fixed. Sliding raspoređuje.
- **Ne cache-aj `Ratelimit` instance kroz module require caching** —
  drži ih u Map-i, jer se cold start reset-a memoriju svejedno.

## Vidi također
- memory/sessions/2026-07-22-03-security-hardening-pr-45.md
- `src/lib/security/rate-limit.ts`
- Upstash: <https://upstash.com/docs/redis/sdks/ratelimit-ts/algorithms>
