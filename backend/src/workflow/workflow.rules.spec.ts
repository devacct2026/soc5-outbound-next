import { describe, expect, it } from 'vitest';
import { Role } from '../auth/role.decorator.js';
import {
  applyWorkflowAction,
  submitRequest,
  WorkflowRuleError,
  WorkflowStatus,
} from './workflow.rules.js';

const timestamp = '2026-10-24T00:00:00.000Z';

function act(
  state: ReturnType<typeof submitRequest>,
  role: Role,
  action: Parameters<typeof applyWorkflowAction>[2],
) {
  return applyWorkflowAction(state, role, action, timestamp);
}

function assignedRequest() {
  return act(
    act(
      act(submitRequest(Role.OpsPic, timestamp), Role.OpsFte, { type: 'APPROVE' }),
      Role.FteMm,
      { type: 'ASSIGN_PLATE', plateNumber: 'ABC-123' },
    ),
    Role.DocOfficer,
    { type: 'ASSIGN_DRIVER', driverId: 'D1234' },
  );
}

function platedRequest() {
  return act(
    act(submitRequest(Role.OpsPic, timestamp), Role.OpsFte, { type: 'APPROVE' }),
    Role.FteMm,
    { type: 'ASSIGN_PLATE', plateNumber: 'ABC-123' },
  );
}

describe('workflow rules', () => {
  it('allows the complete normal sequence with one authoritative status', () => {
    expect(submitRequest(Role.OpsPic, timestamp).status).toBe(WorkflowStatus.Pending);
    const approved = act(submitRequest(Role.OpsPic, timestamp), Role.OpsFte, { type: 'APPROVE' });
    const plated = act(approved, Role.FteMm, { type: 'ASSIGN_PLATE', plateNumber: 'ABC-123' });
    const driven = act(plated, Role.DocOfficer, { type: 'ASSIGN_DRIVER', driverId: 'D1234' });
    const final = act(driven, Role.OpsPic, { type: 'FINALIZE', lhTripNumber: 'LH-55' });

    expect([approved.status, plated.status, driven.status, final.status]).toEqual([
      WorkflowStatus.Requested,
      WorkflowStatus.Assigned,
      WorkflowStatus.Docking,
      WorkflowStatus.Docked,
    ]);
  });

  it('routes both rejection and explicit resubmission paths', () => {
    const opsFteRejected = act(submitRequest(Role.OpsPic, timestamp), Role.OpsFte, {
      type: 'REJECT', reason: 'Truck details need correction',
    });
    const picResubmitted = act(opsFteRejected, Role.OpsPic, { type: 'RESUBMIT' });
    expect([opsFteRejected.status, opsFteRejected.responsibleRole, picResubmitted.status]).toEqual([
      WorkflowStatus.Rejected, Role.OpsPic, WorkflowStatus.Pending,
    ]);

    const mmRejected = act(
      act(submitRequest(Role.OpsPic, timestamp), Role.OpsFte, { type: 'APPROVE' }),
      Role.FteMm,
      { type: 'REJECT', reason: 'Assignment needs correction' },
    );
    const fteResubmitted = act(mmRejected, Role.OpsFte, { type: 'RESUBMIT' });
    expect([mmRejected.responsibleRole, fteResubmitted.status, fteResubmitted.responsibleRole]).toEqual([
      Role.OpsFte, WorkflowStatus.Requested, Role.FteMm,
    ]);
    expect(mmRejected.history.at(-1)?.reason).toBe('Assignment needs correction');
  });

  it('rejects missing reasons, invalid driver IDs, and actions from the wrong role', () => {
    expect(() => act(submitRequest(Role.OpsPic, timestamp), Role.OpsFte, {
      type: 'REJECT', reason: ' ',
    })).toThrow('Rejection reason is required.');
    expect(() => act(platedRequest(), Role.DocOfficer, {
      type: 'ASSIGN_DRIVER', driverId: 'D-123',
    })).toThrow('Driver ID must be alphanumeric.');
    expect(() => act(submitRequest(Role.OpsPic, timestamp), Role.FteMm, {
      type: 'APPROVE',
    })).toThrow(WorkflowRuleError);
  });

  it('requires saved Driver ID before trip finalization', () => {
    const approved = act(submitRequest(Role.OpsPic, timestamp), Role.OpsFte, { type: 'APPROVE' });
    const plated = act(approved, Role.FteMm, { type: 'ASSIGN_PLATE', plateNumber: 'ABC-123' });
    expect(() => act(plated, Role.OpsPic, { type: 'FINALIZE', lhTripNumber: 'LH-55' })).toThrow(WorkflowRuleError);
  });

  it('requires FTE MM cancellation remarks and prevents DOC cancellation', () => {
    const approved = act(submitRequest(Role.OpsPic, timestamp), Role.OpsFte, { type: 'APPROVE' });
    expect(() => act(submitRequest(Role.OpsPic, timestamp), Role.OpsFte, { type: 'CANCEL' })).toThrow('Cancellation remarks is required.');
    expect(() => act(approved, Role.FteMm, { type: 'CANCEL' })).toThrow('Cancellation remarks is required.');
    expect(() => act(approved, Role.DocOfficer, { type: 'CANCEL' })).toThrow(WorkflowRuleError);
    expect(act(approved, Role.FteMm, { type: 'CANCEL', remarks: 'Duplicate request' }).status).toBe(WorkflowStatus.Cancelled);
  });

  it('replaces trucks after DOCKED while preserving each assignment cycle', () => {
    const docked = act(assignedRequest(), Role.OpsPic, { type: 'FINALIZE', lhTripNumber: 'LH-55' });
    const replaced = act(docked, Role.FteMm, {
      type: 'REPLACE_TRUCK', plateNumber: 'XYZ-789', reason: 'Flat tire',
    });
    const twiceReplaced = act(replaced, Role.FteMm, {
      type: 'REPLACE_TRUCK', plateNumber: 'QRS-456', reason: 'Driver refusal',
    });

    expect(twiceReplaced.status).toBe(WorkflowStatus.Assigned);
    expect(twiceReplaced.assignmentCycles).toHaveLength(3);
    expect(twiceReplaced.assignmentCycles[0]).toMatchObject({
      plateNumber: 'ABC-123', driverId: 'D1234', lhTripNumber: 'LH-55', replacementReason: 'Flat tire',
    });
    expect(twiceReplaced.assignmentCycles[1]).toMatchObject({
      plateNumber: 'XYZ-789', driverId: null, lhTripNumber: null, replacementReason: 'Driver refusal',
    });
    expect(twiceReplaced.assignmentCycles[2]).toMatchObject({
      plateNumber: 'QRS-456', driverId: null, lhTripNumber: null, closedAt: null,
    });
  });
});