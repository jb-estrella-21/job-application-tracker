import type { ApplicationStatus } from '../../types/application';

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  INTERESTED: 'Interested',
  APPLIED: 'Applied',
  ASSESSMENT: 'Assessment',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

export function getStatusLabel(status: ApplicationStatus) {
  return STATUS_LABELS[status];
}
