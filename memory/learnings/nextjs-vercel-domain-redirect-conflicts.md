---
id: nextjs-vercel-domain-redirect-conflicts
project: Protos-Web
extracted_from: 2026-07-20-01
topics:
  - nextjs
  - vercel
  - redirects
  - domain
  - deploy-incident
---

# Learning: Vercel domain redirects vs Next.js `redirects()` — sukob

**Datum:** 2026-07-20
**Sesija:** `sessions/2026-07-20-nextjs-restore-admin-ultimate-panel.md` (deploy incident #1)

## Simptom

Cijeli `protosweb.eu` vraćao je `ERR_TOO_MANY_REDIRECTS`. Site nedostupan svima. GitHub Actions `admin-inbox-sync` je fail-ao s `curl: (47) Maximum (50) redirects followed`.

## Root cause

Dva sustava rade konfliktne redirect-e za isti par host-ova:

1. **Vercel Domain Settings** je bio postavljen tako da apex `protosweb.eu` → 308 → `www.protosweb.eu`
2. **`next.config.js`** je imao:

```js
async redirects() {
  return [
    { source: '/:path*', has: [{ type: 'host', value: 'www.protosweb.eu' }],
      destination: 'https://protosweb.eu/:path*', permanent: true }
  ]
}
```

Rezultat: apex → 308 → www → 308 → apex → 308 → www → … beskonačna petlja.

## Fix

Ukloniti `async redirects()` iz [`next.config.js`](next.config.js) potpuno. Vercel Domain Settings već rješava kanonizaciju **prije** Next runtime-a — aplikacija to NE smije duplicirat.

Commit: `e482850d79` — `fix(next.config): remove www->apex redirect that caused site-wide redirect loop`

## Pravilo

Kad koristiš **Vercel Domain redirects** (bilo koje smjerom apex↔www), **NE dodaj Next.js `redirects()` config** za isti par. Odaberi jedno mjesto istine:

- **Preporučeno (za protosweb.eu i sve buduće site-ove):** Vercel Domain Settings — jer se dogodi prije invocation-a, jeftinije, brže.
- **Alternativa:** Next.js `redirects()` u `next.config.js` — treba isključiti Vercel-ovu strany.

## Sekundarni fixevi u istom incidentu

- `.github/workflows/admin-inbox-sync.yml` — `curl -L --max-redirs 10` + `SITE_URL=https://www.protosweb.eu` (kanonski host, ne apex). Ovo je bila kompenzacija za redirect loop; sada, poslije root fixa, `-L` ostaje kao safety, ne kao potreba.

## Verifikacija

Nakon fixa provjeri:

```bash
curl -sSI https://protosweb.eu     # očekuj: 308 → https://www.protosweb.eu (samo JEDAN redirect)
curl -sSI https://www.protosweb.eu # očekuj: 200 OK
```

Nikad ne smije biti više od jednog 308 hop-a za istu putanju.

## Kada to opet iskrsne

Ako Vercel Domain preferences promijeni user (npr. prebaci canonical natrag na apex), `next.config.js` mora ostati bez `redirects()` za taj par. Ako želi Next.js runtime redirect, **prvo uklonit Vercel redirect** (jedan izvor istine, uvijek).
