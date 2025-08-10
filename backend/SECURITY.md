# Security Hardening Additions

This backend has been enhanced with baseline security hardening.

## Added Middleware / Modules

- helmet: Sets security-related HTTP headers (CSP disabled in non-production for Swagger convenience).
- compression: Gzip compression for responses.
- ThrottlerModule (@nestjs/throttler): Basic rate limiting (configurable via env vars) applied globally.
- Global validation pipe tightened (implicit conversion enabled, targets stripped from validation errors).
- Sanitized request logging: Removes sensitive tokens/passwords from logs.

## New Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| FRONTEND_URL | http://localhost:3000 | Primary allowed origin (legacy) |
| CORS_ORIGINS | (inherits FRONTEND_URL) | Comma separated list of allowed origins |
| RATE_LIMIT_TTL | 60 | Rate limit window in seconds |
| RATE_LIMIT_LIMIT | 100 | Maximum requests per window per IP |

## Operational Notes

- For production, set a stricter `contentSecurityPolicy` by removing the conditional disabling in `main.ts` if you do not rely on inline scripts.
- If deploying behind a reverse proxy (NGINX, AWS ALB), `app.enable('trust proxy')` allows accurate client IP detection for rate limiting.
- Adjust rate limits per environment: e.g. `RATE_LIMIT_LIMIT=1000` for internal staging.

## Future Recommendations

1. Add structured logging (e.g., pino) with log redaction.
2. Implement CSRF protection for cookie-based auth flows if introduced.
3. Add IP allow/deny lists for sensitive admin routes when applicable.
4. Introduce security headers reporting (`Report-To`, `NEL`) if required.
5. Implement audit trail persistence for authentication & data mutations.
