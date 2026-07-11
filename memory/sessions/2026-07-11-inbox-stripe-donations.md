# Session 2026-07-11 — Multi-inbox, Stripe donacije, Martina profil

**Repos:** Protos-Web `7d18a6c` (main, pushed)  
**Live:** https://www.protosweb.eu

## Što je urađeno

### Admin multi-mailbox IMAP (`7d18a6c`)
- `/admin/inbox` — 3 sandučića: Zoho (`dario.admin@protosweb.eu`), Gmail studio (`protoswebmark23@gmail.com`), Martina placeholder (`martina.admin@protosweb.eu`)
- `src/lib/mail/mailboxes.ts`, `imap-client.ts`; server actions `adminListMailbox(mailboxId)`
- Vercel Production env: `GMAIL_STUDIO_IMAP_*` postavljen (App Password); redeploy napravljen
- Zoho IMAP već radio (`ZOHO_IMAP_*` na Vercelu)

### Stripe donacije (`e855ea3`)
- Edge fn: `donation-checkout`, `stripe-webhook` — deployane na Supabase (ACTIVE)
- `/o-meni` donacijski gumbi → `/api/donate` → Stripe Checkout 1–1000 EUR
- `/admin/donacije` panel
- Migracija: `20260711150000_donations_stripe_integration.sql`
- Docs: `docs/stripe-donations.md`

### Martina profil (sve 5 jezika)
- Iskustvo: 5 godina; expertise: 3D inovacije
- Bio: astronaut u portfolio showcase inspiriran privjeskom za ključeve
- `/o-meni` prikazuje polje `experience` za Martinu

## Supabase Edge secrets (stanje 2026-07-11 večer)

| Secret | Status |
|--------|--------|
| `SITE_URL` | ✅ `https://www.protosweb.eu` |
| `STRIPE_WEBHOOK_SECRET` | ✅ postoji (stariji, lipanj) |
| `STRIPE_SECRET_KEY` | ❌ **nedostaje** — user mora zalijepiti `sk_test_...` iz Stripe API keys |

Bez `STRIPE_SECRET_KEY` donacije ne rade do kraja.

## Stripe setup (user action)

1. Stripe Dashboard → search `API keys` → Secret key `sk_test_...`
2. Stripe → `Webhooks` → endpoint `https://laqnnzavwbojntfiqmxj.supabase.co/functions/v1/stripe-webhook` → eventi `checkout.session.completed`, `checkout.session.expired` → `whsec_...`
3. Supabase → Project Settings → Edge Functions → Secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SITE_URL`

## Napomene

- Supabase dashboard „No repository connected” — normalno; deploy ide GitHub Actions + Vercel, ne Supabase Git integracija
- Agent nema pristup user Firefoxu — Stripe key mora user zalijepiti ili ručno staviti u Supabase
- Gmail App Password user poslao u chat — rotirati po želji
