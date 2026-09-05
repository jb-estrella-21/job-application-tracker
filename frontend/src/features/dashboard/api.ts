import { apiRequest } from '../../lib/api';
import type { DashboardSummary } from '../../types/dashboard';

export function getDashboardSummary(accessToken: string) {
  return apiRequest<DashboardSummary>(
    '/dashboard/summary',
    {},
    accessToken,
  );
}