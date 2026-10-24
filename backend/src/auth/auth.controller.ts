import {
  Controller,
  Get,
  Header,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedRequest } from './auth.guard.js';

@Controller('auth')
export class AuthController {
  @Get('me')
  @Header('Cache-Control', 'no-store')
  me(@Req() request: AuthenticatedRequest) {
    if (!request.user) {
      throw new UnauthorizedException('Login required');
    }

    return {
      id: request.user.id,
      email: request.user.email,
      role: request.user.app_metadata?.role ?? null,
    };
  }
}
