import { IsEnum } from 'class-validator';
import { EmploymentStatus } from '@prisma/client';

export class UpdateEmploymentStatusDto {
  @IsEnum(EmploymentStatus)
  employmentStatus!: EmploymentStatus;
}
