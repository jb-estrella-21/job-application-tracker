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
});
