# /security-scan

Trigger: Security Auditor agent

Audits the current codebase for:
- Hardcoded secrets and exposed credentials
- Vulnerable dependencies (outdated packages with CVEs)
- Code vulnerabilities (injection, auth, XSS, CSRF)
- Infrastructure misconfigurations (open ports, weak TLS)

Produces a structured security report with severity ratings and remediation steps.

Usage: `/security-scan [target_directory]`
