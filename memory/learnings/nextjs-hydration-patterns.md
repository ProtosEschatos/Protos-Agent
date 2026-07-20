---
id: nextjs-hydration-patterns
project: Protos-Web
extracted_from: 2026-07-10-01
topics:
  - nextjs
  - hydration
  - react-errors
  - boot-veil
---

# Next.js hydration — obrasci (Protos-Web, 2026-07-10)

## Simptomi

- Stranica izgleda učitana ali klikovi ne rade (ULAZ, language switcher, animacije)
- React minified errors **#418**, **#423**, **#425** u konzoli
- Korisnik: "jezici ne rade", "stranica ne radi" — curl vraća 200

## Uzroci u Protos-Web

1. **`PageLoader` + `sessionStorage` u `useState` initializeru**
   - Server: uvijek `loading=true`
   - Client (returning visitor): `loading=false` odmah
   - → cijelo boot overlay tree mismatch

2. **`toLocaleDateString` bez fiksne timezone**
   - Server render (UTC) vs browser (lokalna TZ) → različit tekst datuma u blog karticama (#425)

3. **Ručno `element.remove()` na React DOM node** (`#boot-ssr-veil`)
   - → `removeChild: The node to be removed is not a child of this node`

## Fix pattern

```tsx
// PageLoader — deterministički initial state
const [loading, setLoading] = useState(true)

useLayoutEffect(() => {
  if (isBootComplete()) setLoading(false)
  else removeBootSsrVeil() // samo display:none, ne .remove()
}, [])
```

```tsx
// Datumi — uvijek ista TZ na serveru i klijentu
toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
```

## Verifikacija

- **Playwright** s `page.on('pageerror')` — ne oslanjati se samo na curl
- Test: boot ULAZ → cookie accept → hero visible → language switch URL change

## Ne miješati

- Boot gate (`boot-pending` / `#boot-ssr-veil`) s admin rutama — admin ide kroz `AdminShell` izvan boot flowa
