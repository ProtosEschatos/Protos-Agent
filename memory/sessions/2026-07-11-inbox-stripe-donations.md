# Session 2026-07-11 — Multi-inbox, Stripe donacije LIVE, i18n O meni

**Repos:** Protos-Web `077e99f` · Protos-Agent `48ea569` (main, pushed)  
**Live:** https://www.protosweb.eu  
**Supabase:** `laqnnzavwbojntfiqmxj`  
**Checkpoint:** 2026-07-11 22:49 — sve spremljeno u git memoriju

## Commits (kronološki, 2026-07-11)

| SHA | Opis |
|-----|------|
| `7d18a6c` | Multi-mailbox IMAP + Martina profil |
| `106dcd0` | Memory docs |
| `41ddca3` | Jedan donation gumb (bez progress/ciljeva) |
| `48fc01c` | DB migracija donations + `resources` cause |
| `287a547` | O meni i18n + lokalizirani about URL-ovi |
| `13a6083` | Webhook SDK fix + donation-confirm backup + lokalizirani redirect |
| `077e99f` | Protos-Web memorija sync (PROJECT-MEMORY + AGENTS) |
| `48ea569` | Protos-Agent memorija sync (session + protos-web.md) |

---

## Admin multi-mailbox IMAP (`7d18a6c`)

- `/admin/inbox` — 3 sandučića: Zoho (`dario.admin@protosweb.eu`), Gmail studio (`protoswebmark23@gmail.com`), Martina placeholder (`martina.admin@protosweb.eu`)
- `src/lib/mail/mailboxes.ts`, `imap-client.ts`; server actions `adminListMailbox(mailboxId)`
- Vercel Production: `GMAIL_STUDIO_IMAP_*`, `ZOHO_IMAP_*`
- Martina: `MARTINA_IMAP_*` kad mailbox bude live

---

## Stripe donacije — LIVE (`13a6083`)

### User flow
1. `/o-meni` → gumb „Podrži resurse studija” → modal (1–1000 EUR)
2. `POST /api/donate` → Supabase edge `donation-checkout` → Stripe Checkout (`cs_live_...`)
3. Nakon plaćanja → redirect na lokalizirani about URL + `?donation=success&session_id=cs_...`
4. Stranica poziva `POST /api/donate/confirm` (backup ako webhook kasni)
5. Webhook `stripe-webhook` → `donations.status = completed`
6. Admin: `/admin/donacije`

### Edge funkcije (deploy `--no-verify-jwt`)
| Fn | Trigger |
|----|---------|
| `donation-checkout` | `/api/donate` |
| `donation-confirm` | `/api/donate/confirm` (backup) |
| `stripe-webhook` | Stripe webhook POST |

### Supabase Edge secrets (LIVE)
| Secret | Vrijednost |
|--------|------------|
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | **LIVE** `whsec_...` (ne test!) |
| `SITE_URL` | `https://www.protosweb.eu` |

### Poznati problem (riješen 2026-07-11 noć)
- Plaćanje prolazi na Stripeu, ali admin ostaje `pending` → webhook nije uspješno ažurirao bazu (ručni HMAC verify + možda test/live `whsec_` mismatch)
- Fix: Stripe SDK u webhooku + `donation-confirm` backup na success redirectu
- **User mora provjeriti:** Stripe Dashboard → Webhooks → **Live mode** → endpoint URL + signing secret u Supabase

### Ključni fajlovi
- `src/components/features/donations/DonationModal.tsx`
- `src/app/api/donate/route.ts`, `confirm/route.ts`
- `supabase/functions/donation-checkout/index.ts`
- `supabase/functions/donation-confirm/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `docs/stripe-donations.md`

---

## i18n O meni (`287a547`)

- HR: naslov **O MENI** (ne O NAMA), tim **O timu**
- Lokalizirani javni URL-ovi (middleware rewrite):
  - hr `/o-meni`, en `/en/about`, de `/de/ueber-uns`, it `/it/chi-siamo`, es `/es/sobre-nosotros`
- `src/lib/routes/localized-paths.ts`, `src/middleware.ts`, `main-nav.ts`

---

## Martina profil (sve 5 jezika)

- 5 godina iskustva; 3D inovacije; astronaut u portfolio showcase (privjesak)
- `/o-meni` polje `experience` za Martinu

---

## Napomene

- **Nema Payhip** u repou — samo Stripe Checkout
- Supabase dashboard „No repository connected” — normalno; deploy GitHub Actions + Vercel CLI
- Agent nema pristup user browseru — greške nakon paymenta debugirati Stripe webhook log + F12 konzola
- Gmail App Password u chatu — rotirati po želji
