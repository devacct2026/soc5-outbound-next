# Feature Inventory

This inventory records behavior that is explicitly documented in this
repository. It does not infer requirements from the legacy application or fill
business-rule gaps with assumptions. Implementation status reflects the
rebuild checklist in [implementation-plan.md](./implementation-plan.md).

## Documented features

| Feature | Documented behavior | Current rebuild status |
|---|---|---|
| Authentication and authorization | Supabase sign-in; NestJS verifies access tokens and enforces roles from protected metadata. Health is public; protected endpoints distinguish unauthenticated from unauthorized users. | Local auth flow and guard behavior are implemented and tested. Live-token verification is blocked on confirming the development project. |
| Outbound request lifecycle | OPS PIC submits (`PENDING`); OPS FTE approves (`REQUESTED`); FTE MM assigns a plate (`ASSIGNED`); DOC Officer assigns Driver ID (`DOCKING`); OPS PIC saves the LH Trip Number (`DOCKED`). NestJS is authoritative for workflow state and permissions. | State policy and role gates are implemented as a tested domain policy. Persistence and API-backed forms are not implemented. |
| Rejection and resubmission | OPS FTE rejection returns the request to OPS PIC; FTE MM rejection returns it to OPS FTE. Rejection reasons are mandatory; rejection is not cancellation. Resubmission explicitly returns to `PENDING` or `REQUESTED` according to the rejecting stage. Prior decisions and reasons are retained. | Not implemented. |
| Cancellation and post-completion edits | OPS FTE and FTE MM may cancel within their authorized stage. FTE MM cancellation requires remarks; DOC Officer cannot reject or cancel. Authorized FTE MM may edit or cancel completed requests; cancellation sets `CANCELLED`. Edits and cancellations are audited. | Not implemented. Exact stage-specific authorization details are incomplete. |
| Truck replacement | Require a replacement plate and reason; retain previous plate, Driver ID, and LH Trip Number in history; clear active driver/trip values; set status to `ASSIGNED`; route to DOC Officer without restarting OPS FTE approval. Repeat driver assignment and OPS PIC finalization. Apply atomically and notify affected roles. | Not implemented; requires verified schema and transactional persistence. |
| Printable truck labels | Print a label using saved request values for Plate Number, Driver ID, Dock Number, Dock Time, and Start Loading. Driver ID must be saved before printing. Printing is separate from workflow mutation. | Label component and templates are present. Persisting Driver ID before opening from the latest saved request remains incomplete. |
| Realtime and actionable updates | Notify affected roles through Supabase Realtime; persist per-user acknowledgment and avoid duplicate alerts. Actionable row indicators use transparent-red blinking; alert sounds are opt-in and motion behavior must respect reduced-motion preferences. | Not implemented. |
| SeaTalk | Documentation covers login and Approval Center create/get plus callbacks. Provider use must be gated until tenant credentials, permissions/Data Scope, identity mapping, and callback behavior are verified. DOC Officer actions remain web-only absent verified support. | Documentation and a default-disabled configuration gate are present; no provider calls or verified tenant integration. |
| Dashboard | A dashboard is named as a remaining feature, but no metrics, layout, filters, or role-specific content are specified. | Requirements undefined. |
| User management | User management is named as a remaining feature, but provisioning, role assignment, deactivation, and access boundaries are unspecified. | Requirements and role-administration policy undefined. |
| Notifications | Realtime workflow notifications and acknowledgment/alert behavior are documented above. No broader notification center, delivery channels, retention, or preference-management requirements are defined. | Realtime behavior not implemented; broader scope undefined. |
| Intraday KPI | Intraday KPI is named as a remaining feature. No KPI names, formulas, time boundaries, aggregation rules, or role visibility are documented. | Requirements undefined; do not invent formulas. |
| Reporting | Reporting is named as a remaining feature. No report catalog, fields, filters, export format, or access rules are documented. | Requirements undefined; do not invent report definitions. |
| Settings | Settings is named as a remaining feature, but no settings or scope are specified. | Requirements undefined. |

## Cross-cutting requirements and gaps

- Preserve workflow state, previous decisions, assignment history, rejection
  reasons, and audit history. The database schema, audit event shape, retention,
  and actor attribution details are not yet established.
- Implement protected writes and verify database constraints, row-level
  security, concurrency, idempotency, and rollback behavior only after the
  connected Supabase project and existing schema are verified.
- The documented roles are OPS PIC, OPS FTE, FTE MM, and DOC Officer. The
  workflow identifies the responsible role at each main transition, but a
  complete role-to-action matrix—including ownership rules and post-completion
  exceptions—has not been specified.
- Dashboard, user management, Intraday KPI, reporting, and settings need
  explicit product definitions before implementation. SeaTalk behavior also
  remains blocked on tenant-specific verification.

## Sources

- [Workflow status rules](./workflow-statuses.md)
- [Rebuild plan](./rebuild-plan.md)
- [Implementation checklist](./implementation-plan.md)
