import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../auth/AuthContext';
import { APPLICATION_STATUSES, type ApplicationStatus, type JobApplication } from '../../types/application';
import { getStatusLabel } from '../applications/status';
import { useSettings } from '../settings/SettingsContext';
import { getCalendarApplications } from './api';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateKey(value: string | null) {
  if (!value) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return `${match[1]}-${match[2]}-${match[3]}`;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatEventDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
    new Date(year, month - 1, day),
  );
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function Calendar() {
  const { accessToken } = useAuth();
  const { calendarWeekStart } = useSettings();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(accessToken));
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let active = true;

    void getCalendarApplications(accessToken)
      .then((data) => {
        if (active) {
          setApplications(data);
          setError('');
        }
      })
      .catch(() => {
        if (active) {
          setError('Unable to load calendar applications. Please try again.');
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [accessToken, reloadKey]);

  const applicationsByDate = useMemo(() => {
    const byDate = new Map<string, JobApplication[]>();

    for (const application of applications) {
      if (statusFilter && application.status !== statusFilter) {
        continue;
      }

      const dateKey = toDateKey(application.applicationDate);
      if (!dateKey) {
        continue;
      }

      const entries = byDate.get(dateKey) ?? [];
      entries.push(application);
      byDate.set(dateKey, entries);
    }

    return byDate;
  }, [applications, statusFilter]);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const monthLabel = new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  }).format(visibleMonth);
  const weekStartIndex = calendarWeekStart === 'monday' ? 1 : 0;
  const weekdayLabels = Array.from({ length: 7 }, (_, index) =>
    WEEKDAYS[(index + weekStartIndex) % 7],
  );
  const firstWeekday = new Date(year, month, 1).getDay();
  const leadingDays = (firstWeekday - weekStartIndex + 7) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekCount = Math.ceil((leadingDays + daysInMonth) / 7);
  const todayKey = formatDateKey(new Date());
  const monthDates = Array.from({ length: weekCount * 7 }, (_, index) => {
    const day = index - leadingDays + 1;
    return day > 0 && day <= daysInMonth ? new Date(year, month, day) : null;
  });
  const hasMonthApplications = monthDates.some((date) =>
    date ? (applicationsByDate.get(formatDateKey(date))?.length ?? 0) > 0 : false,
  );

  function changeMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return (
    <main className="page calendar-page">
      <header className="page-header calendar-page-header">
        <div>
          <p className="eyebrow">Your timeline</p>
          <h1>Calendar</h1>
          <p>Application dates from your saved applications.</p>
        </div>
        <div className="calendar-controls" aria-label="Calendar navigation">
          <button
            className="button button-secondary"
            type="button"
            aria-label="Previous month"
            onClick={() => changeMonth(-1)}
          >
            <span aria-hidden="true">←</span>
            <span className="calendar-control-label">Previous</span>
          </button>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => setVisibleMonth(startOfMonth(new Date()))}
          >
            Today
          </button>
          <button
            className="button button-secondary"
            type="button"
            aria-label="Next month"
            onClick={() => changeMonth(1)}
          >
            <span className="calendar-control-label">Next</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </header>

      <section className="calendar-card card" aria-labelledby="calendar-month">
        <div className="calendar-month-heading">
          <div>
            <h2 id="calendar-month">{monthLabel}</h2>
            <p>Only dates you entered as application dates appear here.</p>
          </div>
          <label className="calendar-status-filter" htmlFor="calendar-status-filter">
            <span>Filter by status</span>
            <select
              id="calendar-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ApplicationStatus | '')}
            >
              <option value="">All statuses</option>
              {APPLICATION_STATUSES.map((status) => (
                <option key={status} value={status}>{getStatusLabel(status)}</option>
              ))}
            </select>
          </label>
        </div>

        {isLoading && <p className="calendar-feedback" role="status">Loading calendar…</p>}
        {error && (
          <div className="calendar-feedback alert alert-error" role="alert">
            <span>{error}</span>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => {
                setIsLoading(true);
                setError('');
                setReloadKey((key) => key + 1);
              }}
            >
              Retry
            </button>
          </div>
        )}

        <div className="calendar-table-wrap">
          <table className="calendar-table">
            <caption className="sr-only">Application calendar for {monthLabel}</caption>
            <thead>
              <tr>
                {weekdayLabels.map((weekday) => (
                  <th key={weekday} scope="col" abbr={weekday}>
                    {weekday}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: weekCount }, (_, weekIndex) => (
                <tr key={weekIndex}>
                  {monthDates.slice(weekIndex * 7, weekIndex * 7 + 7).map((date, dayIndex) => {
                    if (!date) {
                      return <td className="calendar-day calendar-day-outside" key={dayIndex} />;
                    }

                    const dateKey = formatDateKey(date);
                    const dayApplications = applicationsByDate.get(dateKey) ?? [];

                    return (
                      <td
                        className={`calendar-day${dateKey === todayKey ? ' calendar-day-today' : ''}`}
                        key={dateKey}
                      >
                        <time
                          className="calendar-day-number"
                          dateTime={dateKey}
                          aria-current={dateKey === todayKey ? 'date' : undefined}
                        >
                          {date.getDate()}
                          {dateKey === todayKey && <span className="calendar-today-label">Today</span>}
                        </time>
                        <ul className="calendar-events">
                          {dayApplications.map((application) => (
                            <li className="calendar-event" key={application.id}>
                              <Link
                                className="calendar-event-link"
                                to={`/applications/${application.id}`}
                                aria-label={`${application.companyName}, ${application.positionTitle}, application date ${formatEventDate(dateKey)}, status ${getStatusLabel(application.status)}. View application details.`}
                              >
                                <span className="calendar-event-type">Application date</span>
                                <time className="calendar-event-date" dateTime={dateKey}>
                                  {formatEventDate(dateKey)}
                                </time>
                                <strong>{application.companyName}</strong>
                                <span className="calendar-event-position">{application.positionTitle}</span>
                                <StatusBadge status={application.status} />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isLoading && !error && !hasMonthApplications && (
          <p className="calendar-empty-month">
            {statusFilter
              ? `No ${getStatusLabel(statusFilter)} applications have dates this month.`
              : 'No application dates this month. Add an application date to see it on your calendar.'}
          </p>
        )}
        <p className="calendar-note">Interview and follow-up events are not scheduled in this calendar.</p>
      </section>
    </main>
  );
}
