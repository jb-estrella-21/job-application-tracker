import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { describe, expect, it, vi } from 'vitest';
import {
  getJwtPolicy,
  parseCorsOrigins,
  validateEnvironment,
} from './auth.config.js';

const validEnvironment = {
  DATABASE_URL: 'postgresql://user:password@localhost:5432/job_tracker',
  JWT_SECRET: 'test-secret-that-is-never-used-outside-this-test',
  JWT_ISSUER: 'job-app-tracker-api',
  JWT_AUDIENCE: 'job-app-tracker-web',
  JWT_ACCESS_TOKEN_EXPIRES_IN: '15m',
  CORS_ORIGINS: 'http://localhost:5173',
  REFRESH_SESSION_EXPIRES_IN: '30d',
  REFRESH_COOKIE_SECURE: 'false',
};

function createConfigService(environment = validEnvironment) {
  return {
    getOrThrow: vi.fn((key: keyof typeof validEnvironment) => {
      const value = environment[key];

      if (!value) {
        throw new Error(`Missing configuration value: ${key}`);
      }

      return value;
    }),
  } as unknown as ConfigService;
}

describe('authentication configuration', () => {
  it('fails closed when a required value is missing', () => {
    const environment = { ...validEnvironment, JWT_SECRET: '' };

    expect(() => validateEnvironment(environment)).toThrow(
      'Missing required environment variable: JWT_SECRET',
    );
  });

  it('rejects a JWT secret shorter than 32 bytes', () => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, JWT_SECRET: 'too-short' }),
    ).toThrow('JWT_SECRET must be at least 32 bytes long');
  });

  it('rejects invalid token lifetimes and CORS origins', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        JWT_ACCESS_TOKEN_EXPIRES_IN: 'forever',
      }),
    ).toThrow('JWT_ACCESS_TOKEN_EXPIRES_IN');

    expect(() => parseCorsOrigins('not-an-origin')).toThrow(
      'CORS_ORIGINS',
    );
  });

  it('validates supported NODE_ENV values and production CORS origins', () => {
    expect(() => validateEnvironment({
      ...validEnvironment,
      NODE_ENV: 'test',
    })).not.toThrow();

    expect(() => validateEnvironment({
      ...validEnvironment,
      NODE_ENV: 'preview',
    })).toThrow('NODE_ENV');

    expect(() => validateEnvironment({
      ...validEnvironment,
      NODE_ENV: 'production',
      CORS_ORIGINS: 'http://localhost:5173',
      REFRESH_COOKIE_SECURE: 'true',
    })).toThrow('CORS_ORIGINS must use HTTPS origins in production');

    expect(() => validateEnvironment({
      ...validEnvironment,
      NODE_ENV: 'production',
      CORS_ORIGINS: 'https://app.example.test',
      REFRESH_COOKIE_SECURE: 'true',
    })).not.toThrow();
  });

  it('builds a compatible signing and verification policy', async () => {
    const policy = getJwtPolicy(createConfigService());
    const jwtService = new JwtService({
      secret: policy.secret,
      signOptions: {
        algorithm: policy.algorithm,
        issuer: policy.issuer,
        audience: policy.audience,
        expiresIn: policy.accessTokenExpiresIn,
      },
    });
    const verificationOptions = {
      secret: policy.secret,
      algorithms: [policy.algorithm],
      issuer: policy.issuer,
      audience: policy.audience,
    };

    const token = await jwtService.signAsync({ sub: 'user-1' });

    await expect(
      jwtService.verifyAsync(token, verificationOptions),
    ).resolves.toMatchObject({ sub: 'user-1' });

    await expect(
      jwtService.verifyAsync('not-a-jwt', verificationOptions),
    ).rejects.toThrow();

    const expiredToken = await jwtService.signAsync(
      { sub: 'user-1' },
      { expiresIn: '1s' },
    );
    await expect(
      jwtService.verifyAsync(expiredToken, {
        ...verificationOptions,
        clockTimestamp: Math.floor(Date.now() / 1000) + 2,
      }),
    ).rejects.toThrow();

    const wrongIssuerToken = await jwtService.signAsync(
      { sub: 'user-1' },
      { issuer: 'other-api' },
    );
    await expect(
      jwtService.verifyAsync(wrongIssuerToken, verificationOptions),
    ).rejects.toThrow();

    const wrongAudienceToken = await jwtService.signAsync(
      { sub: 'user-1' },
      { audience: 'other-web' },
    );
    await expect(
      jwtService.verifyAsync(wrongAudienceToken, verificationOptions),
    ).rejects.toThrow();
  });
});
