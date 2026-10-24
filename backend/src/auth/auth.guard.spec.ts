import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { ExecutionContext } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthGuard } from './auth.guard.js';
import type { AuthenticatedRequest } from './auth.guard.js';
import { Role, Roles } from './role.decorator.js';

const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { getUser } }),
}));

class ProtectedController {
  checkRole() {}
}

Roles(Role.OpsFte)(
  ProtectedController.prototype,
  'checkRole',
  Object.getOwnPropertyDescriptor(ProtectedController.prototype, 'checkRole')!,
);

describe('AuthGuard', () => {
  let guard: AuthGuard;

  const makeContext = (authorization?: string): ExecutionContext => {
    const request = {
      headers: authorization ? { authorization } : {},
    } as AuthenticatedRequest;

    return {
      getHandler: () =>
        Object.getOwnPropertyDescriptor(
          ProtectedController.prototype,
          'checkRole',
        )!.value,
      getClass: () => ProtectedController,
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    guard = new AuthGuard(
      {
        getOrThrow: (key: string) =>
          key === 'SUPABASE_URL' ? 'https://example.supabase.co' : 'publishable-key',
      } as ConfigService,
      new Reflector(),
    );
  });

  it.each([undefined, 'Bearer', 'Basic token'])('rejects missing or malformed token %s', async (authorization) => {
    await expect(guard.canActivate(makeContext(authorization))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it.each(['invalid', 'expired'])('rejects %s access tokens', async (token) => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error(token) });

    await expect(
      guard.canActivate(makeContext(`Bearer ${token}`)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('allows a verified user with the required protected role', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'user-1', app_metadata: { role: Role.OpsFte } } },
      error: null,
    });

    await expect(
      guard.canActivate(makeContext('Bearer valid-token')),
    ).resolves.toBe(true);
  });

  it('forbids a verified user without the required protected role', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'user-1', app_metadata: { role: Role.OpsPic } } },
      error: null,
    });

    await expect(
      guard.canActivate(makeContext('Bearer valid-token')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not accept a role from editable user metadata', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'user-1', user_metadata: { role: Role.OpsFte } } },
      error: null,
    });

    await expect(
      guard.canActivate(makeContext('Bearer valid-token')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});