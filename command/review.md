# /review

Trigger: Code Reviewer agent

Reviews the current git diff (uncommitted changes or PR diff) and produces a structured report covering:
- Code correctness and logic errors
- Style and convention adherence
- Performance issues
- Security concerns
- Missing test coverage

Usage: `/review [base_branch]`
