---
id: protos-web-ssrf-two-layer-defense
project: Protos-Web
extracted_from: 2026-07-22-03
topics:
  - ssrf
  - security
  - dns-resolve
  - rfc1918
  - ipv6
  - dns-rebinding
  - webhook
  - fetch
  - node-dns
---

# SSRF two-layer defense — sync literal check + async DNS resolve

## TL;DR

Za bilo koji admin-triggered outbound `fetch(url)` (webhook fire, image
scrape, PDF fetch, itd.): **dva sloja obrane**.
1. **Sync layer** u Zod schema-i / input validaciji: `isBlockedHostLiteral(url)`
   koji odbija literal IP-eve (v4 + v6 + IPv4-mapped-v6) u privatnim
   opsezima i `localhost` varijante.
2. **Async layer** neposredno prije `fetch`-a: `assertPublicUrl(url)` koji
   DNS-resolvira hostname i re-provjeri svaku dobivenu IP kroz isti
   blocklist. Fail-closed na svaku grešku.

Prvi sloj hvata trivialne napade (`http://127.0.0.1/`, `http://[::1]/`).
Drugi hvata `http://evil.com/` gdje `evil.com` A-record vrati `127.0.0.1`.

## Kontekst

**Kada primijeniti:**
- Bilo gdje gdje admin ili user može zadati URL koji server pozove
  (webhooks, RSS import, avatar scraper, OG image fetch, PDF-to-HTML, itd.).
- Vercel functions rade u zajedničkoj VPC-podobnoj mreži — ako ne
  blokiraš, mogu doseći internal metadata service (`169.254.169.254`),
  DB IP-eve unutar iste org (kroz privatni networking), itd.

**Kada NE primijeniti:**
- Ako je URL hard-coded u kodu ili env-u i sigurno je javan (npr.
  `https://api.stripe.com/...`) — provjera je noise.
- Za samo-hostane crawler-e u izoliranoj mreži gdje je namjerno pristup
  internim service-ima potreban.

## Snippet

**`isBlockedHostLiteral` (sync, u Zod):**

```ts
const IPV4_BLOCKED = /^(0\.|10\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|192\.0\.[02]\.|198\.(1[89]|51\.100)\.|203\.0\.113\.|22[4-9]\.|23[0-9]\.|24[0-9]\.|25[0-5]\.)/

export function isBlockedHostLiteral(url: string): boolean {
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()
    if (host === 'localhost' || host.endsWith('.localhost')) return true
    if (IPV4_BLOCKED.test(host)) return true

    // IPv6 literal check (URL constructor strips [ ]).
    if (host === '::1' || host === '::') return true
    if (host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd')) return true
    if (host.startsWith('ff')) return true // multicast

    // IPv4-mapped IPv6 — both dotted and hex forms.
    if (host.startsWith('::ffff:')) {
      const tail = host.slice(7)
      if (/^\d+\.\d+\.\d+\.\d+$/.test(tail) && IPV4_BLOCKED.test(tail)) return true
      // ::ffff:7f00:1  ==  ::ffff:127.0.0.1
      const parts = tail.split(':')
      if (parts.length === 2 && parts.every(p => /^[0-9a-f]{1,4}$/.test(p))) {
        const [hi, lo] = parts.map(p => parseInt(p, 16))
        const dotted = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`
        if (IPV4_BLOCKED.test(dotted)) return true
      }
    }
    return false
  } catch {
    return true // malformed → fail-closed
  }
}

// Zod usage:
export const httpsUrlSchema = z.string().url()
  .refine(u => u.startsWith('https://'), 'must be https')
  .refine(u => !isBlockedHostLiteral(u), 'private/reserved IP not allowed')
```

**`assertPublicUrl` (async, pre-fetch):**

```ts
import { promises as dns } from 'node:dns'

export async function assertPublicUrl(rawUrl: string): Promise<URL> {
  const url = new URL(rawUrl)
  if (isBlockedHostLiteral(rawUrl)) throw new Error('blocked host literal')

  const addrs = await dns.lookup(url.hostname, { all: true })
  for (const { address } of addrs) {
    if (isBlockedHostLiteral(`http://${address}/`)) {
      throw new Error(`blocked resolved ip: ${address}`)
    }
  }
  return url
}

// Callsite:
try {
  await assertPublicUrl(webhookUrl)
  const res = await fetch(webhookUrl, { ... })
} catch (err) {
  // Fail-closed: never send if resolve fails.
}
```

## Gotchas

- **`dns.lookup` može race-ati protiv `fetch`-a** — Node fetch re-resolvira
  DNS interno. Napadač može vratiti javnu IP na `lookup`, pa privatnu na
  `fetch`. Full fix je custom `agent` s `lookup` callback-om koji provjeri
  svaku resolve-u — složeno. Ovaj pattern hvata 99% slučajeva; za
  paranoid case koristi `node-fetch` sa custom agent-om.
- **IPv4-mapped IPv6 se često zaboravlja** — `http://[::ffff:127.0.0.1]/`
  je legitimna forma za `localhost` u Node fetch. Regex mora hvatati OBE
  varijante (dotted + hex).
- **CGN opseg `100.64/10`** — Vercel i cloud-oveni provider-i koriste za
  interno routing. Blokira.
- **`.localhost` domena** je rezervirana RFC 6761 — `evil.localhost`
  rezolvira lokalno u nekim resolver-ima.
- **Malformed URL → fail-closed**: `try/catch → return true`. Nikada ne
  vraćaj `false` iz catch-a — napadač će input-ovati broken URL da bypass-a.

## Vidi također
- memory/sessions/2026-07-22-03-security-hardening-pr-45.md
- `src/lib/security/ssrf.ts`
- OWASP: <https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html>
