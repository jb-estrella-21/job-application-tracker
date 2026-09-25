import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
} from '../../types/application';

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  INTERESTED: 'Interested',
  APPLIED: 'Applied',
  ASSESSMENT: 'Assessment',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

export function getStatusLabel(status: ApplicationStatus) {
  return STATUS_LABELS[status];
}

export function isTerminalStatus(status: ApplicationStatus) {
  return (
    status === 'REJECTED' ||
    status === 'WITHDRAWN' ||
    status === 'HIRED'
  );
}

export function getAvailableStatusOptions(
  currentStatus?: ApplicationStatus,
) {
  if (currentStatus && isTerminalStatus(currentStatus)) {
    return [currentStatus];
  }

  return APPLICATION_STATUSES.filter(
    (status) => status !== 'HIRED' || currentStatus === 'OFFER',
  );
}
