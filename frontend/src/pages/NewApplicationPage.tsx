import { Link } from 'react-router-dom';
import { ApplicationForm } from '../features/applications/ApplicationForm';

export function NewApplicationPage() {
  return (
    <main className="page page-narrow">
      <header className="page-header">
        <div>
          <p className="eyebrow">Applications</p>
          <h1>Add application</h1>
          <p>Capture the details of a new opportunity.</p>
        </div>

        <Link className="button button-secondary" to="/dashboard">
          Back to dashboard
        </Link>
      </header>

      <ApplicationForm />
    </main>
  );
}
