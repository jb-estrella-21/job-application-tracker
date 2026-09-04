import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Min,
} from 'class-validator';
import {
  ApplicationStatus,
  SalaryPeriod,
} from '@prisma/client';

export class UpdateApplicationDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  positionTitle?: string;

  @IsOptional()
  @IsUrl()
  jobPostingUrl?: string;

  @IsOptional()
  @IsDateString()
  applicationDate?: string;

  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMax?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  salaryCurrency?: string;

  @IsOptional()
  @IsEnum(SalaryPeriod)
  salaryPeriod?: SalaryPeriod;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  applicationSource?: string;

  @IsOptional()
  @IsString()
  recruiterName?: string;

  @IsOptional()
  @IsEmail()
  recruiterEmail?: string;

  @IsOptional()
  @IsString()
  recruiterPhone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}