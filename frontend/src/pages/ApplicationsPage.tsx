import { ApplicationsList } from '../features/applications/ApplicationsList';
import { Link } from 'react-router-dom';

export function ApplicationsPage() {
  return (
    <main>
      <h1>Applications</h1>

      <Link to="/applications/new">
        Add application
      </Link>

      <ApplicationsList />
    </main>
  );
}