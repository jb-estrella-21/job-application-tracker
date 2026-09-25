import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { ConfigService } from '@nestjs/config';
import { RefreshSessionService } from './refresh-session.service.js';
import { ThrottlerModule } from '@nestjs/throttler';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    register: vi.fn(),
    login: vi.fn(),
  };
  const configService = { getOrThrow: vi.fn(() => 'http://localhost:5173') };
  const refreshSessionService = { getCookieOptions: vi.fn(() => ({})) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{ ttl: 15 * 60 * 1_000, limit: 10 }]),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        { provide: ConfigService, useValue: configService },
        { provide: RefreshSessionService, useValue: refreshSessionService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates login and keeps the refresh credential out of JSON', async () => {
    const credentials = { email: 'user@example.com', password: 'password123' };
    const response = { cookie: vi.fn() };
    authService.login.mockResolvedValue({
      user: { id: 'user-1', email: credentials.email },
      accessToken: 'access-token',
      refreshCredential: 'session.secret',
    });

    const result = await controller.login(credentials, response as never);

    expect(authService.login).toHaveBeenCalledWith(credentials);
    expect(response.cookie).toHaveBeenCalled();
    expect(result).toEqual({
      user: { id: 'user-1', email: credentials.email },
      accessToken: 'access-token',
    });
  });

  it('returns the authenticated public user from /auth/me', () => {
    const user = {
      id: 'user-1',
      email: 'user@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(controller.getMe({ user } as never)).toEqual({ user });
    expect(controller.getMe({ user } as never).user).not.toHaveProperty(
      'passwordHash',
    );
  });
});
