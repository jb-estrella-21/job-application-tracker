import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import {
  DUMMY_PASSWORD_HASH,
  PASSWORD_HASH_OPTIONS,
} from './password.policy.js';
import { RefreshSessionService } from './refresh-session.service.js';

vi.mock('argon2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('argon2')>();

  return {
    ...actual,
    hash: vi.fn(actual.hash),
    verify: vi.fn(actual.verify),
  };
});

const publicUser = {
  id: 'user-1',
  email: 'test@example.com',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('AuthService', () => {
  let service: AuthService;
  const usersService = {
    findByEmail: vi.fn(),
    findForAuthenticationByEmail: vi.fn(),
    create: vi.fn(),
  };
  const jwtService = {
    signAsync: vi.fn(),
  };
  const refreshSessionService = {
    create: vi.fn(),
    rotate: vi.fn(),
    revoke: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: RefreshSessionService, useValue: refreshSessionService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('registers a normalized email with an Argon2id password hash', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockImplementation(async (email) => ({
      ...publicUser,
      email,
    }));

    const response = await service.register({
      email: ' Test@Example.com ',
      password: 'password123',
    });

    expect(usersService.create).toHaveBeenCalledWith(
      'test@example.com',
      expect.not.stringContaining('password123'),
    );
    const passwordHash = usersService.create.mock.calls[0][1] as string;
    expect(passwordHash).toMatch(/^\$argon2id\$/);
    expect(await argon2.verify(passwordHash, 'password123')).toBe(true);
    expect(response.user).not.toHaveProperty('passwordHash');
  });

  it('allows a newly registered user to log in with the original password', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue(publicUser);
    const registration = await service.register({
      email: publicUser.email,
      password: 'password123',
    });
    const passwordHash = usersService.create.mock.calls[0][1] as string;
    usersService.findForAuthenticationByEmail.mockResolvedValue({
      ...publicUser,
      passwordHash,
    });
    jwtService.signAsync.mockResolvedValue('access-token');
    refreshSessionService.create.mockResolvedValue({
      credential: { value: 'session.secret' },
    });

    const login = await service.login({
      email: publicUser.email,
      password: 'password123',
    });

    expect(registration.user).not.toHaveProperty('passwordHash');
    expect(login).toEqual({
      user: publicUser,
      accessToken: 'access-token',
      refreshCredential: 'session.secret',
    });
    expect(login.user).not.toHaveProperty('passwordHash');
  });

  it('continues to verify an existing Argon2 hash with different parameters', async () => {
    const legacyHash = await argon2.hash('password123', {
      type: argon2.argon2id,
      memoryCost: 8 * 1024,
      timeCost: 1,
      parallelism: 1,
    });
    usersService.findForAuthenticationByEmail.mockResolvedValue({
      ...publicUser,
      passwordHash: legacyHash,
    });
    jwtService.signAsync.mockResolvedValue('access-token');
    refreshSessionService.create.mockResolvedValue({
      credential: { value: 'session.secret' },
    });

    await expect(
      service.login({ email: publicUser.email, password: 'password123' }),
    ).resolves.toEqual({
      user: publicUser,
      accessToken: 'access-token',
      refreshCredential: 'session.secret',
    });
  });

  it('rejects a duplicate normalized email before creating a user', async () => {
    usersService.findByEmail.mockResolvedValue(publicUser);

    await expect(
      service.register({
        email: 'TEST@example.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('maps an email unique-constraint race to the duplicate response', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['email'] },
      }),
    );

    await expect(
      service.register({ email: publicUser.email, password: 'password123' }),
    ).rejects.toMatchObject({
      status: 409,
      message: 'Email is already registered',
    });
  });

  it('returns the same generic failure for unknown email and wrong password', async () => {
    usersService.findForAuthenticationByEmail.mockResolvedValueOnce(null);

    const unknownEmailError = await service
      .login({ email: 'missing@example.com', password: 'password123' })
      .catch((error: unknown) => error);

    const passwordHash = await argon2.hash(
      'different-password',
      PASSWORD_HASH_OPTIONS,
    );
    usersService.findForAuthenticationByEmail.mockResolvedValueOnce({
      ...publicUser,
      passwordHash,
    });

    const wrongPasswordError = await service
      .login({ email: publicUser.email, password: 'password123' })
      .catch((error: unknown) => error);

    expect(unknownEmailError).toBeInstanceOf(UnauthorizedException);
    expect(wrongPasswordError).toBeInstanceOf(UnauthorizedException);
    expect((unknownEmailError as UnauthorizedException).getStatus()).toBe(
      (wrongPasswordError as UnauthorizedException).getStatus(),
    );
    expect((unknownEmailError as UnauthorizedException).message).toBe(
      (wrongPasswordError as UnauthorizedException).message,
    );
  });

  it('verifies the dummy digest instead of hashing for an unknown email', async () => {
    usersService.findForAuthenticationByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@example.com', password: 'password123' }),
    ).rejects.toMatchObject({
      status: 401,
      message: 'Invalid email or password',
    });

    expect(argon2.verify).toHaveBeenCalledWith(
      DUMMY_PASSWORD_HASH,
      'password123',
    );
    expect(argon2.hash).not.toHaveBeenCalled();
  });

  it('uses a valid Argon2id dummy digest', async () => {
    expect(DUMMY_PASSWORD_HASH).toMatch(/^\$argon2id\$/);
    await expect(
      argon2.verify(DUMMY_PASSWORD_HASH, 'not-the-dummy-input'),
    ).resolves.toBe(false);
  });
});
