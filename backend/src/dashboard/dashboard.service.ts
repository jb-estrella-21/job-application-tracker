import { Injectable } from '@nestjs/common';
import type { ApplicationStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string) {
    const [statusGroups, recentApplications] =
      await this.prisma.$transaction([
        this.prisma.jobApplication.groupBy({
          by: ['status'],
          where: {
            userId,
          },
          _count: {
            status: true,
          },
        }),

        this.prisma.jobApplication.findMany({
          where: {
            userId,
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 5,
          select: {
            id: true,
            companyName: true,
            positionTitle: true,
            status: true,
            applicationDate: true,
            updatedAt: true,
          },
        }),
      ]);

    const byStatus: Record<ApplicationStatus, number> = {
      INTERESTED: 0,
      APPLIED: 0,
      ASSESSMENT: 0,
      INTERVIEW: 0,
      OFFER: 0,
      HIRED: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
    };

    let totalApplications = 0;
    let activeApplications = 0;
    let interviews = 0;
    let offers = 0;

    for (const group of statusGroups) {
      const count = group._count.status;

      byStatus[group.status] = count;
      totalApplications += count;

      // Terminal applications are no longer active in the pipeline.
      if (
        group.status !== 'REJECTED' &&
        group.status !== 'WITHDRAWN' &&
        group.status !== 'HIRED'
      ) {
        activeApplications += count;
      }

      if (group.status === 'INTERVIEW') {
        interviews = count;
      }

      if (group.status === 'OFFER') {
        offers = count;
      }
    }

    return {
      totalApplications,
      activeApplications,
      interviews,
      offers,
      byStatus,
      recentApplications,
    };
  }
}
