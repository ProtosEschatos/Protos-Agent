# Daily Briefing Skill

Aggregate information from all integrated services into a structured daily briefing.

## Data Sources

### GitHub
- Recent issues (created/updated in last 24h)
- Open pull requests and their status
- CI/CD status for recent commits
- Notifications and mentions

### Sentry
- New errors in the last 24 hours (filter by severity)
- Trending errors (increased frequency)
- Error distribution by project/service
- Unresolved critical issues

### Telegram
- Unread messages from the user
- Pending commands detected in messages
- Conversation history since last check

### Railway
- Service deployment status
- Recent deployments (last 24h)
- HTTP error rates and response times
- Resource usage (CPU, memory)

### Agent Manager
- Active Agent Manager sessions
- Open git worktrees
- Pending plan files (`.kilo/plans/*.md`)
- In-progress tasks

### Local System
- Git status across projects
- Recent commits
- Modified files

## Briefing Workflow

1. **Collect**: Query all data sources in parallel
2. **Filter**: Show only actionable or notable items (skip noise)
3. **Prioritize**: Critical items first (errors, failures, urgent PRs)
4. **Summarize**: One-line summaries for each item
5. **Deliver**: Output to the user, optionally send via Telegram

## Briefing Template

```
## Daily Briefing — [Date]

### Critical
- [Any critical Sentry errors, deploy failures, or urgent PRs]

### GitHub
- [#123] [Issue/PR title] — [status]
- [#124] [Issue/PR title] — [status]

### Sentry
- [N] new errors in last 24h
- [N] critical / [N] warning

### Deployments
- [service]: [status] — deployed [time] ago
- HTTP error rate: [X]%

### Telegram
- [N] unread messages
- Commands pending: [/command1, /command2]

### Active Work
- Agent Manager session: [branch name] — [status]
- Pending plans: [plan1.md, plan2.md]

### Pending Actions
- [Actionable item 1]
- [Actionable item 2]
```

## Delivery Options

- Print to console (default)
- Send via Telegram (`telegram_send_message`)
- Send via email (Resend)
- Save to a daily briefing file
