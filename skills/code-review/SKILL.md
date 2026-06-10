# Code Review Skill

> Load this skill when performing code review, quality analysis, or evaluating code changes.

## Review Process

1. **Understand context** — read surrounding code, git history, and project conventions
2. **Check correctness** — logic errors, edge cases, security vulnerabilities, type safety
3. **Check style** — follows project patterns, naming conventions, file organization
4. **Check performance** — unnecessary re-renders, memory leaks, inefficient queries
5. **Check tests** — appropriate test coverage, edge cases covered

## Review Output Format

```
## Code Review Report
### ✅ Strengths
- (what was done well)

### ⚠️ Issues
| # | Severity | File:Line | Issue | Suggestion |
|---|----------|-----------|-------|------------|

### 💡 Suggestions
- (improvements, patterns, refactors)
```

## Project-Specific Rules
- Read `~/.config/kilo/AGENTS.md` for project context
- Nuxt 4 + Vue 3 + TypeScript strict
- CSS variables for theming (no hardcoded colors)
- Components in `app/components/` (no subfolder nesting for Nuxt 4 auto-import)
- GSAP in `.client.ts` plugins only
