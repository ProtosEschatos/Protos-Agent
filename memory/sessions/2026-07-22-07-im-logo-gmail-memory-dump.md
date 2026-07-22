---
id: 2026-07-22-07
date: 2026-07-22
project: Protos-Web
title: I'M logo thrash + Gmail rip + memory dump (PR #52–#62)
run_id: cursor-2026-07-22-logo-gmail-session
commits:
  - c128002a
  - a390cf85
  - 617bea6e
  - c944c7f7
  - 95a011fd
  - b4aa26da
  - 59cd53cc
  - dd1fc00f
  - f220eeec
  - 63e42191
  - c2b762a1
  - 0b684409
learnings:
  - protos-web-brand-mark-effects-not-redesign
  - protos-web-brand-assets-vercel-public
  - protos-web-gmail-studio-removed
topics:
  - branding
  - im-logo
  - favicon
  - gmail
  - inbox
  - showcase-joystick
  - vercel-public
  - user-preference
  - agent-failure
tags: [production, branding, memory-dump]
---

# Session 2026-07-22 (07) — I'M logo + Gmail out + agent memory dump

## Kontekst

Duga sesija: brand mark **I'M**, Gmail inbox remove, showcase joystick,
pokušaj locale/SR blogova (prekinut). User bijesan jer agent **redizajnira**
umjesto da primijeni **efekte s referenci** na slova I i M. Eksplicitno
zatražio: **memoriraj sve** u Protos-Agent.

Owner: Dario (`@ProtosEschatos`). Memory SoT: ovaj repo.

## User naredbe (tvrda pravila — ne kršiti)

1. **Logo:** samo **I ’ M**. Efekti s Desktop referenci:
   - **I** ← swirl / cyan glow (M-ref plate)
   - **M** ← chrome / light-burst (R-ref plate)
   - **Ne** mijenjati dizajn slova, ne izmišljati “bolji” logo.
2. **Ship:** PR + merge; GitHub `origin/main` = SoT.
3. **Brand UI** → Vercel `public/`; CMS tekst → Supabase; veliki upload → Storage.
4. **Ne** `vercel env pull` bez odobrenja; ne izmišljati migration stampove.
5. **Gmail:** potpuno van — ne vraćati IMAP.
6. Locale prefix `never` + SR blogovi — **stalo na user stop**; ne nastavljati
   dok ponovno ne zatraži.

## Što je shippano (logo lanac)

| PR | Ishod |
|----|--------|
| #52 | Invented SVG `ImLogo` — krivo |
| #53 | M/R PNG u SVG — kriva slova |
| #54–#55 | **Gmail studio removed** ✅ |
| #56 | Raw plates — još M/R glyphovi |
| #57 | Framer Motion na PNG — još M/R |
| #58 | Joystick centar + PNG favicons Google ✅ |
| #59 | Pokušaj I/M overlays |
| #60 | Unify wordmark — “previše odvojeno” |
| #61 | Upright M via SVG `<text>` |
| #62 | Amp effects only, keep text glyphs — **merged** `0b684409` |

Ključni fajlovi: `src/components/ui/ImLogo.tsx`, `public/brand/*`,
`public/favicon.svg`, `public/favicon-48.png`, layout boot veil, Header/Footer,
`PageLoader`.

## Gmail

- Kod/docs: bez `gmail-studio` / `GMAIL_STUDIO_*`.
- Inbox = Zoho (+ Martina kad postoji).
- User: obriši leftover `GMAIL_STUDIO_*` na Vercelu ručno.
- Ne dirati Resend/Brevo outbound.

## Showcase joystick (#58)

Mobile joystick centriran dolje ispod astronauta; project card dignut iznad
(`ShowcaseJoystick.tsx`, `SpaceGallery.tsx`).

## Prekinuto / otvoreno

- [ ] Logo: user još može htjeti bliže referenci — **samo efekti**, bez
  redizajna tipografije. Hard-refresh live nakon deploya.
- [ ] Opcionalno mirror brand u Supabase Storage **ako** MCP radi — ne blokirati.
- [ ] Obriši leftover `GMAIL_STUDIO_*` + dead `SENTRY_*` na Vercelu (owner).
- [ ] Osvježi `SUPABASE_SERVICE_ROLE_KEY` na Vercelu (PostgREST 401 — stariji TODO).
- [ ] SR blogovi + `localePrefix: 'never'` — **samo ako user ponovno zatraži**
  (live DB imao 0 `sr` postova; SEO implikacije).
- [ ] Supabase MCP često nedostupan u sesiji — ne pretpostavljati.

## Nauk (za agenta)

Problem nije nedostatak alata/skillova Protos-Agent. Problem je **nepridržavanje
naloga** (improvizacija UI). Prije logo/brand rada: pročitaj learning
`protos-web-brand-mark-effects-not-redesign` + ovu sesiju.

## See also

- Learnings navedeni u front-matter
- `memory/projects/protos-web.md` (update isti dan)
