import { ApplicationsList } from '../features/applications/ApplicationsList';

export function ApplicationsPage() {
  return (
    <main className="page">
      <header className="page-header">
        <div><p className="eyebrow">Pipeline</p><h1>Applications</h1><p>Search, filter, and manage every opportunity.</p></div>
      </header>

      <ApplicationsList />
    </main>
  );
}
