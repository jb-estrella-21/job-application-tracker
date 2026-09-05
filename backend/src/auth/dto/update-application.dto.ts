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
  jobPostingUrl?: string | null;

  @IsOptional()
  @IsDateString()
  applicationDate?: string | null;

  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMin?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMax?: number | null;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  salaryCurrency?: string | null;

  @IsOptional()
  @IsEnum(SalaryPeriod)
  salaryPeriod?: SalaryPeriod | null;

  @IsOptional()
  @IsString()
  location?: string | null;

  @IsOptional()
  @IsString()
  applicationSource?: string | null;

  @IsOptional()
  @IsString()
  recruiterName?: string | null;

  @IsOptional()
  @IsEmail()
  recruiterEmail?: string | null;

  @IsOptional()
  @IsString()
  recruiterPhone?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null; 
}