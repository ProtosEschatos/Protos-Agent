---
id: nextjs-vercel-cf-proxy-forbidden
project: Protos-Web
extracted_from: 2026-07-22-04
topics:
  - cloudflare
  - vercel
  - dns
  - proxy
  - orange-cloud
  - domain-config
  - redirect-loop
  - deployment
  - forbidden-pattern
---

# Cloudflare proxy na Vercel-hosted apex — ZABRANJENO

## TL;DR

`protosweb.eu` (i sve druge Vercel-hosted domene) DNS records **ostaju
DNS-only (siva strelica). NIKAD Proxied (narančasta).** Vercel već radi
sve što bi CF proxy dodao, i njihovim jednovremenim aktiviranjem dobiješ
duplicirane redirect layer-e, TLS konflikte, header strip-anje i cache
poison. Ako trebaš WAF/rate-limit/bot-block funkcionalnost, koristi
**Vercel Firewall** (built-in) ili in-app rate-limit (npr. Upstash), ne CF
proxy.

## Kontekst

**Kada primijeniti:**
- Sve Vercel-hosted apex i www domene za sve projekte.
- Kad user (ili prijedlog) traži "uključi CF orange-cloud za sigurnost".

**Signal kada NE**:
- Site koji NIJE na Vercelu (npr. Cloudflare Pages projekti u ovom
  portfelju: `apartman-mihael.pages.dev`, `auto-precision.pages.dev`,
  `admin-console.pages.dev`) — tamo je CF nativni host, orange-cloud je
  N/A / uvijek proxied.

## Zašto konflikte (konkretno)

1. **Redirect loop na apex↔www**:
   - Vercel Domain Settings radi kanonizaciju (npr. apex → 308 → www) na
     Vercel edge, PRIJE Node runtime-a.
   - CF proxy može cache-ati 308 response ili dodati vlastito canonical
     rewrite. Rezultat: apex → 308 (CF cached) → apex → 308 → … isti
     obrazac kao [nextjs-vercel-domain-redirect-conflicts.md](nextjs-vercel-domain-redirect-conflicts.md).
2. **TLS termination duplo**:
   - Vercel radi TLS na edge. CF Proxied radi svoj TLS.
   - Ako CF SSL mode = "Flexible" (default za neke račune) → CF šalje HTTP
     Vercelu → Vercel odbija ili loop-a HTTPS redirect → ERR_TOO_MANY_REDIRECTS.
   - CF SSL "Full (strict)" popravlja ali dodaje round-trip.
3. **Header strip / mutate**:
   - Vercel dostavlja `x-vercel-*` headers za deployment protection, ISR
     cache tag-ove, edge insights. CF proxy može strip-ati ili
     override-ati.
   - Klijent side (`va.vercel-scripts.com` insights) očekuje čist edge
     path.
4. **Cache poison**:
   - Vercel edge cache + CF cache dva sloja. Različiti cache keys
     (npr. `Accept-Encoding` variant, `crossorigin` on stylesheet) →
     stara `index.html` sa `<script src="/chunks/main-abc123.js">` ostane
     u CF-u dok Vercel već serve-a `main-def456.js`. 404 na sve chunk-e
     = bijeli ekran. Ovo se **već dogodilo** u ranijem projektu, vidi
     [`2026-07-19-migration-lock-cf-cache-poison.md`](../sessions/2026-07-19-migration-lock-cf-cache-poison.md).
5. **Preview URL-i**:
   - Vercel `protos-web-git-<branch>-<hash>.vercel.app` — nikad iza CF
     DNS-a. Ali ako non-preview `protosweb.eu` je proxied a preview nije,
     preview linkovi u PR checks-u mogu misbehave-ati zbog CORS
     (`Origin: https://protosweb.eu` iza CF, `preview` bez CF).
6. **Bot Fight Mode blokira legit request-e**:
   - CF Bot Fight Mode identificira Vercel-ov ISR revalidation trigger
     (koji ide `POST /_next/data/...` sa Vercel-owned IP-om) kao "bot" i
     429/challenge-a ga. Site postaje stale-only.

## Snippet — što raditi UMJESTO CF proxy-a

Za "WAF-like" zaštitu Vercel-hosted domene:

```
# 1) Vercel Firewall (Dashboard → Project → Firewall)
#    Rules: block-country, rate-limit-per-path, block-user-agent, IP-deny.
#    Radi na Vercel Edge, PRIJE lambda invocation — jeftinije od
#    in-app limita.

# 2) In-app rate-limit (Upstash Redis)
#    Već implementirano u src/lib/security/rate-limit.ts:
#    - checkRateLimit(id, limit, windowSec)
#    - checkRateLimitStrict(...) za hot endpoints
#    Vidi: memory/learnings/protos-web-upstash-rate-limit-fallback.md

# 3) HSTS + secure headers preko next.config.ts headers()
#    (već je tako postavljeno — HSTS preload, X-Frame-Options: DENY,
#     Referrer-Policy, Permissions-Policy)

# 4) Sentry Session Replay + Alerts za anomaly detection
#    Vidi: memory/learnings/protos-web-sentry-hardening.md
```

## Gotchas

- **Već je "orange-cloud" bio negdje ukljucen u prošlosti** — vidi
  `2026-07-19-migration-lock-cf-cache-poison.md`. Vraćanje na Proxied
  status = svjesno reintroduce-anje istog bug pattern-a.
- **Ne miješaj sa Cloudflare Pages projektima** — `apartman-mihael.pages.dev`
  itd. NISU na Vercelu, tamo je CF nativni host.
- **Ako user misli da mu treba CF Bot Fight Mode**: koristi Vercel Bot
  Management umjesto (paid, ali radi bez proxy layer-a).
- **DNS ostaje na Cloudflare-u (samo DNS-only)** — Cloudflare DNS
  hosting je ok, i besplatan; problem je isključivo "Proxied" toggle po
  record-u.

## Meta-pravilo za buduće sesije

**Prije davanja bilo koje preporuke oko domain / provider / library
konfiguracije (`grep memory/` za tu temu):**

```bash
# Iz Protos-Agent workspacea:
rg -iC2 --type md "<domain|provider|library>" memory/
```

Bez ovog grep-a se ponavljaju identični bug pattern-i (današnji je bio:
predložio sam CF orange-cloud, iako je `nextjs-vercel-domain-redirect-conflicts.md`
learning postojao od 2026-07-20, i `2026-07-19-migration-lock-cf-cache-poison.md`
sesija još ranije). Vidi `2026-07-22-04` za detalje.

## Vidi također
- memory/sessions/2026-07-22-04-cf-proxy-retract-and-konfigurator-open.md (retract event)
- memory/learnings/nextjs-vercel-domain-redirect-conflicts.md (isti obrazac, Vercel-vs-Next redirect)
- memory/sessions/2026-07-19-migration-lock-cf-cache-poison.md (CF cache poison incident)
- memory/sessions/2026-07-22-03-security-hardening-pr-45.md (gdje sam pogrešno predložio CF proxy)
