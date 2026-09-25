import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import {
  DUMMY_PASSWORD_HASH,
  PASSWORD_HASH_OPTIONS,
} from './password.policy.js';
import { RefreshSessionService } from './refresh-session.service.js';

function isEmailUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002' &&
    Array.isArray(error.meta?.target) &&
    error.meta.target.includes('email')
  );
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshSessionService: RefreshSessionService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await argon2.hash(
      dto.password,
      PASSWORD_HASH_OPTIONS,
    );

    let user;

    try {
      user = await this.usersService.create(email, passwordHash);
    } catch (error) {
      if (isEmailUniqueConstraintError(error)) {
        throw new ConflictException('Email is already registered');
      }

      throw error;
    }

    return {
      user,
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.usersService.findForAuthenticationByEmail(email);

    if (!user) {
      // Run the same Argon2 verification operation without persisting a value
      // or generating a fresh digest for a non-existent user.
      await argon2.verify(DUMMY_PASSWORD_HASH, dto.password);
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await argon2.verify(
      user.passwordHash,
      dto.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const session = await this.refreshSessionService.create(user.id);
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
      refreshCredential: session.credential.value,
    };
  }

  async refresh(rawCredential: string | undefined) {
    const result = await this.refreshSessionService.rotate(
      rawCredential,
      async (user) => this.jwtService.signAsync({ sub: user.id, email: user.email }),
    );

    if (result.kind !== 'rotated' || !result.accessToken) {
      throw new UnauthorizedException('Invalid refresh session');
    }

    return {
      accessToken: result.accessToken,
      refreshCredential: result.credential.value,
    };
  }

  async logout(rawCredential: string | undefined) {
    await this.refreshSessionService.revoke(rawCredential);
  }
}
