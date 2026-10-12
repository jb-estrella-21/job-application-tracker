import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getApplications } from '../applications/api';
import { getCalendarApplications } from './api';
import type { ApplicationsResponse, JobApplication } from '../../types/application';

vi.mock('../applications/api', () => ({ getApplications: vi.fn() }));

const application = (id: string) => ({ id }) as JobApplication;

function response(
  data: JobApplication[],
  page: number,
  totalPages: number,
): ApplicationsResponse {
  return {
    data,
    pagination: { page, limit: 100, totalItems: totalPages * 100, totalPages },
  };
}

describe('getCalendarApplications', () => {
  beforeEach(() => vi.mocked(getApplications).mockReset());

  it('loads and combines all user-scoped application pages in date order', async () => {
    vi.mocked(getApplications)
      .mockResolvedValueOnce(response([application('first')], 1, 2))
      .mockResolvedValueOnce(response([application('second')], 2, 2));

    await expect(getCalendarApplications('access-token')).resolves.toEqual([
      application('first'),
      application('second'),
    ]);

    expect(getApplications).toHaveBeenNthCalledWith(1, 'access-token', {
      page: 1,
      limit: 100,
      sort: 'applicationDate',
      order: 'asc',
    });
    expect(getApplications).toHaveBeenNthCalledWith(2, 'access-token', {
      page: 2,
      limit: 100,
      sort: 'applicationDate',
      order: 'asc',
    });
  });

  it('does not request extra pages when there are no applications', async () => {
    vi.mocked(getApplications).mockResolvedValueOnce(response([], 1, 0));

    await expect(getCalendarApplications('access-token')).resolves.toEqual([]);
    expect(getApplications).toHaveBeenCalledOnce();
  });
});
