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
  recruiterPhoneCountryCode: string;
  recruiterPhone: string;
  notes: string;
};

export const CALLING_CODES = [
  { code: '+63', country: 'Philippines' },
  { code: '+1', country: 'United States / Canada' },
  { code: '+44', country: 'United Kingdom' },
  { code: '+61', country: 'Australia' },
  { code: '+65', country: 'Singapore' },
  { code: '+91', country: 'India' },
  { code: '+81', country: 'Japan' },
  { code: '+82', country: 'South Korea' },
  { code: '+62', country: 'Indonesia' },
  { code: '+60', country: 'Malaysia' },
  { code: '+66', country: 'Thailand' },
  { code: '+84', country: 'Vietnam' },
] as const;

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
  recruiterPhoneCountryCode: '',
  recruiterPhone: '',
  notes: '',
};

export function applicationToFormState(
  application: JobApplication,
): ApplicationFormState {
  const phone = splitPhoneNumber(application.recruiterPhone);

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
    recruiterPhoneCountryCode: phone.callingCode,
    recruiterPhone: phone.number,
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
    recruiterPhone: combinePhoneNumber(form) || undefined,
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
    recruiterPhone: combinePhoneNumber(form) || null,
    notes: form.notes || null,
  };
}

function splitPhoneNumber(phone: string | null) {
  const value = phone ?? '';
  const match = CALLING_CODES.find(({ code }) => value.startsWith(code));

  return {
    callingCode: match?.code ?? '',
    number: match ? value.slice(match.code.length).trimStart() : value,
  };
}

function combinePhoneNumber(form: ApplicationFormState) {
  if (!form.recruiterPhone) {
    return '';
  }

  return form.recruiterPhoneCountryCode
    ? `${form.recruiterPhoneCountryCode} ${form.recruiterPhone}`
    : form.recruiterPhone;
}
