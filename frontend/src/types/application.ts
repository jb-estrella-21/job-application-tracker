export type ApplicationStatus =
  (typeof APPLICATION_STATUSES)[number];

export type SalaryPeriod =
  | 'HOURLY'
  | 'MONTHLY'
  | 'YEARLY';

export type JobApplication = {
  id: string;
  userId: string;
  companyName: string;
  positionTitle: string;
  jobPostingUrl: string | null;
  applicationDate: string | null;
  status: ApplicationStatus;
  salaryMin: string | null;
  salaryMax: string | null;
  salaryCurrency: string | null;
  salaryPeriod: SalaryPeriod | null;
  location: string | null;
  applicationSource: string | null;
  recruiterName: string | null;
  recruiterEmail: string | null;
  recruiterPhone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationsResponse = {
  data: JobApplication[];

  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
};

export type ApplicationResponse = {
  application: JobApplication;
};

export type ApplicationsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: ApplicationStatus;
  sort?:
    | 'createdAt'
    | 'updatedAt'
    | 'applicationDate'
    | 'companyName'
    | 'positionTitle';
  order?: 'asc' | 'desc';
};

export type CreateApplicationInput = {
  companyName: string;
  positionTitle: string;
  status: ApplicationStatus;
  jobPostingUrl?: string;
  applicationDate?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: SalaryPeriod;
  location?: string;
  applicationSource?: string;
  recruiterName?: string;
  recruiterEmail?: string;
  recruiterPhone?: string;
  notes?: string;
};

export type ApplicationHistoryEntry = {
  id: string;
  jobApplicationId: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  changedAt: string;
};

export type ApplicationHistoryResponse = {
  data: ApplicationHistoryEntry[];
};

export type UpdateApplicationInput = {
  companyName?: string;
  positionTitle?: string;
  status?: ApplicationStatus;

  jobPostingUrl?: string | null;
  applicationDate?: string | null;
  location?: string | null;
  applicationSource?: string | null;

  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  salaryPeriod?: SalaryPeriod | null;

  recruiterName?: string | null;
  recruiterEmail?: string | null;
  recruiterPhone?: string | null;

  notes?: string | null;
};

export const APPLICATION_STATUSES = [
  'INTERESTED',
  'APPLIED',
  'ASSESSMENT',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
] as const;
