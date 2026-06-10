# Documentation Writer Skill

> Load this skill for creating or updating documentation: README files, API documentation, Architecture Decision Records (ADRs), changelogs, and project wikis.

## Document Types

### README.md
```markdown
# Project Name
Brief description (1-2 sentences)

## Tech Stack
- Framework, language, key dependencies

## Getting Started
```bash
git clone ...
npm install
npm run dev
```

## Project Structure
```
src/
├── components/
├── pages/
└── ...
```

## Deployment
Platform and commands
```

### ADR (Architecture Decision Record)
```markdown
# ADR-001: Title

**Date**: YYYY-MM-DD
**Status**: proposed | accepted | deprecated | superseded

## Context
(Why is this decision needed?)

## Decision
(What was decided?)

## Consequences
(Positive and negative impacts)
```

### API Documentation
- Endpoint path and method
- Request body schema (Zod)
- Response shape
- Error codes
- Authentication required?

### Changelog
```markdown
## [version] - YYYY-MM-DD
### Added
- New features
### Changed
- Modifications
### Fixed
- Bug fixes
```

## Style Rules
- Use active voice
- Code blocks with language tags
- One sentence per line in markdown source
- Keep diagrams simple (ASCII art or mermaid)
