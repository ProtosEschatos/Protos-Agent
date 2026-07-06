# 2026-07-06 — Email DNS + security hardening

## Done

- Cloudflare DNS: DMARC, SPF (Zoho+Brevo), single brevo-code, Resend on `send` + `resend._domainkey`
- Resend `protosweb.eu` Verified (eu-west-1)
- `public/.well-known/security.txt` deployed
- `scripts/fix-cloudflare-dns.sh` for future DNS edits (needs Zone DNS Edit token, not IDE `cfat_`)
- Supabase edge fn redeploy; `ADMIN_SECRET` not in edge secrets
- Vercel production redeploy
- Docs: Gmail removed from test checklists; `docs/cloudflare-dns.md` status updated

## Commits

- Protos-Web `778db23`

## Still manual

- Live test contact + newsletter
- Cloudflare MFA
- Social link URLs in `social-links.ts`
