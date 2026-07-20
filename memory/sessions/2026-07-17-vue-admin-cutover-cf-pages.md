# Session 2026-07-17 → 18 (rano) — Vue admin cutover, CF Pages migracija, DNS switch

**Sesija:** `5f7f037c` (15:31 → 03:32, ~12h)
**Repo tokom sesije:** Protos-Web (tada Vue/Vite verzija), Apartman-Mihael, Protos-Web-Mark23-Custom-Admin-Panel
**Krajnji HEAD (tog trenutka):** `e772d5d`

> Historijski zapis. **Vue verzija je od 2026-07-19 nadalje ostavljena i vraćeno je na Next.js**. Ovaj dan dokumentira zadnji ozbiljni Vue rad.

## Tri paralelna traga

### A) Cloudflare Pages build fix — Apartman-Mihael + Mark23
- Pages Functions ruta postavljena (nije bio SPA catch-all → 404)
- `wrangler.toml` config zategnut, `functions/*` mapirano
- Mark23 (`Protos-Web-Mark23-Custom-Admin-Panel`) — postavljen kao standalone CF Pages projekt

### B) Vue admin cutover po uzoru na Protos-Eschatos-Control-Centre
- Portrani admin moduli (blog, portfolio, inbox, memory, stranice) iz Control-Centre
- **Zapier integracija uklonjena** (odluka: previše bloat-a za trenutnu potrebu)
- **DNS `protosweb.eu` prebačen s Vercela (Next) → Cloudflare Pages (Vue)** — bio kratkotrajni switch
- Supabase anon key rotiran nakon što se pojavio krivi JWT claim (`role: "rose"` umjesto `role: "anon"`) — očito greška u prošloj rotaciji

### C) Perf + SSG + cross-browser baseline
- SSG head restored s `@unhead/vue` v2 pin
- **Jedan WebGL kontekst** pravilo — svi 3D use-case-ovi dijele isti canvas, novi montaži samo reparent-uje kameru
- `dvh` + `env(safe-area-inset-*)` baseline za mobitele
- Cross-browser fixes (Firefox WebGL path)

## Rotacija sigurnosnih vrijednosti — POTREBNO

U transkriptu su se pojavile doslovne vrijednosti sljedećih tajni. Prije daljnjeg rada rotirati:
- Cloudflare account API token (`cfat_…`)
- R2 Access Key ID + Secret Access Key
- Admin panel password za `dario.admin@protosweb.eu`
- Supabase anon key (moguće da je već rotiran ovom sesijom, ali sigurnije ponoviti)

Sve nove vrijednosti spremiti u:
- Cloudflare tokens → GitHub Secrets + Vercel env
- R2 keys → Wrangler env, ne u git
- Admin password → Supabase Auth (`auth.users` password field), ne u git
- Supabase anon key → Vercel `NEXT_PUBLIC_SUPABASE_ANON_KEY` + GitHub Secrets

## Ishod
Vue verzija bila live nakratko na `protosweb.eu` preko CF Pages, ali je već sljedećeg dana odlučeno vratiti se na Next.js stack.
