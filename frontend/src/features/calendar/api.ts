import { getApplications } from '../applications/api';
import type { JobApplication } from '../../types/application';

const CALENDAR_APPLICATION_PAGE_SIZE = 100;

export async function getCalendarApplications(accessToken: string) {
  const firstPage = await getApplications(accessToken, {
    page: 1,
    limit: CALENDAR_APPLICATION_PAGE_SIZE,
    sort: 'applicationDate',
    order: 'asc',
  });
  const applications: JobApplication[] = [...firstPage.data];

  for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
    const response = await getApplications(accessToken, {
      page,
      limit: CALENDAR_APPLICATION_PAGE_SIZE,
      sort: 'applicationDate',
      order: 'asc',
    });

    applications.push(...response.data);
  }

  return applications;
}
