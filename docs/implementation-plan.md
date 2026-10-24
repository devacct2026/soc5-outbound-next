# Rebuild Implementation Checklist

Requirements in this repository and explicit project decisions are the source
of truth. Do not clone or import the original application. Keep production
untouched and do not deploy, publish, push, or merge.

## 1. Baseline and existing checks
- [x] Inspect architecture, docs, working tree, manifests, and current checks.
- [x] Run baseline unit tests, lint, type/build checks, and backend e2e tests.
- [x] Add a complete feature inventory from the requirements and documented
	behavior; identify undefined KPI formulas, report definitions, and role maps.

## 2. Backend authentication and role authorization
- [x] Verify Supabase access tokens; protect routes by default and mark health
	explicitly public.
- [x] Enforce roles from protected `app_metadata`, never editable
	`user_metadata`; distinguish 401 from 403.
- [x] Add local guard tests for missing, malformed, invalid, expired, valid,
	insufficient-role, and editable-metadata tokens.
- [ ] Add live token integration tests against the verified development project.

## 3. Database schema, RLS, transactions, and audit history
- [ ] Identify and verify the connected project as `soc5-outbound-next-dev`.
- [ ] Inspect its schema and existing policies before proposing migrations.
- [ ] Implement transaction-safe workflow mutations, RLS, audit history,
	notifications, concurrency controls, and idempotency.
- [ ] Add rollback, integrity, and migration tests; apply only to verified dev.

## 4. Next.js authentication and role-aware shell
- [x] Build Supabase sign-in/session handling, NestJS profile verification,
	logout, and a same-origin development API rewrite.
- [ ] Build role-specific request navigation and operational screens.
- [ ] Add loading, empty, error, and mobile/desktop states.

## 5. Request submission, approval, assignment, and finalization
- [x] Encode PENDING -> REQUESTED -> ASSIGNED -> DOCKING -> DOCKED and role
	gates as a unit-tested backend domain policy.
- [ ] Persist transitions through protected transactional API operations.
- [ ] Validate role, owner, input, concurrency, audit, and notification rules.
- [ ] Add real API-backed forms and regression coverage.

## 6. Rejection, correction, cancellation, and truck replacement
- [ ] Implement both rejection/resubmission routes and required reasons.
- [ ] Enforce cancellation remarks, role restrictions, and terminal behavior.
- [ ] Preserve replacement cycles and clear active driver/trip data atomically.
- [ ] Verify repeated and post-DOCKED replacement behavior.

## 7. Printable truck labels
- [x] Search the workspace and local Git history; the original
	`PrintableTruckLabel` component is absent.
- [x] Fetch the source `single_lh`, `coload_lh`, and `triload_lh` background
	assets and add a separate printable component using saved data props.
- [x] Provide a separate Print action that does not mutate workflow state.
- [ ] Persist Driver ID before opening a label from latest saved request data.
- [x] Map Plate Number, Driver ID, Dock Number, Dock Time, and Start Loading
	onto the source label backgrounds.

## 8. Realtime and attention indicators
- [ ] Add managed subscriptions, reconnect recovery, and logout cleanup.
- [ ] Persist per-user acknowledgment and avoid duplicate event alerts.
- [ ] Add opt-in sound and reduced-motion-compatible actionable row indicators.

## 9. SeaTalk
- [x] Fetch SeaTalk documentation for Approval Center create/get, event
	callbacks, login, setup, and operation.
- [x] Add a default-disabled server configuration gate for documented required
	secrets and callback URLs; no provider calls are enabled.
- [ ] Verify the tenant app, permissions/Data Scope, credentials, employee-code
	mapping, and supported update/callback behaviors.
- [ ] Implement authenticated callbacks, replay protection, idempotency, and
	conflict history only against verified provider contracts.
- [ ] Do not claim provider integration while documentation/configuration is
	unavailable; DOC Officer actions remain web-only.

## 10. Remaining features and release verification
- [x] Inventory dashboard, user management, notifications, Intraday KPI,
	reporting, settings, and other documented requirements in
	[feature-inventory.md](./feature-inventory.md).
- [ ] Resolve missing formulas, report definitions, and role mappings without
	inventing business behavior.
- [ ] Run unit, integration, Playwright, lint, type, and production build gates.
- [ ] Report passed, failed, skipped, and externally blocked checks accurately.

## Current blockers
- The local Supabase project ref is `fjehhrysseblrvoanrek`; its association
	with the intended development project name has not been verified.
- No schema or migration files are present. Do not apply database changes until
	the project identity and current schema are established.
- The source `PrintableTruckLabel` component is absent; source backgrounds and
	SeaTalk docs are fetched under `frontend/public/label-templates/` and
	`docs/reference/seatalk/`. Tenant credentials, permission scope, and approval
	callback signature details still require verification.

## Local development
Run each app in its own terminal:

```bash
cd backend && npm run start:dev
cd frontend && npm run dev
```

The frontend is available at `http://localhost:3000`; the NestJS API listens on
port `3001` with the `/api` prefix. The frontend rewrite uses
`BACKEND_API_ORIGIN` when set and otherwise targets `http://localhost:3001`.

Backend configuration uses `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and
`FRONTEND_ORIGIN` (with optional `PORT`). Frontend sign-in uses
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Keep
secret keys server-side. Do not perform database writes until the connected
project is verified as `soc5-outbound-next-dev`.