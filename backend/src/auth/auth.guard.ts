import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Request } from 'express';
import { PUBLIC_ROUTE } from './public.decorator.js';
import { REQUIRED_ROLES, Role } from './role.decorator.js';

export type AuthenticatedRequest = Request & { user?: User };

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly supabase: SupabaseClient;

  constructor(
    configuration: ConfigService,
    private readonly reflector: Reflector,
  ) {
    this.supabase = createClient(
      configuration.getOrThrow<string>('SUPABASE_URL'),
      configuration.getOrThrow<string>('SUPABASE_PUBLISHABLE_KEY'),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      PUBLIC_ROUTE,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) return true;

    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    const match = request.headers.authorization?.match(
      /^Bearer ([^\s]+)$/i,
    );

    if (!match) {
      throw new UnauthorizedException('Login required');
    }

    let user: User | null;
    try {
      const { data, error } = await this.supabase.auth.getUser(match[1]);
      user = error ? null : data.user;
    } catch {
      throw new UnauthorizedException('Unable to verify login');
    }

    if (!user) {
      throw new UnauthorizedException('Invalid or expired login');
    }

    request.user = user;

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      REQUIRED_ROLES,
      [context.getHandler(), context.getClass()],
    );
    if (
      requiredRoles?.length &&
      !requiredRoles.includes(user.app_metadata?.role as Role)
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
