---
id: vercel-env-multi-target-consolidation
project: Protos-Web
extracted_from: 2026-07-20-12
topics:
  - vercel
  - vercel-cli
  - vercel-rest-api
  - env-vars
  - secrets-management
  - platform-ops
---

# Vercel env vars — multi-target single entry (CLI limitation + REST API workaround)

## TL;DR

`vercel env add NAME <target>` (CLI v55) prima **jedan** target po
pozivu (`production` | `preview` | `development`). Za jedan Vercel env
entry koji pokriva više environmentala odjednom (tipa "Production,
Preview" u dashboardu) — koristi Vercel REST API
`POST /v10/projects/{projectId}/env?teamId=...` s `target: [...]` array
u payloadu. Alternativa (više `env add` poziva) proizvodi više odvojenih
entryja koji su funkcionalno identični ali dashboard-visually neuredni.

## Kontekst

Kad primijeniti:

- Postavljaš isti env var (najčešće API DSN, public key, feature flag)
  na Production i Preview odjednom i želiš dashboard prikazati jedan
  red umjesto dva.
- Migriraš postojeći "duplicated" env (npr. 2 odvojena Prod + Preview
  entrya) u jedan konsolidirani entry.
- Automatiziraš setup env varsa iz skripte i želiš idempotent behavior.

Kad NE:

- Vrijednost je stvarno različita po environmentu (development vs.
  production API URL) — onda odvojeni entryji imaju smisla.
- Trebaš samo Development entry — direktan `vercel env add ... development`
  je najkraći put, i tamo se automatski postavlja `Type: Non-sensitive`
  (Vercel requirement da bi `vercel env pull` mogao skinuti vrijednost
  u `.env.local` na disk).

## Zašto CLI ne može

CLI v55 signature je `vercel env add [name] [environment] [git-branch]`,
gdje je `environment` **enum single value**. Više puta pokušavano
`vercel env add NAME production preview` — CLI parsira `preview` kao
`git-branch`, ne kao drugi env target. Nema `--environment` repeated
flaga u v55 (možda u budućoj verziji).

Iz output-a stvarnog testa:
```
$ vercel env add NEXT_PUBLIC_SENTRY_DSN production
✓ Added
  Environments    Production
  Type            Sensitive

$ vercel env add NEXT_PUBLIC_SENTRY_DSN preview
✓ Added
  Environments    Preview
  Type            Sensitive
```

Rezultat: 2 odvojena rowa u `vercel env ls`. Runtime resolution je
identičan (Next.js proces vidi `process.env.NEXT_PUBLIC_SENTRY_DSN` s
istom vrijednosti bez obzira koji entry je "izvor"), ali dashboard je
loš UX i tim koji gleda audit misli da su duplikati.

## REST API workaround

Endpoint (v10 stabilan 2026-07): `POST
https://api.vercel.com/v10/projects/{projectId}/env?teamId={teamId}`

Payload:
```json
{
  "key": "NEXT_PUBLIC_SENTRY_DSN",
  "value": "https://…@ingest.…/…",
  "type": "encrypted",
  "target": ["production", "preview"]
}
```

Bitni detalji:

- **`type: "encrypted"`** = ekvivalent "Sensitive" u dashboardu. Ostalo:
  `"plain"` (Non-sensitive, tj. vrijednost vidljiva u dashboardu),
  `"secret"` (legacy Vercel Secrets — deprecated, ne koristiti).
- **`target: []`** može biti bilo koja kombinacija `production`,
  `preview`, `development`. Za granularno "Preview samo na specifičnoj
  grani" postoji `gitBranch` polje.
- Response 201 sadrži `created` objekt s `id` novog entrya
  (npr. `7wRFVQDypKfqnGVS`) — koristan za auditlog.
- Response 200 s `failed[]` ako entry sa istim key-em već postoji za
  target — moraš prvo `DELETE` postojeći.

## Runbook — potpuni ciklus (jedan entry preko Prod + Preview)

```bash
# 1. Extract IDs
PID=$(python3 -c "import json; print(json.load(open('.vercel/project.json'))['projectId'])")
TID=$(python3 -c "import json; print(json.load(open('.vercel/project.json'))['orgId'])")

# 2. Extract CLI auth token (Linux path)
TOKEN=$(python3 -c "import json; print(json.load(open('$HOME/.local/share/com.vercel.cli/auth.json'))['token'])")

# 3. Delete any pre-existing single-target entries
vercel env rm NAME production --yes  2>/dev/null || true
vercel env rm NAME preview    --yes  2>/dev/null || true

# 4. Create consolidated entry via REST API
curl -sS -X POST "https://api.vercel.com/v10/projects/$PID/env?teamId=$TID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"NAME\",\"value\":\"$VALUE\",\"type\":\"encrypted\",\"target\":[\"production\",\"preview\"]}" \
  -w "\nHTTP %{http_code}\n"

# 5. Verify
vercel env ls production | rg NAME
# expected: NAME  Encrypted  Production, Preview
```

## Gotchas

- **`orgId` u `.vercel/project.json` je stvarno TEAM ID.** Nema zasebnog
  `teamId` polja; koristi `orgId` u query stringu kao `teamId=...`.
- **Auth token 60 chars.** Live token na Linux mašini je u
  `~/.local/share/com.vercel.cli/auth.json` (macOS: `~/Library/…`,
  Windows: `%APPDATA%\…`). Ako je taj file 0 bajtova ili token expired
  → `curl` će vratiti 401. Fix: `vercel logout && vercel login`.
- **`jq` nije uvijek instaliran.** Fallback:
  `python3 -c "import json; print(json.load(open('...'))['token'])"`.
  Node fallback: `node -e "console.log(require('...').token)"`.
- **Redeploy nije potreban** kad se **vrijednost** env-a ne mijenja
  (samo se konsolidira broj entryja). Trenutni Ready deploy nastavlja
  raditi normalno; sljedeći build pokupi novu strukturu. Ali ako se
  **vrijednost** promijenila, moraš eksplicitno `vercel redeploy` ili
  push commit — Vercel ne redeploya automatski na env change.
- **`vercel redeploy https://aliased-domain.com` visi na interaktivnom
  promptu** jer očekuje specifičan deployment URL, ne alias. Fix: koristi
  URL iz `vercel ls` (`https://protos-xxxx.vercel.app`) ili samo
  `vercel deploy --prod` iz linkanog direktorija.
- **`--yes` flag na `vercel env rm`** preskače interaktivni potvrdni
  prompt. Bez njega u skripti CLI zamrzne čekajući stdin.
- **Non-sensitive vs Sensitive tip** je automatski određen: ako je var
  **samo** u Development, Vercel forsira Non-sensitive (readable za
  `vercel env pull`); ako je i u Prod ili Preview, može biti Encrypted.
  API poziv može eksplicitno postaviti `type: "encrypted"`.
- **Prozor bez env vara** između `rm` i `POST` je ~2s. Nije problem ako
  nema aktivnog builda u tom trenu; runtime već pokrenutih deploya nije
  pogođen jer je vrijednost bake-ana pri buildu (za `NEXT_PUBLIC_*`) ili
  resolveana iz snapshot-a env-a pri cold startu (za server env). Za
  ultra-sigurnost: odgodi cleanup do window-a bez pushova.

## Vidi također

- `memory/sessions/2026-07-20-12-sentry-env-wireup-consolidation.md` — konkretna primjena (Sentry DSN)
- Vercel REST API — Environment Variables:
  <https://vercel.com/docs/rest-api/reference/endpoints/projects/create-one-or-more-environment-variables>
- Vercel CLI reference — `vercel env`:
  <https://vercel.com/docs/cli/env>
