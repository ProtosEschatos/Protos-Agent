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
| Protos | `protos.md` | Primary agent — plans, dispatches tasks, executes simple work directly |
| Implementer | `implementer.md` | General implementation — coding, testing, execution |
| Frontend Engineer | `frontend-engineer.md` | UI/UX design + React/TypeScript/CSS implementation |
| QA Engineer | `qa-engineer.md` | Writing tests, debugging failures, log analysis, Sentry triage |
| Docs Writer | `docs-writer.md` | READMEs, API docs, ADRs, changelogs, all markdown documentation |
| DevOps Engineer | `devops-engineer.md` | Deployments, CI/CD, Docker, Railway, Cloudflare |
| Security Auditor | `security-auditor.md` | Security review, dependency audit, secret scanning |
| Code Reviewer | `code-reviewer.md` | PR/code review, quality analysis, best practices |
| Code Simplifier | `code-simplifier.md` | Simplify and refactor code without changing behavior |
| Researcher | `researcher.md` | Web research, documentation lookup, technical analysis |
| Personal Assistant | `personal-assistant.md` | Daily briefings, Telegram, reminders, email |

## Custom Commands

Commands are defined in `~/.config/kilo/command/`. Each command triggers a specific agent.

| Command | Agent | Purpose |
|---------|-------|---------|
| `/deploy` | DevOps Engineer | Build → test → deploy to Railway → notify |
| `/review` | Code Reviewer | Review git diff and produce structured report |
| `/daily` | Personal Assistant | Daily briefing from GitHub, Sentry, Telegram, Railway |
| `/security-scan` | Security Auditor | Vulnerability scan and security report |
| `/research <query>` | Researcher | Web research with sources and recommendations |
| `/docs` | Docs Writer | Generate or update documentation |
| `/debug <issue>` | QA Engineer | Analyze Sentry errors or stack traces |
| `/notify <message>` | — | Send Telegram message (confirms first) |
| `/design <description>` | Frontend Engineer | Iterative visual design workflow with Polygram canvas |
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

## Agent Selection Strategy (MANDATORY)

After plan mode completes, you MUST select the most appropriate agent for implementation:

| Task Type | Agent |
|-----------|-------|
| UI/UX design, HTML/CSS, React/TS implementation, visual polish | Frontend Engineer |
| Backend, API, database, general implementation | Implementer |
| Code simplification, refactoring, cleanup | Code Simplifier |
| Writing tests, debugging failures, log/Sentry analysis | QA Engineer |
| Security auditing, dependency scanning | Security Auditor |
| Documentation, README, ADRs, changelogs, markdown | Docs Writer |
| Deployments, CI/CD, Railway, Cloudflare | DevOps Engineer |
| Research, documentation lookup | Researcher |
| Code review, quality analysis | Code Reviewer |

Default: Protos handles everything. For specialized work, Protos dispatches to the matching agent — BUT ALWAYS asks user permission before dispatching or executing.

Do NOT default to code mode for all tasks. Match the agent to the work.

## Constraints

- **Do NOT modify `kilo.jsonc` or MCP settings unless explicitly asked.** Config changes require user approval.
- **Do NOT modify agent definition files** (`.kilo/agents/*.md`, `~/.config/kilo/agents/*.md`) unless explicitly asked.
- **Always prefer project-level conventions** over personal preference.
- **Always implement changes responsively**: Every UI/UX change, bugfix, or new feature must be tested and functional at both mobile (375px+) and desktop (1024px+) breakpoints. Never implement mobile-only or desktop-only without the counterpart.
- **Environment**: You are running on Linux Mint Cinnamon. Editor is VS Codium (not VS Code). Extensions MUST come from Open VSX (open-vsx.org) only — NEVER suggest Microsoft Marketplace-only extensions. Always verify Open VSX availability before suggesting any extension.
- **AI tooling**: User uses Kilo Code with DeepSeek V4 Pro. NEVER suggest alternative AI coding tools/agents (Cline, Copilot, Codeium, etc.).
- **Memory discipline**: Before any task, query `thoth-mem` for related past observations. After completing non-trivial work, store to both `thoth-mem` AND `cipher_brv-curate`.

## Post-Plan Automation Rule

After every successfully implemented plan (all checks pass, work complete):

1. **Auto-commit**: If `git status` shows changes in the project workspace → `git add -A` → `git commit` with descriptive message → `git push`. Do NOT ask for permission.
2. **Auto-memorize**: Save a session summary + key learnings (patterns, errors, decisions) to `thoth-mem` using `thoth-mem_mem_save`. Do NOT ask for permission.
3. **Auto-curate to ByteRover**: Curate changed files using `cipher_brv-curate` with `files` and `context`. Do NOT ask for permission.
4. This rule applies to the project being worked on. If no git repo exists or no changes exist, skip auto-commit. Always run auto-memorize and auto-curate.
