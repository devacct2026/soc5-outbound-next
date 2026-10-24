import { Role } from '../auth/role.decorator.js';

export enum WorkflowStatus {
  Pending = 'PENDING',
  Requested = 'REQUESTED',
  Assigned = 'ASSIGNED',
  Docking = 'DOCKING',
  Docked = 'DOCKED',
  Rejected = 'REJECTED',
  Cancelled = 'CANCELLED',
}

export type AssignmentCycle = {
  plateNumber: string;
  driverId: string | null;
  lhTripNumber: string | null;
  assignedAt: string;
  closedAt: string | null;
  replacementReason: string | null;
};

export type WorkflowEvent = {
  action: WorkflowAction['type'] | 'SUBMIT';
  actorRole: Role;
  occurredAt: string;
  reason?: string;
  plateNumber?: string;
  driverId?: string;
  lhTripNumber?: string;
};

export type WorkflowRecord = {
  status: WorkflowStatus;
  responsibleRole: Role;
  rejectedBy: Role | null;
  assignmentCycles: AssignmentCycle[];
  history: WorkflowEvent[];
};

export type WorkflowAction =
  | { type: 'APPROVE' }
  | { type: 'REJECT'; reason: string }
  | { type: 'RESUBMIT' }
  | { type: 'ASSIGN_PLATE'; plateNumber: string }
  | { type: 'ASSIGN_DRIVER'; driverId: string }
  | { type: 'FINALIZE'; lhTripNumber: string }
  | { type: 'CANCEL'; remarks?: string }
  | { type: 'REPLACE_TRUCK'; plateNumber: string; reason: string };

export class WorkflowRuleError extends Error {
  constructor(
    readonly kind: 'forbidden' | 'invalid',
    message: string,
  ) {
    super(message);
    this.name = 'WorkflowRuleError';
  }
}

function requireRole(actual: Role, expected: Role) {
  if (actual !== expected) {
    throw new WorkflowRuleError('forbidden', 'Role cannot perform this action.');
  }
}

function requireText(value: string, field: string) {
  const normalized = value.trim();
  if (!normalized) {
    throw new WorkflowRuleError('invalid', `${field} is required.`);
  }
  return normalized;
}

function requireStatus(actual: WorkflowStatus, expected: WorkflowStatus) {
  if (actual !== expected) {
    throw new WorkflowRuleError('invalid', `Action is not allowed while ${actual}.`);
  }
}

export function submitRequest(actorRole: Role, occurredAt: string): WorkflowRecord {
  requireRole(actorRole, Role.OpsPic);
  return {
    status: WorkflowStatus.Pending,
    responsibleRole: Role.OpsFte,
    rejectedBy: null,
    assignmentCycles: [],
    history: [{ action: 'SUBMIT', actorRole, occurredAt }],
  };
}

