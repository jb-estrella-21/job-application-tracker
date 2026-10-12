import { getApplications } from '../applications/api';
import type { JobApplication } from '../../types/application';

export type ApplicationExportFormat = 'csv' | 'json';
type ExportableApplication = Omit<JobApplication, 'userId'>;

const EXPORT_FIELDS = [
  'id',
  'companyName',
  'positionTitle',
  'jobPostingUrl',
  'applicationDate',
  'status',
  'salaryMin',
  'salaryMax',
  'salaryCurrency',
  'salaryPeriod',
  'location',
  'applicationSource',
  'recruiterName',
  'recruiterEmail',
  'recruiterPhone',
  'notes',
  'employmentStatus',
  'employmentEndedAt',
  'createdAt',
  'updatedAt',
] as const satisfies readonly (keyof ExportableApplication)[];

export async function getAllApplications(accessToken: string) {
  const firstPage = await getApplications(accessToken, {
    page: 1,
    limit: 100,
    sort: 'createdAt',
    order: 'asc',
  });
  const applications = new Map(
    firstPage.data.map((application) => [application.id, application]),
  );

  for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
    const response = await getApplications(accessToken, {
      page,
      limit: 100,
      sort: 'createdAt',
      order: 'asc',
    });

    for (const application of response.data) {
      applications.set(application.id, application);
    }
  }

  return [...applications.values()];
}

function omitUserId(application: JobApplication): ExportableApplication {
  const exportable: Partial<JobApplication> = { ...application };
  delete exportable.userId;
  return exportable as ExportableApplication;
}

export function serializeApplications(
  applications: JobApplication[],
  format: ApplicationExportFormat,
) {
  const exportableApplications = applications.map(omitUserId);

  if (format === 'json') {
    return JSON.stringify(exportableApplications, null, 2);
  }

  const escapeCell = (value: unknown) => {
    const rawValue = value == null ? '' : String(value);
    const safeValue = /^[\t\n\r ]*[=+\-@]/.test(rawValue)
      ? `'${rawValue}`
      : rawValue;

    return `"${safeValue.replaceAll('"', '""')}"`;
  };

  const rows = [
    EXPORT_FIELDS.map(escapeCell).join(','),
    ...exportableApplications.map((application) =>
      EXPORT_FIELDS.map((field) => escapeCell(application[field])).join(','),
    ),
  ];

  // A UTF-8 BOM helps spreadsheet applications detect non-ASCII names correctly.
  return `\uFEFF${rows.join('\r\n')}`;
}

function localDateStamp(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function downloadApplicationsExport(
  accessToken: string,
  format: ApplicationExportFormat,
) {
  const applications = await getAllApplications(accessToken);
  const content = serializeApplications(applications, format);
  const mimeType = format === 'csv'
    ? 'text/csv;charset=utf-8'
    : 'application/json;charset=utf-8';
  const blob = new Blob([content], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = `job-applications-${localDateStamp(new Date())}.${format}`;
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);

  return applications.length;
}
