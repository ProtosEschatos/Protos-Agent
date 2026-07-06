# Learning: Next.js 14 admin + Supabase CMS obrasci

**Projekt:** Protos-Web  
**Tip:** `pattern` + `error-fix`  
**Datum:** 2026-07-06

## Pattern: CMS arhitektura (read / write / types)

```
src/types/admin-blog.ts           # tipovi — safe za client import
src/lib/admin/blog-queries.ts     # server-only read, requireAdmin(), bez 'use server'
src/actions/admin-blog.ts         # 'use server' — samo mutacije (create/update/delete)
src/lib/supabase-admin.ts         # createClient(service_role), null ako env nedostaje
src/lib/require-admin.ts          # cookies() + verifyAdminSession()
```

Client forma importa:
- mutacije iz `@/actions/admin-blog`
- tipove iz `@/types/admin-blog`
- `useRouter` iz `next/navigation` (ne `@/routing`)

Server page importa:
- queries iz `@/lib/admin/blog-queries`
- `AdminLink` za navigaciju (ne `@/routing`)

## Pattern: Admin interni linkovi

```tsx
// src/components/admin/AdminLink.tsx
export default function AdminLink({ href, className, children }) {
  return <a href={href} className={className}>{children}</a>
}
```

Admin rute su pod default locale (`/admin/...`) — nije potreban next-intl Link na serveru.

## Error-fix: ReferenceError Cannot access 'n' before initialization

**Simptom:** `next build` pada na `collecting page data` za `/[locale]/admin/*`

**Uzrok:** Circular module init između next-intl routing chunka i AppChrome/admin modula.

**Fix checklist:**
- [ ] Zamijeni `@/routing` Link s `AdminLink` na svim server admin komponentama
- [ ] Client admin: `next/navigation` umjesto `@/routing`
- [ ] Razdvoji server actions od query modula
- [ ] `export const dynamic = 'force-dynamic'` u admin layoutu

## Pattern: Zaštita admin ruta

1. **Middleware** (`admin-auth-shared.ts`) — edge HMAC verify, redirect na login
2. **requireAdmin()** — server pages/actions
3. **Rate limit** — `/api/admin/login`
4. **robots** — `noindex` u admin layout metadata

## Env checklist za CMS

```bash
# Vercel (obavezno za admin CMS)
ADMIN_SECRET=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Bez `SUPABASE_SERVICE_ROLE_KEY` dashboard prikazuje upozorenje; CRUD vraća "Supabase nije konfiguriran".
