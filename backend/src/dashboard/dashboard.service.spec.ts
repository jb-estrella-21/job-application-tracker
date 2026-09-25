import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../database/prisma.service.js';
import { DashboardService } from './dashboard.service.js';

describe('DashboardService', () => {
  it('returns current-state counts for only the requested user', async () => {
    const statusGroups = [
      { status: 'APPLIED' as const, _count: { status: 2 } },
      { status: 'INTERVIEW' as const, _count: { status: 1 } },
      { status: 'OFFER' as const, _count: { status: 1 } },
      { status: 'REJECTED' as const, _count: { status: 3 } },
    ];
    const recentApplications = [
      {
        id: 'application-1',
        companyName: 'Acme',
        positionTitle: 'Engineer',
        status: 'OFFER' as const,
        applicationDate: null,
        updatedAt: new Date('2026-09-25T00:00:00.000Z'),
      },
    ];
    const groupBy = vi.fn().mockReturnValue(statusGroups);
    const findMany = vi.fn().mockReturnValue(recentApplications);
    const transaction = vi.fn().mockResolvedValue([
      statusGroups,
      recentApplications,
    ]);
    const prisma = {
      jobApplication: { groupBy, findMany },
      $transaction: transaction,
    } as unknown as PrismaService;
    const service = new DashboardService(prisma);

    const summary = await service.getSummary('user-1');

    expect(summary).toMatchObject({
      totalApplications: 7,
      activeApplications: 4,
      interviews: 1,
      offers: 1,
      byStatus: {
        INTERESTED: 0,
        APPLIED: 2,
        ASSESSMENT: 0,
        INTERVIEW: 1,
        OFFER: 1,
        HIRED: 0,
        REJECTED: 3,
        WITHDRAWN: 0,
      },
    });
    expect(summary.recentApplications).toEqual(recentApplications);
    expect(groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    );
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
    );
  });
});
