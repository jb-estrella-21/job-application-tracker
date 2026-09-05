import { Injectable } from '@nestjs/common';
import type { ApplicationStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string) {
    const [totalApplications, statusGroups, recentApplications] =
      await this.prisma.$transaction([
        this.prisma.jobApplication.count({
          where: {
            userId,
          },
        }),

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
      REJECTED: 0,
      WITHDRAWN: 0,
    };

    for (const group of statusGroups) {
      byStatus[group.status] = group._count.status;
    }

    return {
      totalApplications,
      byStatus,
      recentApplications,
    };
  }
}
