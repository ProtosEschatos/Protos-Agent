# /docs

Trigger: Documentation Writer agent

Generates or updates documentation for the current codebase:
- README files (project overview, setup, usage)
- API documentation (endpoints, auth, errors)
- Architecture Decision Records (ADRs)
- Changelogs (versioned change history)

Reads the codebase first to understand structure, then produces accurate documentation.

Usage: `/docs [type] [target]`
Examples: `/docs readme`
          `/docs api src/routes/`
          `/docs adr "Use Redis for caching"`
