import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getDashboardSummary } from './api';
import type { DashboardSummary } from '../../types/dashboard';

export function Dashboard() {
  const {
    user,
    accessToken,
    logout,
  } = useAuth();

  const [summary, setSummary] =
    useState<DashboardSummary | null>(null);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const token = accessToken;

    async function loadDashboard() {
      try {
        const data = await getDashboardSummary(token);
        setSummary(data);
      } catch {
        setError('Unable to load dashboard.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboard();
  }, [accessToken]);

  if (isLoading) {
    return <p>Loading dashboard...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <main>
        <h1>Dashboard</h1>

        <p>Signed in as {user?.email}</p>

        <p>
        Total applications: {summary?.totalApplications ?? 0}
        </p>

        <h2>Applications by status</h2>

        <ul>
        {summary &&
            Object.entries(summary.byStatus).map(
            ([status, count]) => (
                <li key={status}>
                {status}: {count}
                </li>
            ),
            )}
        </ul>

        <button onClick={logout}>
        Sign out
        </button>
    </main>
    );
}
