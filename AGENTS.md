# Kilo Agent Instructions

## Memory & Knowledge Base (thoth-mem)

You have access to a persistent knowledge base via the `thoth-mem` MCP server. Use it to retain and retrieve knowledge across sessions so that every task benefits from past work.

### Search Memory First
Before starting any task — whether planning, coding, or testing — query `thoth-mem` for related past observations. Use relevant keywords from the current task to find prior decisions, patterns, errors, and project context.

### Store Learnings After Every Task
After completing non-trivial work, store key information to `thoth-mem` so future sessions can build on it. Categorize observations with these types:

| Type | Use For |
|------|---------|
| `project-summary` | Overall project purpose, tech stack, directory layout |
| `architecture-decision` | Design decisions, tradeoffs, rationale |
| `error-fix` | Bugs encountered and how they were resolved |
| `pattern` | Reusable code patterns, conventions, idioms found in the codebase |
| `tool-config` | Tool setup, MCP configurations, CI/CD details |
| `api-key-info` | API endpoints, authentication methods, rate limits |

When storing an observation, include:
- The project name and language
- A descriptive title summarizing the knowledge
- The relevant `type` as a fact (`HAS_TYPE`)
- Any additional facts that enrich searchability (e.g., `HAS_TOPIC`, `HAS_FILE`)

### Keep Memory Organized
- Deduplicate: before storing, check if a similar observation already exists and update it instead.
- Link related observations using cross-references in the content.
- Periodically review and consolidate scattered observations.

## Context7 — Proactive Documentation Fetching

When working with a library, framework, or API, use the `context7` MCP server to fetch its documentation **before** writing code. This ensures:
- You use current APIs and best practices
- You avoid deprecated methods
- You learn patterns that can be stored to memory

## ByteRover — Code Context (cipher_brv)

When working in a project, curate code-level context to ByteRover using `cipher_brv-curate` so the codebase knowledge graph stays current across sessions.

### Curate After Code Changes
After non-trivial file edits, curate the changed files:
- Provide `files` — paths to modified source files (max 5)
- Provide `context` — what changed, why, and any patterns discovered
- ByteRover processes asynchronously; no need to wait for completion

### Curate on Project Entry
When entering a new project, seed ByteRover with its root context:
- `folder` — root directory of the project (triggers full pack + analysis)
- `context` — project purpose, tech stack, key directories

### BRV ↔ thoth-mem Relationship
- **thoth-mem**: session summaries, architecture decisions, config, errors, learnings
- **ByteRover**: code-level knowledge — file paths, code patterns, project structure, symbol relationships
- Always curate to BOTH after non-trivial work (unless no code changed)

## Git & GitHub — Cross-Project Awareness

Use the `git` and `github` MCP servers to understand repository structure and history before storing knowledge. When entering a project:
1. Check `git remote` to identify the repository
2. Note the tech stack from config files (package.json, Cargo.toml, etc.)
3. Review recent commits for active areas of work
4. Store a `project-summary` observation if one doesn't exist

## Agent Roster

The following agents are available in `~/.config/kilo/agents/`. Switch to an agent by referencing its name or purpose.

| Agent | File | Purpose |
|-------|------|---------|
| Protos | `protos.md` | Primary orchestrator — plans and dispatches tasks to specialist agents. Never executes directly. |
| Dev | `dev.md` | All coding — backend, frontend (React/TS/CSS), refactoring, implementation |
| QA & Security | `qa-security.md` | Testing, debugging, Sentry triage, security audit, dependency scanning, code review |
| Ops & Docs | `ops-docs.md` | Deployments (Railway, Cloudflare), CI/CD, Docker, infrastructure, documentation |
| Assistant | `assistant.md` | Research, documentation lookup, daily briefings, Telegram, email, notifications |

## Custom Commands

Commands are defined in `~/.config/kilo/command/`. Each command triggers a specific agent.

| Command | Agent | Purpose |
|---------|-------|---------|
| `/deploy` | Ops & Docs | Build → test → deploy to Railway → notify |
| `/review` | QA & Security | Review git diff and produce structured report |
| `/daily` | Assistant | Daily briefing from GitHub, Sentry, Telegram, Railway |
| `/security-scan` | QA & Security | Vulnerability scan and security report |
| `/research <query>` | Assistant | Web research with sources and recommendations |
| `/docs` | Ops & Docs | Generate or update documentation |
| `/debug <issue>` | QA & Security | Analyze Sentry errors or stack traces |
| `/notify <message>` | — | Send Telegram message (confirms first) |
| `/design <description>` | Dev | Iterative visual design workflow with Polygram canvas |
| `/run-plan <plan>` | Protos | Parse plan and dispatch tasks to matching agents |

## Skills

