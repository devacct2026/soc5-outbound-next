# Workflow Status Rules

| Event | Backend status | Next responsible role |
|---|---|---|
| OPS PIC submits | PENDING | OPS FTE |
| OPS FTE approves | REQUESTED | FTE MM |
| FTE MM saves Plate Number | ASSIGNED | DOC Officer |
| DOC Officer saves Driver ID | DOCKING | OPS PIC |
| OPS PIC saves LH Trip Number | DOCKED | OPS PIC |

## Rejection
- OPS FTE rejection: REJECTED, returned to OPS PIC.
- FTE MM rejection: REJECTED, returned to OPS FTE.
- A rejection reason is mandatory.
- Rejection must never automatically become CANCELLED.
- Preserve previous approval decisions and assignment history.

## Cancellation
- OPS FTE and FTE MM may cancel within their authorized stage.
- FTE MM cancellation requires remarks.
- DOC Officer cannot reject or cancel.

## Finalization
- Driver ID must be saved before printing or entering LH Trip Number.
- Printing does not change the status.
- Authorized post-DOCKED edits preserve DOCKED status.
- Record all transitions and edits in the audit history.

## Authority
NestJS enforces transitions and permissions.
Role-specific display statuses derive from the backend workflow state.

## Resubmission After Rejection
- Keep REJECTED until explicitly resubmitted.
- OPS PIC resubmission returns to PENDING for OPS FTE review.
- OPS FTE resubmission returns to REQUESTED for FTE MM review.
- Preserve all previous decisions and rejection reasons.

## FTE MM Post-Completion Actions
- Authorized FTE MM may edit or cancel DOCKED/completed requests.
- Cancellation requires remarks and sets CANCELLED.
- Record edits and cancellations in audit history.

## Truck Replacement
- Require a replacement Plate Number and reason.
- Preserve previous plate, Driver ID, and LH Trip Number in history.
- Clear the active Driver ID and LH Trip Number.
- Set status to ASSIGNED and route to DOC Officer.
- Repeat driver assignment and OPS PIC finalization.
- Do not restart OPS FTE approval.
- Notify affected roles through Supabase Realtime.
- Trigger alert sounds and transparent-red blinking for actionable updates.
- Perform replacement changes together in one database transaction.