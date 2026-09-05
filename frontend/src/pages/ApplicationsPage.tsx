import { ApplicationsList } from '../features/applications/ApplicationsList';
import { Link } from 'react-router-dom';

export function ApplicationsPage() {
  return (
    <main className="page">
      <header className="page-header">
        <div><p className="eyebrow">Pipeline</p><h1>Applications</h1><p>Search, filter, and manage every opportunity.</p></div>
        <Link className="button button-primary" to="/applications/new">Add application</Link>
      </header>

      <ApplicationsList />
    </main>
  );
}
