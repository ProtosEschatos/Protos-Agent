# Sesija 2026-07-06 — Admin panel + CMS hub (Protos-Web)

## Cilj korisnika

1. Privatni `/admin` na glavnoj stranici (ne subdomena), vidljiv u navigaciji samo kad je ulogiran
2. Kontrolna ploča s gumbima za:
   - Blog (dodavanje/uređivanje, Supabase)
   - Portfolio (isto)
   - Email inbox (`dario.admin@protosweb.eu` / Zoho)
   - Notifikacije oko stranice
   - Platforme i društvene mreže (placeholder linkovi za kasnije)

## Što je isporučeno

### Faza 1 — Auth i osnovni panel
- `/admin`, `/admin/login` na `www.protosweb.eu`
- `ADMIN_SECRET` na Vercelu
- Middleware + httpOnly cookie
- PANEL u navigaciji kad je session aktivan
- Mystical pozadina + custom chess knight SVG (`AdminKnightMark`, `design/references/...`)

### Faza 2 — Sigurnost
- Rate limit login API
- Generic error poruke
- Security headers u `next.config.js`
- `docs/security.md` — mapa tajni

### Faza 3 — CMS hub
- Dashboard s karticama (sadržaj, inbox, notifikacije, platforme, social, freelance, DNS)
- `/admin/blog`, `/admin/portfolio` — liste + new + edit
- `/admin/inbox` — Zoho link + contacts iz baze
- Server-side CRUD preko `SUPABASE_SERVICE_ROLE_KEY`

### Faza 4 — Build fix i deploy
- Razdvojeni query/mutation moduli
- `AdminLink` umjesto next-intl `Link` na serveru
- Build prolazi; push na `main` → Vercel deploy

## Odluke

| Odluka | Razlog |
|--------|--------|
| Admin na glavnoj domeni, ne `dario.admin.protosweb.eu` | Eksplicitni zahtjev korisnika |
| `ADMIN_SECRET` samo Vercel | Ne koristi edge funkcije; manja površina curenja |
| Service role samo na serveru | Zaobiđe RLS za CMS pisanje; nikad u browser |
| Placeholder social/platform linkovi | Korisnik će URL-ove dodati kasnije u `social-links.ts` |
| `AdminLink` umjesto `@/routing` | Izbjegava webpack circular init na buildu |

## Naučeno (za buduće Next.js admin radove)

1. **Ne miješaj** `'use server'` fajl koji client komponenta importa za akcije + server page koji importa query iz istog fajla — razdvoji read/write/types.
2. **next-intl `Link` na server admin stranicama** može uzrokovati `Cannot access 'n' before initialization` tijekom `collecting page data` — koristi obične `<a>` ili `next/link` za admin-only UI.
3. **`force-dynamic`** na admin layoutu — admin stranice ne smiju ići kroz SSG s `cookies()` / `requireAdmin()`.
4. **Boot veil** — svaka ruta koja preskače `PageLoader` mora eksplicitno ukloniti SSR veil (`clearBootPending`).
5. **Tajne po platformi** — dokumentirati u `docs/security.md`; korisnik često pita zašto Vercel *i* Supabase env.

## Status repozitorija

- `Protos-Web` `main` @ `6e081d5` — sve pushano, working tree clean
- Vercel auto-deploy s `main`
