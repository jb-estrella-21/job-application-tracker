import type { ConfigService } from '@nestjs/config';
import type { SignOptions } from 'jsonwebtoken';

const JWT_ALGORITHM = 'HS256' as const;
const DURATION_PATTERN = /^[1-9]\d*(s|m|h|d)$/;
type JwtDuration = NonNullable<SignOptions['expiresIn']>;

export type JwtPolicy = {
  secret: string;
  algorithm: typeof JWT_ALGORITHM;
  issuer: string;
  audience: string;
  accessTokenExpiresIn: JwtDuration;
};

export type RefreshSessionPolicy = {
  expiresIn: string;
  expiresInMs: number;
  cookieSecure: boolean;
};

export type Environment = Record<string, unknown>;
const SUPPORTED_NODE_ENVIRONMENTS = new Set([
  'development',
  'test',
  'production',
]);

function requireString(environment: Environment, key: string) {
  const value = environment[key];

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value.trim();
}

export function parseCorsOrigins(value: string) {
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    throw new Error('CORS_ORIGINS must contain at least one origin');
  }

  return origins.map((origin) => {
    let parsedOrigin: URL;

    try {
      parsedOrigin = new URL(origin);
    } catch {
      throw new Error('CORS_ORIGINS must contain valid HTTP(S) origins');
    }

    if (
      !['http:', 'https:'].includes(parsedOrigin.protocol) ||
      parsedOrigin.pathname !== '/' ||
      parsedOrigin.search ||
      parsedOrigin.hash
    ) {
      throw new Error('CORS_ORIGINS must contain valid HTTP(S) origins');
    }

    return parsedOrigin.origin;
  });
}

export function validateEnvironment(environment: Environment) {
  const validatedEnvironment = { ...environment };
  const nodeEnvironment =
    typeof validatedEnvironment.NODE_ENV === 'string'
      && validatedEnvironment.NODE_ENV.trim() !== ''
      ? validatedEnvironment.NODE_ENV.trim()
      : 'development';

  if (!SUPPORTED_NODE_ENVIRONMENTS.has(nodeEnvironment)) {
    throw new Error('NODE_ENV must be development, test, or production');
  }

  validatedEnvironment.NODE_ENV = nodeEnvironment;

  requireString(validatedEnvironment, 'DATABASE_URL');
  const jwtSecret = requireString(validatedEnvironment, 'JWT_SECRET');
  requireString(validatedEnvironment, 'JWT_ISSUER');
  requireString(validatedEnvironment, 'JWT_AUDIENCE');
  const accessTokenExpiresIn = requireString(
    validatedEnvironment,
    'JWT_ACCESS_TOKEN_EXPIRES_IN',
  );
  const corsOrigins = requireString(validatedEnvironment, 'CORS_ORIGINS');
  const refreshSessionExpiresIn = requireString(
    validatedEnvironment,
    'REFRESH_SESSION_EXPIRES_IN',
  );
  const refreshCookieSecure = requireString(
    validatedEnvironment,
    'REFRESH_COOKIE_SECURE',
  );

  if (Buffer.byteLength(jwtSecret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must be at least 32 bytes long');
  }

  if (!DURATION_PATTERN.test(accessTokenExpiresIn)) {
    throw new Error(
      'JWT_ACCESS_TOKEN_EXPIRES_IN must be a positive duration such as 15m, 1h, or 7d',
    );
  }

  if (!DURATION_PATTERN.test(refreshSessionExpiresIn)) {
    throw new Error(
      'REFRESH_SESSION_EXPIRES_IN must be a positive duration such as 30d',
    );
  }

  if (!['true', 'false'].includes(refreshCookieSecure)) {
    throw new Error('REFRESH_COOKIE_SECURE must be true or false');
  }

  if (validatedEnvironment.NODE_ENV === 'production' && refreshCookieSecure !== 'true') {
    throw new Error('REFRESH_COOKIE_SECURE must be true in production');
  }

  const parsedCorsOrigins = parseCorsOrigins(corsOrigins);

  if (
    nodeEnvironment === 'production'
    && parsedCorsOrigins.some((origin) => new URL(origin).protocol !== 'https:')
  ) {
    throw new Error('CORS_ORIGINS must use HTTPS origins in production');
  }

  return validatedEnvironment;
}

export function parseDurationMilliseconds(value: string) {
  const match = DURATION_PATTERN.exec(value);

  if (!match) {
    throw new Error(`Invalid duration: ${value}`);
  }

  const amount = Number(match[0].slice(0, -1));
  const unit = match[1];
  const multiplier: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return amount * multiplier[unit];
}

export function getJwtPolicy(configService: ConfigService): JwtPolicy {
  return {
    secret: configService.getOrThrow<string>('JWT_SECRET'),
    algorithm: JWT_ALGORITHM,
    issuer: configService.getOrThrow<string>('JWT_ISSUER'),
    audience: configService.getOrThrow<string>('JWT_AUDIENCE'),
    accessTokenExpiresIn: configService.getOrThrow<string>(
      'JWT_ACCESS_TOKEN_EXPIRES_IN',
    ) as JwtDuration,
  };
}

export function getRefreshSessionPolicy(
  configService: ConfigService,
): RefreshSessionPolicy {
  const expiresIn = configService.getOrThrow<string>(
    'REFRESH_SESSION_EXPIRES_IN',
  );

  return {
    expiresIn,
    expiresInMs: parseDurationMilliseconds(expiresIn),
    cookieSecure:
      configService.getOrThrow<string>('REFRESH_COOKIE_SECURE') === 'true',
  };
}
