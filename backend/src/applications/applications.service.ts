import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateApplicationDto } from '../auth/dto/update-application.dto.js';
import { PrismaService } from '../database/prisma.service.js';
import { CreateApplicationDto } from '../auth/dto/create-application.dto.js';
import { ListApplicationsQueryDto } from '../auth/dto/list-applications-query.dto.js';


@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async remove(userId: string, id: string) {
    const application = await this.prisma.jobApplication.findFirst({
        where: {
        id,
        userId,
        },
    });

    if (!application) {
        throw new NotFoundException('Application not found');
    }

    await this.prisma.jobApplication.delete({
        where: {
        id,
        },
    });

    return {
        message: 'Application deleted successfully',
    };
    }
  
  async update(
    userId: string,
    id: string,
    dto: UpdateApplicationDto,
    ) {
    const existingApplication = await this.prisma.jobApplication.findFirst({
        where: {
        id,
        userId,
        },
    });

    if (!existingApplication) {
        throw new NotFoundException('Application not found');
    }

    const salaryMin = dto.salaryMin ?? existingApplication.salaryMin?.toNumber();
    const salaryMax = dto.salaryMax ?? existingApplication.salaryMax?.toNumber();

    if (
        salaryMin !== undefined &&
        salaryMax !== undefined &&
        salaryMax < salaryMin
    ) {
        throw new BadRequestException(
        'salaryMax must be greater than or equal to salaryMin',
        );
    }

    return this.prisma.$transaction(async (tx) => {
        const application = await tx.jobApplication.update({
        where: {
            id,
        },
        data: {
            companyName: dto.companyName?.trim(),
            positionTitle: dto.positionTitle?.trim(),
            jobPostingUrl: dto.jobPostingUrl,
            applicationDate: dto.applicationDate
            ? new Date(dto.applicationDate)
            : undefined,
            status: dto.status,
            salaryMin: dto.salaryMin,
            salaryMax: dto.salaryMax,
            salaryCurrency: dto.salaryCurrency?.toUpperCase(),
            salaryPeriod: dto.salaryPeriod,
            location: dto.location,
            applicationSource: dto.applicationSource,
            recruiterName: dto.recruiterName,
            recruiterEmail: dto.recruiterEmail,
            recruiterPhone: dto.recruiterPhone,
            notes: dto.notes,
        },
        });

        if (
        dto.status !== undefined &&
        dto.status !== existingApplication.status
        ) {
        await tx.applicationStatusHistory.create({
            data: {
            jobApplicationId: application.id,
            fromStatus: existingApplication.status,
            toStatus: dto.status,
            },
        });
        }

        return {
        application,
        };
    });
    }
  
  async findOne(userId: string, id: string) {
    const application = await this.prisma.jobApplication.findFirst({
        where: {
        id,
        userId,
        },
    });

    if (!application) {
        throw new NotFoundException('Application not found');
    }

    return {
        application,
    };
    }
  
  async findAll(
    userId: string,
    query: ListApplicationsQueryDto,
  ) {
    const {
      page,
      limit,
      search,
      status,
      sort,
      order,
    } = query;

    const skip = (page - 1) * limit;

    const where = {
      userId,

      ...(status && {
        status,
      }),

      ...(search && {
        OR: [
          {
            companyName: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
          {
            positionTitle: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
    };

    const [applications, totalItems] =
      await this.prisma.$transaction([
        this.prisma.jobApplication.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            [sort]: order,
          },
        }),

        this.prisma.jobApplication.count({
          where,
        }),
      ]);

    return {
      data: applications,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async create(userId: string, dto: CreateApplicationDto) {
    if (
      dto.salaryMin !== undefined &&
      dto.salaryMax !== undefined &&
      dto.salaryMax < dto.salaryMin
    ) {
      throw new BadRequestException(
        'salaryMax must be greater than or equal to salaryMin',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const application = await tx.jobApplication.create({
        data: {
          userId,
          companyName: dto.companyName.trim(),
          positionTitle: dto.positionTitle.trim(),
          jobPostingUrl: dto.jobPostingUrl,
          applicationDate: dto.applicationDate
            ? new Date(dto.applicationDate)
            : undefined,
          status: dto.status,
          salaryMin: dto.salaryMin,
          salaryMax: dto.salaryMax,
          salaryCurrency: dto.salaryCurrency?.toUpperCase(),
          salaryPeriod: dto.salaryPeriod,
          location: dto.location,
          applicationSource: dto.applicationSource,
          recruiterName: dto.recruiterName,
          recruiterEmail: dto.recruiterEmail,
          recruiterPhone: dto.recruiterPhone,
          notes: dto.notes,
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          jobApplicationId: application.id,
          fromStatus: null,
          toStatus: application.status,
        },
      });

      return {
        application,
      };
    });
  }
}
