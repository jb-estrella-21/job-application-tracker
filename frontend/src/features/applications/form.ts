import type {
  ApplicationStatus,
  CreateApplicationInput,
  JobApplication,
  SalaryPeriod,
  UpdateApplicationInput,
} from '../../types/application';

export type ApplicationFormState = {
  companyName: string;
  positionTitle: string;
  status: ApplicationStatus;
  jobPostingUrl: string;
  applicationDate: string;
  location: string;
  applicationSource: string;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  salaryPeriod: SalaryPeriod | '';
  recruiterName: string;
  recruiterEmail: string;
  recruiterPhone: string;
  notes: string;
};

export type ApplicationFormChangeHandler =
  <K extends keyof ApplicationFormState>(
    field: K,
    value: ApplicationFormState[K],
  ) => void;

export const EMPTY_APPLICATION_FORM: ApplicationFormState = {
  companyName: '',
  positionTitle: '',
  status: 'INTERESTED',
  jobPostingUrl: '',
  applicationDate: '',
  location: '',
  applicationSource: '',
  salaryMin: '',
  salaryMax: '',
  salaryCurrency: '',
  salaryPeriod: '',
  recruiterName: '',
  recruiterEmail: '',
  recruiterPhone: '',
  notes: '',
};

export function applicationToFormState(
  application: JobApplication,
): ApplicationFormState {
  return {
    companyName: application.companyName,
    positionTitle: application.positionTitle,
    status: application.status,
    jobPostingUrl: application.jobPostingUrl ?? '',
    applicationDate: application.applicationDate?.slice(0, 10) ?? '',
    location: application.location ?? '',
    applicationSource: application.applicationSource ?? '',
    salaryMin: application.salaryMin ?? '',
    salaryMax: application.salaryMax ?? '',
    salaryCurrency: application.salaryCurrency ?? '',
    salaryPeriod: application.salaryPeriod ?? '',
    recruiterName: application.recruiterName ?? '',
    recruiterEmail: application.recruiterEmail ?? '',
    recruiterPhone: application.recruiterPhone ?? '',
    notes: application.notes ?? '',
  };
}

export function formStateToCreateInput(
  form: ApplicationFormState,
): CreateApplicationInput {
  return {
    companyName: form.companyName,
    positionTitle: form.positionTitle,
    status: form.status,
    jobPostingUrl: form.jobPostingUrl || undefined,
    applicationDate: form.applicationDate || undefined,
    location: form.location || undefined,
    applicationSource: form.applicationSource || undefined,
    salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
    salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
    salaryCurrency: form.salaryCurrency || undefined,
    salaryPeriod: form.salaryPeriod || undefined,
    recruiterName: form.recruiterName || undefined,
    recruiterEmail: form.recruiterEmail || undefined,
    recruiterPhone: form.recruiterPhone || undefined,
    notes: form.notes || undefined,
  };
}

export function formStateToUpdateInput(
  form: ApplicationFormState,
): UpdateApplicationInput {
  return {
    companyName: form.companyName,
    positionTitle: form.positionTitle,
    status: form.status,
    jobPostingUrl: form.jobPostingUrl || null,
    applicationDate: form.applicationDate || null,
    location: form.location || null,
    applicationSource: form.applicationSource || null,
    salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
    salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
    salaryCurrency: form.salaryCurrency || null,
    salaryPeriod: form.salaryPeriod || null,
    recruiterName: form.recruiterName || null,
    recruiterEmail: form.recruiterEmail || null,
    recruiterPhone: form.recruiterPhone || null,
    notes: form.notes || null,
  };
}
