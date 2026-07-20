---
id: 2026-07-20-08
date: 2026-07-20
project: Protos-Web
title: /admin/prirucnik — living README u panelu (stack, servisi, pravila)
commits:
  - 2e7480d
topics:
  - admin-panel
  - handbook
  - documentation
  - stack
  - rules
  - onboarding
---

# Session — 2026-07-20 · Admin priručnik

User request:
> "zelim da takodjer u admin panelu odvojis specijalnu sekciju i u nju dodas
>  stack u kojem smo radili i koje smo sve servise koristili iliti koristimo
>  i jednu predivnu preciznu folder strukturu i ispod toga recimo jasno
>  naglasenim pravilima kojih se treba drzati da ne bude daljnjih gresaka.
>  zelim to tako u nekom read me stilu."

## Isporuka

Nova stranica `/admin/prirucnik` (nav sekcija "Priručnik", između SEO i
Sustav). Server component koji renderira 6 sekcija:

1. **Stack tablica** — čita `package.json` pri renderu, tako da bumpanje
   deps automatski osvježi tablicu bez dodavanja stringova. Kolone: Sloj /
   Paket / Verzija / Uloga.
2. **Servisi** — 8 grupa (Infra, Baza, Plaćanje, Komunikacija, AI cascade,
   3D pipeline, Publishing, Analytics). Svaka kartica ima status pill:
   - `spojeno` (postoji aktivan ključ za `provider` u `admin_api_keys`)
   - `fali ključ` (postoji provider slot ali nema active row)
   - `env: NEXT_PUBLIC_…` (stvari koje ne idu u vault — GA, GSC, Plausible)
3. **Folder struktura** — ASCII tree cijelog repoa s komentarima u granama
   admin foldera.
4. **12 pravila (non-negotiable)** — kritična crvena, warn žuta. Svako
   pravilo je grešaka koju smo već napravili:
   - secrets ne u repo
   - `ADMIN_KEYS_ENCRYPTION_KEY` backup
   - `requireAdmin()` u svakoj server action
   - Zod na entry pointu
   - `import 'server-only'` pravilo (i client-safe split)
   - JSON-LD safe serializer
   - Supabase migration timestamp match (MCP prvo, pa fajl s istim ts)
   - `AdminLink` umjesto `<a>`
   - next-intl za sve stringove
   - CSP bez `unsafe-eval` u prod
   - ReadLints + build lokalno prije push-a
   - `recordAudit()` na kraju svakog write-a
5. **Komande** — grid kartica sa svih najvažnijih npm skripti + master
   ključa gen.
6. **Repos** — Protos-Web + Protos-Agent linkovi s opisom.

## Zašto je ovo posebna sekcija a ne wiki

- Živi pored koda → nikad ne odlazi u nesinkroniziran stalež.
- Stack tablica se generira iz `package.json` → 0 manual drift-a.
- Statusi servisa se čitaju iz vault-a → točan snapshot "što je spojeno".
- Onboarding za budućeg agenta ili nekog trećeg: 5 min čitanja, cijeli
  mental model site-a.

## Odluka: šest kartica u TOC-u umjesto MDX

Razmatran je MDX i markdown-loader pipeline. Odbačeno jer:
- MDX vuče client-side runtime za jednu stranicu.
- Bez interaktivnih statusa (spojeno / fali ključ) treba nam server
  komponenta ionako.
- TSX direktno = 0 novih dependencija, autocomplete, i tipska sigurnost
  za `SERVICE_GROUPS` niz.

Trade-off: ako se pravila napuhaju iznad ~25 stavki, treba razdvojiti
`RULES` u zaseban `.ts` fajl (samo podatak, nema JSX).
