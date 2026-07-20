---
id: json-ld-xss-safe-serializer
title: JSON-LD safe serializer (block `</script>` breakout)
project: Protos-Web
extracted_from: 2026-07-20-06
tags:
  - security
  - xss
  - seo
  - json-ld
  - nextjs
---

# JSON-LD safe serializer

## Problem

Next.js apps often embed schema.org data with:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
```

`JSON.stringify` **does not escape** `</script>`, `<!--`, or line separators
(`U+2028`, `U+2029`). If any user-controlled field (blog title, description,
copy-pasted quote) contains `</script>`, the browser closes the tag and
executes whatever follows. Classic HTML-context XSS.

## Fix

Route every JSON-LD `<script>` through a single helper:

```ts
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
```

Then:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
/>
```

`\uXXXX` escapes are still valid JSON, so the payload parses identically —
they just can't break out of the `<script>` tag.

## Locations to check (grep before shipping)

```
rg "dangerouslySetInnerHTML" src | rg "JSON.stringify"
```

Should return zero matches — everything must go through `serializeJsonLd`.

## Related

- OWASP DOM-based XSS cheat sheet, section "JSON in `<script>` tags"
- `serialize-javascript` npm package (heavier, escapes `<` too)
- React `<script>` intrinsic in React 19+ still passes strings verbatim.
