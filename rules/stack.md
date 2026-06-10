# Permanent Stack Specification — Protos Web v2

> ⚠️ **DEFINITIVE. This is the ONLY stack. Never suggest, install, or mention anything outside this list.**
> **Nuxt 4 + Vue 3 + TypeScript (strict). Tailwind v4 via Nuxt UI v3. No exceptions.**

---

## Core

| Layer | Technology |
|-------|-----------|
| Framework | **Nuxt 4** |
| UI | **Vue 3 + TypeScript (strict)** |
| CSS | **Tailwind v4** (via Nuxt UI v3 — NOT @nuxtjs/tailwindcss) |
| UI Components | **Nuxt UI v3** (includes Tailwind v4 + form validation with Zod) |

## Nuxt Modules & Packages

### Frontend Core
| Package | Purpose |
|---------|---------|
| `@nuxt/ui` | UI components + Tailwind v4 + form validation |
| `@nuxt/icon` | 200,000+ Iconify icons (replaces Font Awesome) |
| `@nuxt/fonts` | Google Fonts + custom font optimization |
| `@nuxt/image` | Automatic image optimization |
| `@nuxtjs/seo` | Sitemap, OG, Schema, Robots — all SEO in one |
| `@nuxtjs/i18n` | Multi-language (hr/en/de, prefix_except_default) |
| `@nuxtjs/color-mode` | Dark/Light/Profi mode |
| `@nuxt/content` | Markdown-based CMS/blog |
| `@nuxt/scripts` | External scripts (GA4, Crisp, Clarity) — ONLY way |
| `nuxt-security` | CSP headers (MUST allow WebGL for TresJS/Spline) |

### State & Utilities
| Package | Purpose |
|---------|---------|
| `@pinia/nuxt` | State management |
| `@vueuse/nuxt` + `@vueuse/core` + `@vueuse/motion` | Composables + simple animations |

### Backend (all in Nuxt server/api/)
| Package | Purpose |
|---------|---------|
| `@nuxtjs/supabase` | Database + Auth + Storage + Realtime |
| `drizzle-orm` + `drizzle-kit` | Type-safe database ORM |
| `zod` | Server + client validation |
| `stripe` + `@stripe/stripe-js` | Payments + webhook handler |
| `resend` | Transactional email |
| `@getbrevo/brevo` | Newsletter + marketing email |
| `@calcom/embed-snippet` | Booking embed |

### Visual & 3D
| Package | Purpose |
|---------|---------|
| `@tresjs/nuxt` | Three.js wrapper for Vue (NEVER raw Three.js) |
| `gsap` | Complex animations, ScrollTrigger |
| `@splinetool/vue-spline` + `@splinetool/runtime` | Spline 3D scenes |
| `vue3-lottie` | After Effects animations |

### Cross-Platform
| Package | Purpose |
|---------|---------|
| `@vite-pwa/nuxt` | PWA + Service Worker |
| `@capacitor/core` + `ios`/`android` | Mobile apps (iOS + Android) |
| `@capgo/capacitor-updater` | OTA live updates (no App Store review) |

### Monitoring
| Package | Purpose |
|---------|---------|
| `@sentry/nuxt` | Error tracking |
| `vue-toastification` | Toast notifications |

### Testing
| Package | Purpose |
|---------|---------|
| `@nuxt/test-utils` + `vitest` + `@vue/test-utils` | Testing framework |

## Forbidden Zone

> **NEVER use, suggest, or install:**

**Frameworks**: React, Next.js, Angular, Svelte, SvelteKit, SolidJS, Astro, @nuxtjs/tailwindcss (Nuxt UI v3 includes it)

**State**: Vuex, Redux, Zustand, Jotai

**ORM**: Prisma (use Drizzle)

**Database**: Firebase, PlanetScale, Neon, MongoDB, MySQL, MariaDB (use Supabase)

**Auth**: Clerk, Lucia, Auth.js, NextAuth, @sidebase/nuxt-auth, Better Auth (use Supabase Auth)

**Forms**: VeeValidate (Nuxt UI v3 has built-in Zod validation)

**Cross-Platform**: Tauri (mobile not production ready), Electron (bloated), React Native (React ecosystem)

**3D**: Three.js direct, Vanta.js, Particles.js, React Three Fiber (use TresJS)

**Realtime**: Socket.io, Pusher, Ably, PartyKit (use Supabase Realtime)

**Search**: Algolia (use Supabase FTS or Meilisearch)

**Email**: Mailchimp, MailerLite, SendGrid, Mailgun, Postmark, Nodemailer (use Resend + Brevo)

**Analytics**: Hotjar, Plausible, Fathom, Umami, PostHog (use GA4 + Clarity)

**Chat**: Intercom, Tidio, Tawk.to (use Crisp)

**Payment**: PayPal, Square, Paddle, LemonSqueezy (use Stripe)

**Hosting**: Netlify, DigitalOcean, Render, AWS, Heroku (use Vercel + Railway + Cloudflare)

**Automation**: Zapier, BullMQ, Inngest (use n8n)

**Build**: Webpack (Nuxt uses Vite)

**API**: GraphQL, tRPC (use REST via server/api/)

## 10 Rules (Updated)

1. Secrets → `.env` + `runtimeConfig` (NEVER in code)
2. External API calls → `server/api/` (NEVER from frontend)
3. Validation → Zod always (Nuxt UI v3 form validation)
4. Auth → Supabase Auth only (useSsrCookies: true required)
5. Database → Drizzle ORM + PostgreSQL (SSL false local, true production)
6. 3D → TresJS (no direct Three.js in components)
7. Animations → GSAP (.client.ts plugin) for complex, @vueuse/motion for simple
8. State → Pinia (no provide/inject for global state)
9. TypeScript → strict mode always
10. Components → `app/components/{ui,sections,3d}/` (Nuxt 4 app/ directory)

## Critical Patterns

- **GSAP**: Must be `.client.ts` plugin (SSR crash otherwise)
- **Stripe Webhook**: Required at `server/api/stripe/webhook.post.ts`
- **CSP**: Must allow WebGL (`'unsafe-eval'`, `'wasm-unsafe-eval'`, `blob:` workers)
- **External scripts**: ONLY via `@nuxt/scripts` registry, never raw `<script>` tags
- **Capacitor**: Requires SPA mode (`ssr: false`), set `BUILD_TARGET=mobile` in .env
- **Drizzle SSL**: `false` locally, `true` in production (Supabase PostgreSQL connection)

## Folder Structure (Nuxt 4)

```
app/          ← ALL Vue/frontend code (Nuxt 4 structure)
  components/{ui,sections,3d}/
  composables/
  layouts/
  middleware/
  pages/
  plugins/    ← gsap.client.ts, lottie.client.ts
  stores/
  utils/
  app.vue
server/       ← Backend API routes
  api/{stripe,booking,kontakt}/
  middleware/
  utils/
shared/       ← NEW Nuxt 4 — shared types/utils between app + server
content/      ← Nuxt Content markdown files
public/icons/ ← PWA icons (192px, 512px)
drizzle/      ← ORM schema + migrations
i18n/locales/ ← hr.json, en.json, de.json
```

## Deploy

| Type | Platform |
|------|----------|
| Client sites | **Vercel** (GitHub auto-deploy) |
| Apps with DB | **Railway** |
| DNS/Protection | **Cloudflare** |
| Database | **Supabase** |
| Automation | **n8n** (self-host on Railway) |
| Mobile iOS/Android | **Capacitor** + **Capgo OTA** |
| Desktop | **PWA** (browser install) |
