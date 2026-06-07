# Security Review Skill

Comprehensive security review checklist covering secrets scanning, dependency auditing, input validation, auth/authorization, and OWASP Top 10.

## 1. Secrets & Credentials Scan

- [ ] No hardcoded API keys, tokens, or passwords in source files
- [ ] `.env` and credential files are in `.gitignore`
- [ ] MCP server configs use environment variable references (`${VAR}`), not plaintext
- [ ] Check git history for previously committed secrets: `git log -p | grep -i "token\|key\|secret\|password"`
- [ ] All tokens have appropriate scopes/permissions (least privilege)

## 2. Dependency Audit

- [ ] Run `npm audit` / `pip-audit` / `cargo audit` for known vulnerabilities
- [ ] Check for outdated packages with security advisories
- [ ] Verify lock file integrity (package-lock.json, Cargo.lock, etc.)
- [ ] Review recently added dependencies for supply chain risks
- [ ] Check dependency licenses for compliance

## 3. Input Validation & Injection

- [ ] SQL injection: All database queries use parameterized statements or ORM
- [ ] Command injection: No user input passed directly to shell commands (`exec`, `spawn`, `system`)
- [ ] XSS: User-generated content is sanitized before rendering
- [ ] Path traversal: File paths are validated and sandboxed
- [ ] Log injection: Log messages don't include unsanitized user input
- [ ] Template injection: Template engines configured with auto-escaping

## 4. Authentication & Authorization

- [ ] Authentication endpoints use HTTPS only
- [ ] Passwords hashed with bcrypt/argon2 (not MD5/SHA1)
- [ ] Session tokens are cryptographically random and have expiration
- [ ] JWT tokens are verified for signature, expiry, and audience
- [ ] Rate limiting on login endpoints
- [ ] Authorization checks on every protected endpoint (not just UI hiding)
- [ ] No IDOR: Object-level access is verified against user ownership

## 5. Data Protection

- [ ] Sensitive data (PII, credentials) encrypted at rest
- [ ] HTTPS enforced for all communications
- [ ] CORS configured restrictively (not `*`)
- [ ] CSP headers set appropriately
- [ ] No sensitive data in URL query parameters
- [ ] Debug/verbose error modes disabled in production

## 6. Infrastructure Security

- [ ] No unnecessary open ports
- [ ] Database not exposed to public internet
- [ ] TLS >= 1.2 (not SSL)
- [ ] Security headers present (HSTS, X-Frame-Options, X-Content-Type-Options)
- [ ] Docker images use non-root users
- [ ] Docker base images are pinned to specific digests
- [ ] CI/CD secrets are scoped and rotated

## 7. OWASP Top 10 Quick Check

1. **Broken Access Control** — authz on every endpoint
2. **Cryptographic Failures** — strong ciphers, no hardcoded keys
3. **Injection** — parameterized queries, input validation
4. **Insecure Design** — threat modeling, secure defaults
5. **Security Misconfiguration** — hardened defaults, no verbose errors
6. **Vulnerable Components** — dependency audit clean
7. **Auth Failures** — MFA, strong passwords, session management
8. **Software & Data Integrity** — pinned deps, integrity checks
9. **Logging & Monitoring** — audit logs, alerting on anomalies
10. **SSRF** — URL validation, network segmentation

## Report Format

For each finding:
- **Severity**: Critical / High / Medium / Low
- **Location**: File path and line number
- **CWE**: Common Weakness Enumeration ID if applicable
- **Description**: What the vulnerability is
- **Impact**: What an attacker could do
- **Remediation**: Specific steps to fix
