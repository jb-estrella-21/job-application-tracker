import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  createdAt: true,
  updatedAt: true,
} as const;

const AUTHENTICATION_USER_SELECT = {
  id: true,
  email: true,
  passwordHash: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
        where: { id },
        select: PUBLIC_USER_SELECT,
    });
    }
  
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: PUBLIC_USER_SELECT,
    });
  }

  async findForAuthenticationByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: AUTHENTICATION_USER_SELECT,
    });
  }

  async create(email: string, passwordHash: string) {
    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
      },
      select: PUBLIC_USER_SELECT,
    });
  }
}