Skills are reusable instruction bundles in `~/.config/kilo/skills/`. Load them with the `skill` tool when a task matches.

| Skill | File | Use When |
|-------|------|----------|
| Deploy Workflow | `deploy-workflow.md` | Railway deployments, CI/CD |
| Security Review | `security-review.md` | Security audits, vulnerability scanning |
| Daily Briefing | `daily-briefing.md` | Aggregating daily status across services |
| Documentation Patterns | `documentation-patterns.md` | Writing READMEs, API docs, ADRs, changelogs |
| Design System | `design-system.md` | CSS best practices, component patterns, accessibility, animations |
| Code Review | `code-review.md` | Reviewing git diffs, code quality, bug detection |
| Security Audit | `security-audit.md` | Dependency scanning, CSP/CORS, RLS policies, vulnerability checks |
| Code Simplify | `code-simplify.md` | Refactoring, reducing complexity, removing dead code |
| Frontend Engineer | `frontend-engineer.md` | Vue 3 / Nuxt 4 UI/UX, Nuxt UI v3 components, Tailwind theming |
| DevOps Engineer | `devops-engineer.md` | Railway/Vercel/Cloudflare deployments, CI/CD, infrastructure |
| Docs Writer | `docs-writer.md` | README, ADR, changelogs, API documentation |
| Deep Research | `deep-research.md` | Multi-source web research with cited sources and recommendations |

## Agent Selection Strategy (MANDATORY)

After plan mode completes, you MUST select the most appropriate agent for implementation:

| Task Type | Agent |
|-----------|-------|
| UI/UX design, HTML/CSS, React/TS implementation, visual polish | Dev |
| Backend, API, database, general implementation | Dev |
| Code simplification, refactoring, cleanup | Dev |
| Writing tests, debugging failures, log/Sentry analysis | QA & Security |
| Security auditing, dependency scanning | QA & Security |
| Code review, quality analysis | QA & Security |
| Deployments, CI/CD, Railway, Cloudflare | Ops & Docs |
| Documentation, README, ADRs, changelogs, markdown | Ops & Docs |
| Research, documentation lookup | Assistant |
| Daily briefings, Telegram, reminders, email | Assistant |

**Dispatch mechanism**: Tasks are dispatched via `task` tool with `subagent_type: "general"`. The `general` subagent is a transport channel — the agent identity is established by instructing the subagent to FIRST read the specialist agent's .md instructions file before executing the assigned task. This ensures the subagent operates with the full context, modes, skills, and constraints of the designated specialist (Dev, QA & Security, Ops & Docs, or Assistant).

Default: Protos orchestrates everything — planning, presenting, getting confirmation, and dispatching to the matching agent. Protos NEVER executes tasks directly. All work is delegated to Dev, QA & Security, Ops & Docs, or Assistant.

Do NOT default to code mode for all tasks. Match the agent to the work.

## Constraints

- **Do NOT modify `kilo.jsonc` or MCP settings unless explicitly asked.** Config changes require user approval.
- **Do NOT modify agent definition files** (`.kilo/agents/*.md`, `~/.config/kilo/agents/*.md`) unless explicitly asked.
- **Always prefer project-level conventions** over personal preference.
- **Always implement changes responsively**: Every UI/UX change, bugfix, or new feature must be tested and functional at both mobile (375px+) and desktop (1024px+) breakpoints. Never implement mobile-only or desktop-only without the counterpart.
- **Environment**: You are running on Linux Mint Cinnamon. Editor is VS Codium (not VS Code). Extensions MUST come from Open VSX (open-vsx.org) only — NEVER suggest Microsoft Marketplace-only extensions. Always verify Open VSX availability before suggesting any extension.
- **AI tooling**: User uses Kilo Code with DeepSeek V4 Pro. NEVER suggest alternative AI coding tools/agents (Cline, Copilot, Codeium, etc.).
- **Memory discipline**: Before any task, query `thoth-mem` for related past observations. After completing non-trivial work, store to both `thoth-mem` AND `cipher_brv-curate`.

## Permanent Stack — ALWAYS ACTIVE

> ⚠️ **DEFINITIVE. Nuxt 4 + Vue 3 + TypeScript (strict). Tailwind v4 via Nuxt UI v3. Never suggest anything outside this list.**

### Core
| Layer | Technology |
|-------|-----------|
| Framework | **Nuxt 4** |
| UI | **Vue 3 + TypeScript (strict)** |
| CSS | **Tailwind v4** (via Nuxt UI v3 — NOT @nuxtjs/tailwindcss) |
| UI Components | **Nuxt UI v3** (includes Tailwind v4 + form validation with Zod) |

