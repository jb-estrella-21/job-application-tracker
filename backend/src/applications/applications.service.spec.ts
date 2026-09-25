import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../database/prisma.service.js';
import { ApplicationsService } from './applications.service.js';

function createServiceWithStatus(status: string) {
  const findFirst = vi.fn().mockResolvedValue({
    id: 'application-1',
    userId: 'user-1',
    status,
    salaryMin: null,
    salaryMax: null,
  });
  const transaction = vi.fn();
  const prisma = {
    jobApplication: { findFirst },
    $transaction: transaction,
  } as unknown as PrismaService;

  return { service: new ApplicationsService(prisma), transaction };
}

describe('ApplicationsService status transitions', () => {
  it('rejects changes from a terminal status', async () => {
    const { service, transaction } = createServiceWithStatus('REJECTED');

    await expect(
      service.update('user-1', 'application-1', { status: 'APPLIED' }),
    ).rejects.toThrow('terminal status');
    expect(transaction).not.toHaveBeenCalled();
  });

  it('only allows hired to be reached from an offer', async () => {
    const { service, transaction } = createServiceWithStatus('INTERVIEW');

    await expect(
      service.update('user-1', 'application-1', { status: 'HIRED' }),
    ).rejects.toThrow('only be marked as hired from an offer');
    expect(transaction).not.toHaveBeenCalled();
  });

  it('ends active hired employment without changing the application status', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const findFirst = vi.fn().mockResolvedValue({
      id: 'application-1', userId: 'user-1', status: 'HIRED',
      employmentStatus: 'LEFT', employmentEndedAt: new Date(),
    });
    const prisma = { jobApplication: { updateMany, findFirst } } as unknown as PrismaService;
    const service = new ApplicationsService(prisma);

    const result = await service.updateEmploymentStatus('user-1', 'application-1', {
      employmentStatus: 'LEFT',
    });

    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: 'user-1', status: 'HIRED', employmentStatus: 'ACTIVE' }),
      data: expect.objectContaining({ employmentStatus: 'LEFT', employmentEndedAt: expect.any(Date) }),
    }));
    expect(result.application.status).toBe('HIRED');
  });

  it('does not disclose another user application when employment update affects no rows', async () => {
    const prisma = {
      jobApplication: { updateMany: vi.fn().mockResolvedValue({ count: 0 }), findFirst: vi.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;
    const service = new ApplicationsService(prisma);
    await expect(service.updateEmploymentStatus('user-1', 'other-user-application', { employmentStatus: 'TERMINATED' })).rejects.toThrow('Application not found');
  });
});
