import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { describe, expect, afterEach, beforeEach, it, vi } from 'vitest';
import { configureHttpSecurity } from '../http-security.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { RefreshSessionService } from './refresh-session.service.js';

describe('auth security controls', () => {
  let app: INestApplication;
  const authService = {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
  };
  const configService = {
    getOrThrow: vi.fn(() => 'http://localhost:5173'),
  };
  const refreshSessionService = {
    getCookieOptions: vi.fn(() => ({ httpOnly: true })),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    authService.login.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
      accessToken: 'access-token',
      refreshCredential: 'session.secret',
    });
    authService.register.mockResolvedValue({ user: { id: 'user-1' } });
    authService.refresh.mockResolvedValue({
      accessToken: 'access-token',
      refreshCredential: 'session.secret',
    });

    const module = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{ ttl: 15 * 60 * 1_000, limit: 10 }]),
      ],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ConfigService, useValue: configService },
        { provide: RefreshSessionService, useValue: refreshSessionService },
      ],
    }).compile();

    app = module.createNestApplication({ bodyParser: false });
    app.useLogger(false);
    app.setGlobalPrefix('api');
    configureHttpSecurity(app);
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    app.enableCors({
      origin: ['http://localhost:5173'],
      credentials: true,
    });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('sets API-safe headers and no-store on authentication responses', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'password123' })
      .expect(201);

    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['referrer-policy']).toBe('no-referrer');
    expect(response.headers['strict-transport-security']).toBeUndefined();
    expect(response.headers['content-security-policy']).toBeUndefined();
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('rejects invalid login input before it reaches the authentication service', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'password123',
        unexpected: 'rejected',
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'short' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'x'.repeat(129) })
      .expect(400);

    expect(authService.login).not.toHaveBeenCalled();
  });

  it('allows configured CORS origins without granting disallowed origins', async () => {
    const allowed = await request(app.getHttpServer())
      .options('/api/auth/login')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
      .expect(204);

    expect(allowed.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    );
    expect(allowed.headers['access-control-allow-credentials']).toBe('true');

    const disallowed = await request(app.getHttpServer())
      .options('/api/auth/login')
      .set('Origin', 'https://untrusted.example')
      .set('Access-Control-Request-Method', 'POST')
      .expect(204);

    expect(disallowed.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('preserves strict refresh and logout Origin validation', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Origin', 'https://untrusted.example')
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Origin', 'https://untrusted.example')
      .expect(401);

    expect(authService.refresh).not.toHaveBeenCalled();
    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('limits login attempts by client IP while invoking the same handler', async () => {
    for (let index = 0; index < 10; index += 1) {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: `unknown-${index}@example.com`, password: 'password123' })
        .expect(201);
    }

    const throttled = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'known@example.com', password: 'password123' })
      .expect(429);

    expect(throttled.body.message).toBe('ThrottlerException: Too Many Requests');
    expect(authService.login).toHaveBeenCalledTimes(10);
  });

  it('applies the independent registration and refresh limits without throttling logout', async () => {
    for (let index = 0; index < 5; index += 1) {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: `user-${index}@example.com`, password: 'password123' })
        .expect(201);
    }

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'user-6@example.com', password: 'password123' })
      .expect(429);

    for (let index = 0; index < 60; index += 1) {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Origin', 'http://localhost:5173')
        .expect(201);
    }

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Origin', 'http://localhost:5173')
      .expect(429);

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Origin', 'http://localhost:5173')
      .expect(204);

    expect(authService.logout).toHaveBeenCalledTimes(1);
  });

  it('rejects JSON bodies larger than the explicit 100 KB limit', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ payload: 'x'.repeat(101 * 1_024) })
      .expect(413);
  });
});