### Required Packages
**Frontend Core**: @nuxt/ui, @nuxt/icon, @nuxt/fonts, @nuxt/image, @nuxtjs/seo, @nuxtjs/i18n (hr/en/de, prefix_except_default), @nuxtjs/color-mode, @nuxt/content, @nuxt/scripts, nuxt-security
**State**: @pinia/nuxt, @vueuse/nuxt + @vueuse/core + @vueuse/motion
**Backend**: @nuxtjs/supabase, drizzle-orm + drizzle-kit, zod, stripe, resend, @getbrevo/brevo, @calcom/embed-snippet
**3D/Visual**: @tresjs/nuxt, gsap, @splinetool/vue-spline, vue3-lottie
**Platform**: @vite-pwa/nuxt, @capacitor/core (+ ios/android), @capgo/capacitor-updater
**Monitoring**: @sentry/nuxt, vue-toastification
**Testing**: @nuxt/test-utils + vitest + @vue/test-utils

### Forbidden Zone — NEVER use, suggest, or install
Frameworks: React, Next.js, Angular, Svelte, SvelteKit, SolidJS, Astro, @nuxtjs/tailwindcss
State: Vuex, Redux, Zustand, Jotai
ORM: Prisma (use Drizzle)
Database: Firebase, PlanetScale, Neon, MongoDB, MySQL, MariaDB (use Supabase)
Auth: Clerk, Lucia, Auth.js, NextAuth, @sidebase/nuxt-auth, Better Auth (use Supabase Auth)
Forms: VeeValidate (Nuxt UI v3 has built-in Zod validation)
Cross-Platform: Tauri, Electron, React Native (use Capacitor + PWA)
3D: Three.js direct, Vanta.js, Particles.js, React Three Fiber (use TresJS)
Realtime: Socket.io, Pusher, Ably, PartyKit (use Supabase Realtime)
Search: Algolia (use Supabase FTS or Meilisearch)
Email: Mailchimp, MailerLite, SendGrid, Mailgun, Postmark, Nodemailer (use Resend + Brevo)
Analytics: Hotjar, Plausible, Fathom, Umami, PostHog (use GA4 + Clarity)
Chat: Intercom, Tidio, Tawk.to (use Crisp)
Payment: PayPal, Square, Paddle, LemonSqueezy (use Stripe)
Hosting: Netlify, DigitalOcean, Render, AWS, Heroku (use Vercel + Railway + Cloudflare)
Automation: Zapier, BullMQ, Inngest (use n8n)
Build: Webpack (Nuxt uses Vite)
API: GraphQL, tRPC (use REST via server/api/)

### 10 Rules
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

### Critical Patterns
- **GSAP**: Must be `.client.ts` plugin (SSR crash otherwise)
- **Stripe Webhook**: Required at `server/api/stripe/webhook.post.ts`
- **CSP**: Must allow WebGL (`'unsafe-eval'`, `'wasm-unsafe-eval'`, `blob:` workers)
- **External scripts**: ONLY via `@nuxt/scripts` registry, never raw `<script>` tags
- **Capacitor**: Requires SPA mode (`ssr: false`), set `BUILD_TARGET=mobile` in .env
- **Drizzle SSL**: `false` locally, `true` in production

### Folder Structure (Nuxt 4)
```
app/components/{ui,sections,3d}/  ← ALL Vue code
app/composables/  app/layouts/  app/middleware/  app/pages/  app/plugins/
app/stores/  app/utils/  app/app.vue
server/api/{stripe,booking,kontakt}/  server/middleware/  server/utils/
shared/  content/  public/icons/  drizzle/  i18n/locales/
```

### Deploy
Vercel (client sites) | Railway (apps with DB) | Cloudflare (DNS) | Supabase (database)
Capacitor + Capgo (mobile) | PWA (desktop) | n8n (automation)

## Post-Execution Workflow Rule

After every agent dispatch completes:
1. Check memory for the original plan — diff what was done vs what was planned
2. Put any missed/unfinished items in a todo list
3. Immediately propose the best-suited agent to continue/fix/complete remaining work
4. NEVER silently drop incomplete tasks

## Post-Plan Automation Rule

After every successfully implemented plan (all checks pass, work complete):

1. **Auto-commit**: If `git status` shows changes in the project workspace → `git add -A` → `git commit` with descriptive message → `git push`. Do NOT ask for permission.
2. **Auto-memorize**: Save a session summary + key learnings (patterns, errors, decisions) to `thoth-mem` using `thoth-mem_mem_save`. Do NOT ask for permission.
3. **Auto-curate to ByteRover**: Curate changed files using `cipher_brv-curate` with `files` and `context`. Do NOT ask for permission.
4. This rule applies to the project being worked on. If no git repo exists or no changes exist, skip auto-commit. Always run auto-memorize and auto-curate.
