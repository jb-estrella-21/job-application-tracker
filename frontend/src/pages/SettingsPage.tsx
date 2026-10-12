import { useState } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import {
  useSettings,
  type ApplicationSort,
  type ApplicationSortOrder,
  type CalendarWeekStart,
  type ThemePreference,
} from '../features/settings/SettingsContext';
import {
  downloadApplicationsExport,
  type ApplicationExportFormat,
} from '../features/settings/export';

const SORT_OPTIONS: { value: ApplicationSort; label: string }[] = [
  { value: 'updatedAt', label: 'Last updated' },
  { value: 'createdAt', label: 'Created date' },
  { value: 'applicationDate', label: 'Application date' },
  { value: 'companyName', label: 'Company' },
  { value: 'positionTitle', label: 'Position' },
];

export function SettingsPage() {
  const { user, accessToken } = useAuth();
  const {
    themePreference,
    updateThemePreference,
    calendarWeekStart,
    updateCalendarWeekStart,
    applicationSort,
    updateApplicationSort,
    applicationSortOrder,
    updateApplicationSortOrder,
    persistenceError,
  } = useSettings();
  const [exporting, setExporting] = useState<ApplicationExportFormat | null>(null);
  const [exportFeedback, setExportFeedback] = useState('');
  const [exportError, setExportError] = useState('');

  async function handleExport(format: ApplicationExportFormat) {
    if (!accessToken || exporting) {
      return;
    }

    setExporting(format);
    setExportFeedback('');
    setExportError('');

    try {
      const count = await downloadApplicationsExport(accessToken, format);
      setExportFeedback(
        `${format.toUpperCase()} export downloaded with ${count} application${count === 1 ? '' : 's'}.`,
      );
    } catch {
      setExportError('Unable to export your applications. Please try again.');
    } finally {
      setExporting(null);
    }
  }

  return (
    <main className="page settings-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Personalize your workspace</p>
          <h1>Settings</h1>
          <p>Manage your appearance, tracking preferences, and application data.</p>
        </div>
      </header>

      {persistenceError && <p className="alert alert-error" role="alert">{persistenceError}</p>}

      <section className="card settings-section" aria-labelledby="settings-appearance-heading">
        <div className="settings-section-heading">
          <h2 id="settings-appearance-heading">Appearance</h2>
          <p>Choose a theme for this browser.</p>
        </div>
        <div className="settings-control">
          <label htmlFor="theme-preference">Theme</label>
          <select
            id="theme-preference"
            value={themePreference}
            onChange={(event) => updateThemePreference(event.target.value as ThemePreference)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
          <p className="settings-help">
            System follows your device&apos;s appearance preference. This setting is saved only in this browser.
          </p>
        </div>
      </section>

      <section className="card settings-section" aria-labelledby="settings-account-heading">
        <div className="settings-section-heading">
          <h2 id="settings-account-heading">Account</h2>
          <p>Your signed-in account details.</p>
        </div>
        <div className="settings-account-row">
          <span>Email address</span>
          <strong>{user?.email ?? 'Unavailable'}</strong>
        </div>
      </section>

      <section className="card settings-section" aria-labelledby="settings-tracking-heading">
        <div className="settings-section-heading">
          <h2 id="settings-tracking-heading">Job tracking</h2>
          <p>Set up your calendar and applications list for this browser.</p>
        </div>
        <div className="settings-control-grid">
          <div className="settings-control">
            <label htmlFor="calendar-week-start">Calendar week starts on</label>
            <select
              id="calendar-week-start"
              value={calendarWeekStart}
              onChange={(event) =>
                updateCalendarWeekStart(event.target.value as CalendarWeekStart)
              }
            >
              <option value="sunday">Sunday</option>
              <option value="monday">Monday</option>
            </select>
          </div>
          <div className="settings-control">
            <label htmlFor="applications-default-sort">Default applications sort</label>
            <select
              id="applications-default-sort"
              value={applicationSort}
              onChange={(event) => updateApplicationSort(event.target.value as ApplicationSort)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="settings-control">
            <label htmlFor="applications-default-order">Default sort order</label>
            <select
              id="applications-default-order"
              value={applicationSortOrder}
              onChange={(event) =>
                updateApplicationSortOrder(event.target.value as ApplicationSortOrder)
              }
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
        <p className="settings-help">
          These preferences are saved only in this browser and do not sync to other devices.
        </p>
      </section>

      <section className="card settings-section" aria-labelledby="settings-data-heading">
        <div className="settings-section-heading">
          <h2 id="settings-data-heading">Data &amp; privacy</h2>
          <p>Download a copy of your application records.</p>
        </div>
        <p className="settings-help">
          Exports include application notes and recruiter contact details. Keep downloaded files somewhere private.
        </p>
        <div className="settings-export-actions">
          <button
            className="button button-secondary"
            type="button"
            disabled={exporting !== null}
            onClick={() => void handleExport('csv')}
          >
            {exporting === 'csv' ? 'Preparing CSV…' : 'Download CSV'}
          </button>
          <button
            className="button button-secondary"
            type="button"
            disabled={exporting !== null}
            onClick={() => void handleExport('json')}
          >
            {exporting === 'json' ? 'Preparing JSON…' : 'Download JSON'}
          </button>
        </div>
        {exportFeedback && <p className="alert alert-success" role="status">{exportFeedback}</p>}
        {exportError && <p className="alert alert-error" role="alert">{exportError}</p>}
      </section>
    </main>
  );
}
