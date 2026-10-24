import { describe, expect, it } from 'vitest';
import { validateEnvironment } from './environment.js';

const baseEnvironment = {
  FRONTEND_ORIGIN: 'http://localhost:3000',
};

describe('validateEnvironment SeaTalk gate', () => {
  it('defaults Approval Center to disabled with documented create/get paths', () => {
    const environment = validateEnvironment(baseEnvironment);

    expect(environment.SEATALK_APPROVAL_ENABLED).toBe(false);
    expect(environment.SEATALK_APPROVAL_CREATE_PATH).toBe('/approval_center/v2/create');
    expect(environment.SEATALK_APPROVAL_DETAIL_PATH).toBe('/approval_center/v2/get');
  });

  it('fails closed when enabled credentials or callback URLs are missing', () => {
    expect(() => validateEnvironment({
      ...baseEnvironment,
      SEATALK_APPROVAL_ENABLED: 'true',
    })).toThrow(/SEATALK_APP_ID/);
  });

  it('accepts complete server-only configuration without exposing secret values', () => {
    const environment = validateEnvironment({
      ...baseEnvironment,
      SEATALK_APPROVAL_ENABLED: 'true',
      SEATALK_APP_ID: 'test-app-id',
      SEATALK_APP_SECRET: 'server-secret-value',
      SEATALK_CALLBACK_SIGNING_SECRET: 'callback-secret-value',
      SEATALK_APPROVAL_TOKEN_SECRET: 'approval-token-secret',
      SEATALK_APPROVE_CALLBACK_URL: 'https://dev.example.test/approve',
      SEATALK_REJECT_CALLBACK_URL: 'https://dev.example.test/reject',
    });

    expect(environment.SEATALK_APPROVAL_ENABLED).toBe(true);
    expect(environment).not.toHaveProperty('NEXT_PUBLIC_SEATALK_APP_SECRET');
  });
});