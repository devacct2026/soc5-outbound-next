import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  FRONTEND_ORIGIN: z.string().url().transform((value) => {
    const url = new URL(value);

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('FRONTEND_ORIGIN must use HTTP or HTTPS');
    }

    return url.origin;
  }),
  SEATALK_APPROVAL_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  SEATALK_APP_ID: z.string().optional(),
  SEATALK_APP_SECRET: z.string().optional(),
  SEATALK_CALLBACK_SIGNING_SECRET: z.string().optional(),
  SEATALK_APPROVAL_TOKEN_SECRET: z.string().optional(),
  SEATALK_APPROVE_CALLBACK_URL: z.string().url().optional(),
  SEATALK_REJECT_CALLBACK_URL: z.string().url().optional(),
  SEATALK_APPROVAL_BASE_URL: z
    .string()
    .url()
    .default('https://openapi.seatalk.io'),
  SEATALK_APPROVAL_CREATE_PATH: z
    .string()
    .default('/approval_center/v2/create'),
  SEATALK_APPROVAL_DETAIL_PATH: z
    .string()
    .default('/approval_center/v2/get'),
}).passthrough();

export function validateEnvironment(
  configuration: Record<string, unknown>,
) {
  const validated = environmentSchema.parse(configuration);

  if (validated.SEATALK_APPROVAL_ENABLED) {
    const required = [
      'SEATALK_APP_ID',
      'SEATALK_APP_SECRET',
      'SEATALK_CALLBACK_SIGNING_SECRET',
      'SEATALK_APPROVAL_TOKEN_SECRET',
      'SEATALK_APPROVE_CALLBACK_URL',
      'SEATALK_REJECT_CALLBACK_URL',
    ] as const;
    const missing = required.filter((key) => !validated[key]?.trim());

    if (missing.length) {
      throw new Error(
        `SeaTalk Approval Center is enabled but required configuration is missing: ${missing.join(', ')}`,
      );
    }
  }

  return validated;
}
