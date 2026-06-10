# Deep Research Skill

> Load this skill for in-depth research tasks: technology evaluation, competitor analysis, library comparison, trend investigation.

## Research Process

1. **Define scope** — what question are we answering? What's the time budget?
2. **Multi-source search** — Brave Search, Context7 (docs), GitHub, web pages
3. **Cross-reference** — verify claims across 2+ sources
4. **Synthesize** — don't just list facts, connect them into actionable recommendations
5. **Cite sources** — URL + date accessed for every claim

## Research Output Format

```markdown
# Research: [Topic]

## Executive Summary
(3-5 sentence overview with key findings)

## Findings
| # | Source | Key Point | Relevance |
|---|--------|-----------|-----------|

## Analysis
(Connections, trade-offs, implications)

## Recommendation
(Clear, actionable next step)

## Sources
- [Source 1](url) — accessed YYYY-MM-DD
- [Source 2](url) — accessed YYYY-MM-DD
```

## Tool Priority
1. `thoth-mem_mem_recall` — check past research first
2. `brave-search_brave_web_search` — current web results
3. `context7_resolve-library-id` + `context7_query-docs` — library documentation
4. `webfetch` — read specific pages in detail
5. `github_search_repositories` / `github_search_code` — open source examples
