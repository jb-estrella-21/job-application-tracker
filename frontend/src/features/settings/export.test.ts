import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JobApplication } from '../../types/application';
import { getApplications } from '../applications/api';
import { getAllApplications, serializeApplications } from './export';

vi.mock('../applications/api', () => ({ getApplications: vi.fn() }));

function makeApplication(overrides: Partial<JobApplication> = {}): JobApplication {
  return {
    id: 'application-1',
    userId: 'user-private-id',
    companyName: 'Acme Systems',
    positionTitle: 'Product Designer',
    jobPostingUrl: null,
    applicationDate: '2026-10-12T00:00:00.000Z',
    status: 'INTERVIEW',
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    salaryPeriod: null,
    location: null,
    applicationSource: null,
    recruiterName: null,
    recruiterEmail: null,
    recruiterPhone: null,
    notes: null,
    employmentStatus: null,
    employmentEndedAt: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('application export', () => {
  beforeEach(() => vi.mocked(getApplications).mockReset());

  it('fetches all application pages using the supported page size', async () => {
    vi.mocked(getApplications)
      .mockResolvedValueOnce({
        data: [makeApplication()],
        pagination: { page: 1, limit: 100, totalItems: 2, totalPages: 2 },
      })
      .mockResolvedValueOnce({
        data: [makeApplication({ id: 'application-2', companyName: 'Northwind' })],
        pagination: { page: 2, limit: 100, totalItems: 2, totalPages: 2 },
      });

    const applications = await getAllApplications('access-token');

    expect(applications.map((application) => application.id)).toEqual([
      'application-1',
      'application-2',
    ]);
    expect(getApplications).toHaveBeenNthCalledWith(1, 'access-token', {
      page: 1,
      limit: 100,
      sort: 'createdAt',
      order: 'asc',
    });
    expect(getApplications).toHaveBeenNthCalledWith(2, 'access-token', {
      page: 2,
      limit: 100,
      sort: 'createdAt',
      order: 'asc',
    });
  });

  it('exports JSON application fields without user identifiers or auth data', () => {
    const json = serializeApplications([makeApplication()], 'json');
    const exported = JSON.parse(json) as Record<string, unknown>[];

    expect(exported).toHaveLength(1);
    expect(exported[0]).toHaveProperty('companyName', 'Acme Systems');
    expect(exported[0]).not.toHaveProperty('userId');
    expect(json).not.toContain('password');
    expect(json).not.toContain('accessToken');
  });

  it('quotes CSV fields and prevents formula injection', () => {
    const csv = serializeApplications([
      makeApplication({
        companyName: '=HYPERLINK("https://example.test","open")',
        notes: '  +SUM(1,2)\nA note',
      }),
    ], 'csv');

    expect(csv.startsWith('\uFEFF"id","companyName"')).toBe(true);
    expect(csv).toContain('"\'=HYPERLINK(""https://example.test"",""open"")"');
    expect(csv).toContain('"\'  +SUM(1,2)\nA note"');
    expect(csv).not.toContain('userId');
  });

  it('serializes empty CSV data with headers and accepts empty JSON data', () => {
    expect(serializeApplications([], 'csv')).toContain('"id","companyName"');
    expect(JSON.parse(serializeApplications([], 'json'))).toEqual([]);
  });
});
