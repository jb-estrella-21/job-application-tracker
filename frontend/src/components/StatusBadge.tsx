import type { ApplicationStatus } from '../types/application';
import { getStatusLabel } from '../features/applications/status';

type StatusBadgeProps = {
  status: ApplicationStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      {getStatusLabel(status)}
    </span>
  );
}
