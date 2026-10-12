import { useAuth } from '../features/auth/AuthContext';
import { useSettings } from '../features/settings/SettingsContext';

export function SettingsPage() {
  const { user } = useAuth();
  const {
    calendarWeekStart,
    updateCalendarWeekStart,
    persistenceError,
  } = useSettings();

  return (
    <main className="page settings-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Personalize your workspace</p>
          <h1>Settings</h1>
          <p>Manage the preferences available for this workspace.</p>
        </div>
      </header>

      <section className="card settings-section" aria-labelledby="settings-account-heading">
        <div className="settings-section-heading">
          <h2 id="settings-account-heading">Account</h2>
          <p>Your signed-in account details.</p>
        </div>
        <div className="settings-account-row">
          <span>Email address</span>
          <strong>{user?.email ?? 'Unavailable'}</strong>
        </div>
        <p className="settings-help">
          Profile editing and notification preferences are not available in the current account services.
        </p>
      </section>

      <section className="card settings-section" aria-labelledby="settings-calendar-heading">
        <div className="settings-section-heading">
          <h2 id="settings-calendar-heading">Calendar</h2>
          <p>Choose how the calendar lays out each week.</p>
        </div>
        <div className="settings-control">
          <label htmlFor="calendar-week-start">Week starts on</label>
          <select
            id="calendar-week-start"
            value={calendarWeekStart}
            onChange={(event) =>
              updateCalendarWeekStart(event.target.value as 'sunday' | 'monday')
            }
          >
            <option value="sunday">Sunday</option>
            <option value="monday">Monday</option>
          </select>
          <p className="settings-help">
            This preference is saved only in this browser and does not sync to other devices.
          </p>
          {persistenceError && <p className="alert alert-error" role="alert">{persistenceError}</p>}
        </div>
      </section>
    </main>
  );
}
