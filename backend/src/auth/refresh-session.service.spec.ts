import { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../database/prisma.service.js';
import {
  getRefreshCookieValue,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  RefreshSessionService,
} from './refresh-session.service.js';

const user = {
  id: 'user-1',
  email: 'user@example.com',
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createService() {
  let session: Record<string, unknown> | null = null;
  const prisma = {
    userSession: {
      create: vi.fn(async ({ data }) => {
        session = { ...data, revokedAt: null, previousRefreshTokenHash: null, previousRefreshTokenExpiresAt: null };
        return session;
      }),
      findUnique: vi.fn(async () => session && { ...session, user }),
      updateMany: vi.fn(async ({ where, data }) => {
        if (!session || session.id !== where.id || session.revokedAt !== where.revokedAt) {
          return { count: 0 };
        }
        if (where.refreshTokenHash && session.refreshTokenHash !== where.refreshTokenHash) {
          return { count: 0 };
        }
        if (where.expiresAt?.gt && (session.expiresAt as Date) <= where.expiresAt.gt) {
          return { count: 0 };
        }
        session = { ...session, ...data };
        return { count: 1 };
      }),
    },
  } as unknown as PrismaService;
  const config = {
    getOrThrow: vi.fn((key: string) => ({
      REFRESH_SESSION_EXPIRES_IN: '30d',
      REFRESH_COOKIE_SECURE: 'false',
    })[key]),
  } as unknown as ConfigService;

  return { service: new RefreshSessionService(prisma, config), getSession: () => session };
}

describe('RefreshSessionService', () => {
  it('creates an opaque credential and stores only its verifier', async () => {
    const { service, getSession } = createService();
    const created = await service.create(user.id);
    const session = getSession();

    expect(created.credential.value).toMatch(/^[0-9a-f-]+\.[A-Za-z0-9_-]{43}$/i);
    expect(session?.refreshTokenHash).not.toContain(created.credential.value);
    expect(session?.refreshTokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('allows only one concurrent rotation of the same current credential', async () => {
    const { service, getSession } = createService();
    const created = await service.create(user.id);

    const [first, second] = await Promise.all([
      service.rotate(created.credential.value, async () => 'access-one'),
      service.rotate(created.credential.value, async () => 'access-two'),
    ]);

    expect([first, second].filter((result) => result.kind === 'rotated')).toHaveLength(1);
    expect(getSession()?.revokedAt).toBeNull();
  });

  it('keeps an immediate previous credential rejected without revocation during grace', async () => {
    const { service, getSession } = createService();
    const created = await service.create(user.id);

    await service.rotate(created.credential.value, async () => 'access-token');
    const staleResult = await service.rotate(
      created.credential.value,
      async () => 'unexpected-access-token',
    );

    expect(staleResult).toEqual({ kind: 'rejected' });
    expect(getSession()?.revokedAt).toBeNull();
  });

  it('revokes a session for delayed reuse of the immediate previous credential', async () => {
    const { service, getSession } = createService();
    const created = await service.create(user.id);

    await service.rotate(created.credential.value, async () => 'access-token');
    const session = getSession() as { previousRefreshTokenExpiresAt: Date };
    session.previousRefreshTokenExpiresAt = new Date(Date.now() - 1);

    await service.rotate(created.credential.value, async () => 'unexpected-access-token');

    expect(getSession()?.revokedAt).toBeInstanceOf(Date);
  });

  it('revokes only the valid credential presented to logout', async () => {
    const { service, getSession } = createService();
    const created = await service.create(user.id);

    await service.revoke(created.credential.value);

    expect(getSession()?.revokedAt).toBeInstanceOf(Date);
    await expect(service.revoke(undefined)).resolves.toBeUndefined();
  });

  it('uses the approved HttpOnly cookie scope', () => {
    const { service } = createService();

    expect(service.getCookieOptions()).toMatchObject({
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: REFRESH_COOKIE_PATH,
    });
    expect(getRefreshCookieValue(`${REFRESH_COOKIE_NAME}=value; other=1`)).toBe('value');
  });
});
