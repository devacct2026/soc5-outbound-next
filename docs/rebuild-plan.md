# SOC5 Outbound Rebuild

## Architecture
- frontend/: Next.js with TypeScript.
- backend/: NestJS with TypeScript.
- Supabase: PostgreSQL, authentication, and realtime.

## Source of truth
Original repository:
https://gitlab.com/outbound-project/soc-5-outbound

## Requirements
Preserve all existing features, business rules, permissions,
integrations, API behavior, and audit history.

NestJS controls business rules and protected database writes.

## Delivery
Replace one feature at a time.
Verify each replacement against the original before switching.
Keep the existing application available during the rebuild.

## Validation
Check permissions, request transitions, integrations,
and existing data compatibility for each feature.