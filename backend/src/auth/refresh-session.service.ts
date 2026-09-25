import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../database/prisma.service.js';
import { getRefreshSessionPolicy } from '../config/auth.config.js';

export const REFRESH_COOKIE_NAME = 'job_tracker_refresh';
export const REFRESH_COOKIE_PATH = '/api/auth';
const REFRESH_SECRET_BYTES = 32;
const ROTATION_RACE_GRACE_MS = 5_000;

type RefreshCredential = {
  sessionId: string;
  secret: Buffer;
  value: string;
};

type PublicUser = {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

type RotationResult =
  | { kind: 'rotated'; credential: RefreshCredential; user: PublicUser; expiresAt: Date }
  | { kind: 'rejected' };

function hashRefreshSecret(secret: Buffer) {
  return createHash('sha256').update(secret).digest('hex');
}

function equalVerifier(left: string, right: string) {
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function parseCredential(value: string | undefined): RefreshCredential | null {
  if (!value) {
    return null;
  }

  const [sessionId, encodedSecret, ...rest] = value.split('.');

  if (
    rest.length > 0 ||
    !sessionId ||
    !encodedSecret ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId) ||
    !/^[A-Za-z0-9_-]{43}$/.test(encodedSecret)
  ) {
    return null;
  }

  try {
    const secret = Buffer.from(encodedSecret, 'base64url');

    if (
      secret.length !== REFRESH_SECRET_BYTES ||
      secret.toString('base64url') !== encodedSecret
    ) {
      return null;
    }

    return { sessionId, secret, value };
  } catch {
    return null;
  }
}

export function getRefreshCookieValue(cookieHeader: string | undefined) {
  if (!cookieHeader) {
    return undefined;
  }

  return cookieHeader
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${REFRESH_COOKIE_NAME}=`))
    ?.slice(REFRESH_COOKIE_NAME.length + 1);
}

@Injectable()
export class RefreshSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  createCredential(sessionId: string = randomUUID()): RefreshCredential {
    const secret = randomBytes(REFRESH_SECRET_BYTES);

    return {
      sessionId,
      secret,
      value: `${sessionId}.${secret.toString('base64url')}`,
    };
  }

  getCookieOptions() {
    const policy = getRefreshSessionPolicy(this.configService);

    return {
      httpOnly: true,
      secure: policy.cookieSecure,
      sameSite: 'lax' as const,
      path: REFRESH_COOKIE_PATH,
      maxAge: policy.expiresInMs,
    };
  }

  async create(userId: string) {
    const policy = getRefreshSessionPolicy(this.configService);
    const credential = this.createCredential();
    const expiresAt = new Date(Date.now() + policy.expiresInMs);

    await this.prisma.userSession.create({
      data: {
        id: credential.sessionId,
        userId,
        refreshTokenHash: hashRefreshSecret(credential.secret),
        expiresAt,
      },
    });

    return { credential, expiresAt };
  }

  async rotate(
    rawCredential: string | undefined,
    createAccessToken: (user: PublicUser) => Promise<string>,
  ): Promise<RotationResult & { accessToken?: string }> {
    const credential = parseCredential(rawCredential);

    if (!credential) {
      return { kind: 'rejected' };
    }

    const now = new Date();
    const session = await this.prisma.userSession.findUnique({
      where: { id: credential.sessionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!session || session.revokedAt || session.expiresAt <= now) {
      return { kind: 'rejected' };
    }

    const presentedHash = hashRefreshSecret(credential.secret);

    if (!equalVerifier(session.refreshTokenHash, presentedHash)) {
      return this.handleStaleCredential(session, presentedHash, now);
    }

    const replacement = this.createCredential(session.id);
    const accessToken = await createAccessToken(session.user);
    const previousExpiresAt = new Date(now.getTime() + ROTATION_RACE_GRACE_MS);
    const update = await this.prisma.userSession.updateMany({
      where: {
        id: session.id,
        refreshTokenHash: session.refreshTokenHash,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        refreshTokenHash: hashRefreshSecret(replacement.secret),
        previousRefreshTokenHash: session.refreshTokenHash,
        previousRefreshTokenExpiresAt: previousExpiresAt,
      },
    });

    if (update.count !== 1) {
      const latestSession = await this.prisma.userSession.findUnique({
        where: { id: session.id },
      });

      return this.handleStaleCredential(latestSession, presentedHash, new Date());
    }

    return {
      kind: 'rotated',
      credential: replacement,
      user: session.user,
      expiresAt: session.expiresAt,
      accessToken,
    };
  }

  async revoke(rawCredential: string | undefined) {
    const credential = parseCredential(rawCredential);

    if (!credential) {
      return;
    }

    const session = await this.prisma.userSession.findUnique({
      where: { id: credential.sessionId },
    });

    if (!session || session.revokedAt) {
      return;
    }

    if (equalVerifier(session.refreshTokenHash, hashRefreshSecret(credential.secret))) {
      await this.prisma.userSession.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  private async handleStaleCredential(
    session: {
      id: string;
      refreshTokenHash: string;
      previousRefreshTokenHash: string | null;
      previousRefreshTokenExpiresAt: Date | null;
      revokedAt: Date | null;
    } | null,
    presentedHash: string,
    now: Date,
  ): Promise<RotationResult> {
    if (
      !session ||
      session.revokedAt ||
      !session.previousRefreshTokenHash ||
      !equalVerifier(session.previousRefreshTokenHash, presentedHash)
    ) {
      return { kind: 'rejected' };
    }

    if (
      session.previousRefreshTokenExpiresAt &&
      session.previousRefreshTokenExpiresAt > now
    ) {
      return { kind: 'rejected' };
    }

    await this.prisma.userSession.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: now },
    });

    return { kind: 'rejected' };
  }
}
