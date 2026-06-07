# /debug

Trigger: QA & Security agent

Systematic debugging workflow:
1. Fetch error details from Sentry (if available)
2. Analyze stack traces and breadcrumbs
3. Binary search debugging to isolate root cause
4. Implement minimal fix
5. Verify with regression tests

Usage: `/debug <sentry_issue_id | error_description>`
Examples: `/debug sentry:12345`
          `/debug "TypeError in auth middleware"`
