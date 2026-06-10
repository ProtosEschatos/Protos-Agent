# Security Audit Skill

> Load this skill when performing security audits, vulnerability scanning, dependency checks, or penetration testing.

## Audit Process

1. **Dependency scan** — `npm audit`, check for known CVEs
2. **Secrets check** — no hardcoded API keys, passwords, or tokens in code
3. **Auth review** — Supabase Auth RLS policies, session handling, role permissions
4. **Input validation** — Zod schemas on all user inputs, API endpoints
5. **CSP/CORS** — security headers configured, CORS restricted
6. **XSS/SQL injection** — sanitized inputs, parameterized queries (Drizzle)
7. **Exposed endpoints** — server routes protected, no open admin APIs

## Audit Output Format

```
## Security Audit Report
### 🔴 Critical
- (must fix immediately)

### 🟡 Warnings
- (should fix before production)

### 🟢 Passed
- (things that are secure)

### 📋 Recommendations
- (long-term improvements)
```

## Project-Specific
- All secrets in `.env` + `runtimeConfig` — NEVER in code
- All external API calls through `server/api/` — NEVER from frontend
- `nuxt-security` module must have WebGL-compatible CSP
- Supabase RLS must be enabled on all tables
- Stripe webhook must verify signature
