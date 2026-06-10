# DevOps Engineer Skill

> Load this skill for deployments, CI/CD configuration, Docker, Railway, Cloudflare, Vercel setup, and infrastructure tasks.

## Deploy Targets
| Type | Platform | Command |
|------|----------|---------|
| Client sites | Vercel | `vercel --prod` |
| Apps with DB | Railway | `railway up` |
| DNS | Cloudflare | MCP tools |
| Database | Supabase | Managed |

## Pre-Deploy Checklist
1. `npm run build` passes without errors
2. `.env` variables set in platform dashboard
3. `runtimeConfig` matches deployment environment
4. CSP headers allow all required origins
5. PWA manifest has correct icons
6. SEO meta tags present
7. No `console.log` in production code
8. Git remote matches deployment target

## CI/CD Pattern (GitHub Actions)
- Tests → Build → Deploy
- Branch protection on `main`
- Auto-deploy on push to `main`

## Monitoring
- Sentry for error tracking
- Railway logs for app debugging
- Cloudflare analytics for traffic

## Build Commands
```
npm run build      # Nuxt production build
npm run generate   # Static export
npm run preview    # Preview production build locally
```
