# Security Guidelines

## Overview
This document outlines security practices and requirements for the Zaparkyi project.

## Current Implementation

### Session Storage
- User sessions are stored in `localStorage` using XOR/base64 obfuscation
- Session data is minimal: only `id`, `email`, expiry timestamp, and integrity hash
- Full user profile is re-fetched from Supabase on each page load
- Auth token is used as encryption key for stored session data

### Integrity Verification
- Sessions include an integrity hash computed from `id:email:expiry:token`
- Tampered or corrupted sessions are automatically invalidated
- Expired sessions are cleared on detection

### Input Validation
- Email format validation before auth operations
- Password strength requirements (min 8 chars, 1 digit, 1 uppercase)
- Phone number format validation
- XSS sanitization on all user inputs (HTML entity encoding, script tag removal)
- Numeric bounds validation (0–1,000,000 range)

## Production Requirements

For production deployment, the following MUST be implemented:

1. **httpOnly Cookies** — Replace localStorage with server-set httpOnly cookies for session tokens to prevent XSS-based token theft.

2. **CSRF Protection** — Implement anti-CSRF tokens on all state-changing requests (POST/PUT/DELETE).

3. **Content Security Policy (CSP)** — Set strict CSP headers to prevent XSS and data injection.

4. **Subresource Integrity (SRI)** — Add SRI attributes to all external script and stylesheet links.

5. **Supabase SSR** — Migrate from `@supabase/supabase-js` client to `@supabase/ssr` package for server-side cookie management.

6. **Rate Limiting** — Implement rate limiting on auth endpoints (login, register) to prevent brute force.

7. **Audit Logging** — Log all auth events (login, logout, failed attempts) for security monitoring.

## Threat Model

| Threat | Current Mitigation | Production Required |
|--------|-------------------|-------------------|
| XSS via localStorage | XOR/base64 obfuscation | httpOnly cookies |
| Session replay | 30-day expiry + integrity hash | Short-lived + refresh tokens |
| CSRF | Not implemented | CSRF tokens |
| Brute force login | Password validation only | Rate limiting + account lockout |
| SQL injection | Supabase parameterized queries | Same (adequate) |

## Audit
- Last security audit: 2026-05
- Next scheduled audit: 2027-05
