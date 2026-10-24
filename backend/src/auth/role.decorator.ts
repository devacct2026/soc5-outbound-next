import { SetMetadata } from '@nestjs/common';

export enum Role {
  OpsPic = 'OPS_PIC',
  OpsFte = 'OPS_FTE',
  FteMm = 'FTE_MM',
  DocOfficer = 'DOC_OFFICER',
}

export const REQUIRED_ROLES = 'soc5.requiredRoles';
export const Roles = (...roles: Role[]) => SetMetadata(REQUIRED_ROLES, roles);