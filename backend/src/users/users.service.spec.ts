import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { UsersService } from './users.service.js';
import { PrismaService } from '../database/prisma.service.js';

describe('UsersService', () => {
  let service: UsersService;
  const prismaService = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('keeps passwordHash out of normal email lookups', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);

    await service.findByEmail('user@example.com');

    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  it('selects passwordHash only for authentication lookups', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);

    await service.findForAuthenticationByEmail('user@example.com');

    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });
});