export function applyWorkflowAction(
  current: WorkflowRecord,
  actorRole: Role,
  action: WorkflowAction,
  occurredAt: string,
): WorkflowRecord {
  if (
    current.status === WorkflowStatus.Cancelled ||
    (current.status === WorkflowStatus.Docked && action.type !== 'CANCEL' && action.type !== 'REPLACE_TRUCK')
  ) {
    throw new WorkflowRuleError('invalid', `Action is not allowed while ${current.status}.`);
  }

  let next: WorkflowRecord = {
    ...current,
    assignmentCycles: current.assignmentCycles.map((cycle) => ({ ...cycle })),
    history: [...current.history],
  };
  const event: WorkflowEvent = { action: action.type, actorRole, occurredAt };

  switch (action.type) {
    case 'APPROVE':
      requireRole(actorRole, Role.OpsFte);
      requireStatus(current.status, WorkflowStatus.Pending);
      next.status = WorkflowStatus.Requested;
      next.responsibleRole = Role.FteMm;
      break;
    case 'REJECT': {
      const reason = requireText(action.reason, 'Rejection reason');
      if (actorRole === Role.OpsFte) {
        requireStatus(current.status, WorkflowStatus.Pending);
        next.responsibleRole = Role.OpsPic;
      } else if (actorRole === Role.FteMm) {
        requireStatus(current.status, WorkflowStatus.Requested);
        next.responsibleRole = Role.OpsFte;
      } else {
        throw new WorkflowRuleError('forbidden', 'Role cannot reject requests.');
      }
      next.status = WorkflowStatus.Rejected;
      next.rejectedBy = actorRole;
      event.reason = reason;
      break;
    }
    case 'RESUBMIT':
      requireStatus(current.status, WorkflowStatus.Rejected);
      if (current.rejectedBy === Role.OpsFte) {
        requireRole(actorRole, Role.OpsPic);
        next.status = WorkflowStatus.Pending;
        next.responsibleRole = Role.OpsFte;
      } else if (current.rejectedBy === Role.FteMm) {
        requireRole(actorRole, Role.OpsFte);
        next.status = WorkflowStatus.Requested;
        next.responsibleRole = Role.FteMm;
      } else {
        throw new WorkflowRuleError('invalid', 'Rejection route is missing.');
      }
      next.rejectedBy = null;
      break;
    case 'ASSIGN_PLATE': {
      requireRole(actorRole, Role.FteMm);
      requireStatus(current.status, WorkflowStatus.Requested);
      const plateNumber = requireText(action.plateNumber, 'Plate Number');
      next.assignmentCycles.push({
        plateNumber,
        driverId: null,
        lhTripNumber: null,
        assignedAt: occurredAt,
        closedAt: null,
        replacementReason: null,
      });
      next.status = WorkflowStatus.Assigned;
      next.responsibleRole = Role.DocOfficer;
      event.plateNumber = plateNumber;
      break;
    }
    case 'ASSIGN_DRIVER': {
      requireRole(actorRole, Role.DocOfficer);
      requireStatus(current.status, WorkflowStatus.Assigned);
      const driverId = requireText(action.driverId, 'Driver ID');
      if (!/^[a-z0-9]+$/i.test(driverId)) {
        throw new WorkflowRuleError('invalid', 'Driver ID must be alphanumeric.');
      }
      const activeCycle = next.assignmentCycles.at(-1);
      if (!activeCycle) {
        throw new WorkflowRuleError('invalid', 'Plate assignment is missing.');
      }
      activeCycle.driverId = driverId;
      next.status = WorkflowStatus.Docking;
      next.responsibleRole = Role.OpsPic;
      event.driverId = driverId;
      break;
    }
    case 'FINALIZE': {
      requireRole(actorRole, Role.OpsPic);
      requireStatus(current.status, WorkflowStatus.Docking);
      const activeCycle = next.assignmentCycles.at(-1);
      if (!activeCycle?.driverId) {
        throw new WorkflowRuleError('invalid', 'Driver ID must be saved before finalization.');
      }
      const lhTripNumber = requireText(action.lhTripNumber, 'LH Trip Number');
      activeCycle.lhTripNumber = lhTripNumber;
      next.status = WorkflowStatus.Docked;
      event.lhTripNumber = lhTripNumber;
      break;
    }
    case 'CANCEL': {
      event.reason = requireText(action.remarks ?? '', 'Cancellation remarks');
      if (actorRole === Role.OpsFte) {
        requireStatus(current.status, WorkflowStatus.Pending);
      } else if (actorRole === Role.FteMm) {
        if (![WorkflowStatus.Requested, WorkflowStatus.Assigned, WorkflowStatus.Docking, WorkflowStatus.Docked].includes(current.status)) {
          throw new WorkflowRuleError('invalid', `Action is not allowed while ${current.status}.`);
        }
      } else {
        throw new WorkflowRuleError('forbidden', 'Role cannot cancel requests.');
      }
      next.status = WorkflowStatus.Cancelled;
      next.responsibleRole = actorRole;
      break;
    }
    case 'REPLACE_TRUCK': {
      requireRole(actorRole, Role.FteMm);
      if (![WorkflowStatus.Assigned, WorkflowStatus.Docking, WorkflowStatus.Docked].includes(current.status)) {
        throw new WorkflowRuleError('invalid', `Action is not allowed while ${current.status}.`);
      }
      const plateNumber = requireText(action.plateNumber, 'Replacement Plate Number');
      const reason = requireText(action.reason, 'Replacement reason');
      const previousCycle = next.assignmentCycles.at(-1);
      if (!previousCycle) {
        throw new WorkflowRuleError('invalid', 'Current truck assignment is missing.');
      }
      previousCycle.closedAt = occurredAt;
      previousCycle.replacementReason = reason;
      next.assignmentCycles.push({
        plateNumber,
        driverId: null,
        lhTripNumber: null,
        assignedAt: occurredAt,
        closedAt: null,
        replacementReason: null,
      });
      next.status = WorkflowStatus.Assigned;
      next.responsibleRole = Role.DocOfficer;
      event.plateNumber = plateNumber;
      event.reason = reason;
      break;
    }
  }

  next.history.push(event);
  return next;
}