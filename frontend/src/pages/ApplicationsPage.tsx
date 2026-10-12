import { ApplicationsList } from '../features/applications/ApplicationsList';

export function ApplicationsPage() {
  return (
    <main className="page">
      <header className="page-header">
        <div><h1>Applications</h1></div>
      </header>

      <ApplicationsList />
    </main>
  );
}
