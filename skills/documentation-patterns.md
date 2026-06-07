# Documentation Patterns Skill

Templates and conventions for producing consistent, high-quality documentation across the project.

## README Template

```markdown
# [Project Name]

[Brief description — what it does, who it's for]

## Getting Started

### Prerequisites
- [Requirement 1]
- [Requirement 2]

### Installation

```bash
[install command]
```

### Quick Start

```bash
[run command]
```

## Usage

### [Feature 1]
[Code example]

### [Feature 2]
[Code example]

## API

See [API docs link] or the [docs/](./docs/) directory.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[License name] — see [LICENSE](./LICENSE) file.
```

## API Documentation Template

```markdown
# [Resource Name]

## Endpoints

### `[METHOD] /path`

**Description**: [What it does]

**Authentication**: [Required/None] — [Auth type]

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| [name] | [type] | [yes/no] | [description] |

**Request Example**:

```json
{
  "field": "value"
}
```

**Response** (`[status]`):

```json
{
  "field": "value"
}
```

**Errors**:

| Code | Description |
|------|-------------|
| 400 | [Error description] |
| 401 | [Error description] |
| 404 | [Error description] |
| 500 | [Error description] |

**Rate Limit**: [X requests per Y]
```

## Architecture Decision Record (ADR) Template

```markdown
# ADR-[NNN]: [Title]

**Status**: [Proposed / Accepted / Deprecated / Superseded by ADR-XXX]

**Date**: [YYYY-MM-DD]

**Context**:

[What is the problem we're solving? What constraints exist?]

**Decision**:

[What did we decide to do? Be specific and concrete.]

**Consequences**:

- Positive: [What improves?]
- Negative: [What tradeoffs did we accept?]
- Neutral: [What else changes?]

**Alternatives Considered**:

1. [Alternative 1] — [Why rejected]
2. [Alternative 2] — [Why rejected]
```

## Changelog Template

```markdown
# Changelog

## [Version] — [YYYY-MM-DD]

### Added
- [New feature 1]
- [New feature 2]

### Changed
- [Modified behavior 1]

### Fixed
- [Bug fix 1] ([#issue])
- [Bug fix 2] ([#issue])

### Deprecated
- [Deprecated feature] — will be removed in [version]

### Removed
- [Removed feature]

### Security
- [Security fix] ([CVE-XXXX-XXXX])
```

## Writing Guidelines

### Style
- Active voice, present tense ("Returns the user" not "The user is returned")
- Code blocks with language tags (` ```javascript `, ` ```bash `)
- Descriptive link text (never "click here")
- Consistent heading hierarchy: # → ## → ### (no skip levels)
- One sentence per line for clean git diffs

### Naming Conventions
- Files: `kebab-case.md` (e.g., `api-reference.md`, `getting-started.md`)
- Headings: Sentence case (e.g., "## Getting started" not "## Getting Started")
- References: Use relative paths (`[link](./file.md)` not `[link](https://...)`)

### Anti-Patterns
- Don't duplicate information across files — link instead
- Don't document code that doesn't exist yet
- Don't include timestamps or "Last updated" — use git history
- Don't write "Note:", "Important:", "Warning:" as plain text — use blockquotes/admonitions
- Don't use emoji in technical documentation unless the project convention includes them
