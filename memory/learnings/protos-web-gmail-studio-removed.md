---
id: protos-web-gmail-studio-removed
project: Protos-Web
extracted_from: 2026-07-22-07
topics:
  - inbox
  - gmail
  - zoho
  - email
  - forbidden-pattern
---

# Gmail studio mailbox removed — do not reopen

## TL;DR

Gmail IMAP / `gmail-studio` / `GMAIL_STUDIO_*` **removed** from Protos-Web
(PR #54–#55). Admin inbox = **Zoho** (`dario.admin@protosweb.eu`) + Martina
when `MARTINA_IMAP_*` is configured. Outbound still Resend/Brevo → Zoho.

## Why

Google lock / “Too many failed attempts” on `protoswebmark23@gmail.com`.
Code was read-only IMAP; failed logins still burned the account. User ordered
complete removal from mailboxes, docs, `.env.example`.

## Ops (owner)

- Delete leftover `GMAIL_STUDIO_*` from Vercel Dashboard manually if still present.
- **Do not** re-add Gmail IMAP unless user explicitly asks.

## See also

- Session `2026-07-22-07`
- Project secrets map in `memory/projects/protos-web.md`
