import { Link } from 'react-router-dom';
import { ApplicationForm } from '../features/applications/ApplicationForm';

export function NewApplicationPage() {
  return (
    <main className="new-application-screen">
      <header className="new-application-header">
        <div className="new-application-brand">
          <span className="new-application-symbol-wrap">
            <img
              className="new-application-symbol"
              src="/brand/h3a-symbol-reversed.svg"
              alt=""
              aria-hidden="true"
            />
          </span>
          <strong>Track Thy Path</strong>
        </div>

        <Link
          className="button button-secondary new-application-back"
          to="/dashboard"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m14 18-6-6 6-6M8 12h12" />
          </svg>
          <span>Back to dashboard</span>
        </Link>
      </header>

      <div className="new-application-content">
        <header className="new-application-heading">
          <p className="eyebrow">Applications</p>
          <h1>Add application</h1>
          <p>Capture the details of a new opportunity.</p>
        </header>

        <ApplicationForm />
      </div>
    </main>
  );
}
