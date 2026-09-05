import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
  type SalaryPeriod,
} from '../../types/application';
import { getStatusLabel } from './status';
import type {
  ApplicationFormChangeHandler,
  ApplicationFormState,
} from './form';
import { CALLING_CODES } from './form';

type ApplicationFieldsProps = {
  form: ApplicationFormState;
  onChange: ApplicationFormChangeHandler;
};

export function ApplicationFields({
  form,
  onChange,
}: ApplicationFieldsProps) {
  return (
    <div className="application-fields">
      <div>
        <label htmlFor="companyName">
          Company
        </label>

        <input
          id="companyName"
          value={form.companyName}
          onChange={(event) =>
            onChange('companyName', event.target.value)
          }
          required
        />
      </div>

      <div>
        <label htmlFor="positionTitle">
          Position
        </label>

        <input
          id="positionTitle"
          value={form.positionTitle}
          onChange={(event) =>
            onChange('positionTitle', event.target.value)
          }
          required
        />
      </div>

      <div>
        <label htmlFor="status">
          Status
        </label>

        <select
          id="status"
          value={form.status}
          onChange={(event) =>
            onChange(
              'status',
              event.target.value as ApplicationStatus,
            )
          }
        >
          {APPLICATION_STATUSES.map((statusOption) => (
            <option
              key={statusOption}
              value={statusOption}
            >
              {getStatusLabel(statusOption)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="jobPostingUrl">
          Job posting URL
        </label>

        <input
          id="jobPostingUrl"
          type="url"
          value={form.jobPostingUrl}
          onChange={(event) =>
            onChange('jobPostingUrl', event.target.value)
          }
        />
      </div>

      <div>
        <label htmlFor="applicationDate">
          Application date
        </label>

        <input
          id="applicationDate"
          type="date"
          value={form.applicationDate}
          onChange={(event) =>
            onChange('applicationDate', event.target.value)
          }
        />
      </div>

      <div>
        <label htmlFor="location">
          Location
        </label>

        <input
          id="location"
          value={form.location}
          onChange={(event) =>
            onChange('location', event.target.value)
          }
        />
      </div>

      <div>
        <label htmlFor="applicationSource">
          Application source
        </label>

        <input
          id="applicationSource"
          placeholder="LinkedIn, Indeed, referral..."
          value={form.applicationSource}
          onChange={(event) =>
            onChange('applicationSource', event.target.value)
          }
        />
      </div>

      <fieldset>
        <legend>Salary</legend>

        <div>
          <label htmlFor="salaryMin">Minimum</label>
          <input
            id="salaryMin"
            type="number"
            min="0"
            step="0.01"
            value={form.salaryMin}
            onChange={(event) =>
              onChange('salaryMin', event.target.value)
            }
          />
        </div>

        <div>
          <label htmlFor="salaryMax">Maximum</label>
          <input
            id="salaryMax"
            type="number"
            min="0"
            step="0.01"
            value={form.salaryMax}
            onChange={(event) =>
              onChange('salaryMax', event.target.value)
            }
          />
        </div>

        <div>
          <label htmlFor="salaryCurrency">Currency</label>
          <input
            id="salaryCurrency"
            maxLength={3}
            placeholder="USD"
            value={form.salaryCurrency}
            onChange={(event) =>
              onChange(
                'salaryCurrency',
                event.target.value.toUpperCase(),
              )
            }
          />
        </div>

        <div>
          <label htmlFor="salaryPeriod">Period</label>
          <select
            id="salaryPeriod"
            value={form.salaryPeriod}
            onChange={(event) =>
              onChange(
                'salaryPeriod',
                event.target.value as SalaryPeriod | '',
              )
            }
          >
            <option value="">Not specified</option>
            <option value="HOURLY">Hourly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </select>
        </div>
      </fieldset>

      <fieldset className="recruiter-fields">
        <legend>Recruiter</legend>

        <div>
          <label htmlFor="recruiterName">Name</label>
          <input
            id="recruiterName"
            value={form.recruiterName}
            onChange={(event) =>
              onChange('recruiterName', event.target.value)
            }
          />
        </div>

        <div>
          <label htmlFor="recruiterEmail">Email</label>
          <input
            id="recruiterEmail"
            type="email"
            inputMode="email"
            autoComplete="section-recruiter email"
            maxLength={254}
            aria-describedby="recruiterEmailHint"
            value={form.recruiterEmail}
            onChange={(event) =>
              onChange('recruiterEmail', event.target.value)
            }
          />
          <span className="field-hint" id="recruiterEmailHint">
            Enter a valid email, for example name@company.com.
          </span>
        </div>

        <div>
          <label htmlFor="recruiterPhone">Phone</label>
          <div className="phone-input-group">
            <select
              aria-label="Country calling code or local telephone"
              value={form.recruiterPhoneCountryCode}
              onChange={(event) => onChange('recruiterPhoneCountryCode', event.target.value)}
            >
              <option value="">Local / telephone</option>
              {CALLING_CODES.map(({ code, country }) => (
                <option key={code} value={code}>
                  {country} ({code})
                </option>
              ))}
            </select>
            <input
              id="recruiterPhone"
              type="tel"
              inputMode="tel"
              autoComplete="section-recruiter tel"
              pattern="(?=.*[0-9])[+0-9() .-]{7,25}"
              maxLength={25}
              title="Enter 7 to 25 characters using numbers, spaces, or + ( ) . -"
              aria-describedby="recruiterPhoneHint"
              placeholder={form.recruiterPhoneCountryCode ? 'Phone number' : 'Local or telephone number'}
              value={form.recruiterPhone}
              onChange={(event) => onChange('recruiterPhone', event.target.value)}
            />
          </div>
          <span className="field-hint" id="recruiterPhoneHint">
            Choose a country code for mobile numbers, or use Local / telephone.
          </span>
        </div>
      </fieldset>

      <div>
        <label htmlFor="notes">
          Notes
        </label>

        <textarea
          id="notes"
          value={form.notes}
          onChange={(event) =>
            onChange('notes', event.target.value)
          }
        />
      </div>
    </div>
  );
}
