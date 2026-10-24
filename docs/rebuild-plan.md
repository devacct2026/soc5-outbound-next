# SOC5 Outbound Rebuild

## Architecture
- frontend/: Next.js with TypeScript.
- backend/: NestJS with TypeScript.
- Supabase: PostgreSQL, authentication, and realtime.

## Source of truth
The requirements in this repository and the explicit project decisions
recorded here are authoritative. Do not clone or import the original
application or conflicting legacy behavior.

## Requirements
Preserve all existing features, business rules, permissions,
integrations, API behavior, and audit history.

NestJS controls business rules and protected database writes.

## Delivery
Implement and verify one feature at a time against the documented workflow.
This repository is a separate development application. Do not deploy, publish,
push, merge, or modify production infrastructure or data.

## Validation
Check permissions, request transitions, integrations, and data compatibility
for each feature. Inspect the development schema before preparing database
changes. Verify the connected project is `soc5-outbound-next-dev` before any
database write. If the project cannot be verified, continue local work and do
not apply migrations.