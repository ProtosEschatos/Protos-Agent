---
id: 2026-07-11-02
date: 2026-07-11
project: Protos-Web
title: Inbox, Stripe LIVE, i18n, Admin Console v3.0
commits:
  - e855ea3
  - 2c2a094
  - 7d18a6c
learnings: []
topics:
  - imap
  - gmail
  - zoho
  - stripe
  - donations
  - martina
  - admin-inbox
  - vercel
  - supabase-edge
---
# Session 2026-07-11 — Inbox, Stripe LIVE, i18n, Admin Console v3.0

**Repos:** Protos-Web `3c039ed` · Protos-Agent (memory sync)  
**Live:** https://www.protosweb.eu  
**Supabase:** `laqnnzavwbojntfiqmxj`  
**Checkpoint:** 2026-07-11 23:10

## Commits (kronološki, 2026-07-11)

| SHA | Opis |
|-----|------|
| `7d18a6c` | Multi-mailbox IMAP + Martina profil |
| `41ddca3` | Jedan donation gumb |
| `48fc01c` | DB migracija donations + `resources` |
| `287a547` | O meni i18n + lokalizirani about URL-ovi |
| `13a6083` | Stripe webhook SDK + donation-confirm backup |
| `0ba7201` | Admin boot gate bypass |
| `0871c0e` | Admin perf (Link nav, no Lenis/WebGL) |
| `3c039ed` | **Admin Console v3.0** reskin |

---

## Admin Console v3.0 (`3c039ed`)

### UI referenca (kanonski izgled)
**Repo:** [Google-AI-Studio-Github-Connect](https://github.com/ProtosEschatos/Google-AI-Studio-Github-Connect)  
Google AI Studio mock — slate/indigo „Console v3.0”, sidebar moduli, header sat + sync.

### Implementacija u Protos-Web
- `src/styles/admin-console.css` — scoped `.admin-console`
- `AdminShell`, `AdminHeader`, `AdminSidebar`, `AdminLink` (Next.js client nav)
- **Nema** Three.js / Lenis / cosmic orange u adminu
- Docs: `Protos-Web/docs/admin-console.md`

### Bugfixevi admina (večer)
1. Boot veil prekrivao login → init script bypass (`0ba7201`)
2. Sporo + scroll trzanje → full page reload fix + Lenis off (`0871c0e`)
3. Izgled → Console v3.0 reskin (`3c039ed`)

---

## Admin multi-mailbox IMAP (`7d18a6c`)

- `/admin/inbox` — Zoho, Gmail studio, Martina placeholder
- Vercel: `ZOHO_IMAP_*`, `GMAIL_STUDIO_IMAP_*`, `MARTINA_IMAP_*` (kad live)

---

## Stripe donacije — LIVE (`13a6083`)

- Flow: `/o-meni` → Stripe Checkout → webhook + backup `donation-confirm`
- Edge fn: `donation-checkout`, `donation-confirm`, `stripe-webhook`
- Secrets (Supabase Edge): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (**live** `whsec_`), `SITE_URL`
- Admin: `/admin/donacije`
- Docs: `docs/stripe-donations.md`

**Napomena:** Webhook mora biti **live mode** u Stripe Dashboardu. Backup confirm na success redirectu ako webhook kasni.

---

## i18n O meni (`287a547`)

- HR: **O MENI** / **O timu**
- URL: `/o-meni`, `/en/about`, `/de/ueber-uns`, `/it/chi-siamo`, `/es/sobre-nosotros`

---

## Martina profil

- 5 god, 3D inovacije, astronaut showcase — svih 5 jezika

---

## Napomene

- Nema Payhip — samo Stripe
- `ADMIN_SECRET` samo Vercel
- Sljedeći opcionalni korak: port reference tabova (Brevo/Resend hub, Security terminal) 1:1 u Next admin
