import type { ApplicationStatus } from './application';

export type RecentApplication = {
  id: string;
  companyName: string;
  positionTitle: string;
  status: ApplicationStatus;
  applicationDate: string | null;
  updatedAt: string;
};

export type DashboardSummary = {
  totalApplications: number;
  byStatus: Record<ApplicationStatus, number>;
  recentApplications: RecentApplication[];
};