import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge';
import { APPLICATION_STATUSES } from '../../types/application';
import { getStatusLabel } from '../applications/status';
import { useAuth } from '../auth/AuthContext';
import { getDashboardSummary } from './api';
import type { DashboardSummary } from '../../types/dashboard';

export function Dashboard() {
  const { accessToken } = useAuth();

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
    return <div className="state-card" role="status">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="state-card state-error" role="alert">{error}</div>;
  }

  const highestStatusCount = Math.max(
    ...APPLICATION_STATUSES.map(
      (status) => summary?.byStatus[status] ?? 0,
    ),
    1,
  );

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Dashboard</h1>
          <p>Track momentum across your job search.</p>
        </div>
        <Link className="button button-primary" to="/applications/new">
          Add application
        </Link>
      </header>

      <section className="dashboard-metrics" aria-label="Application summary">
        <article className="metric-card">
          <span>Total applications</span>
          <strong>{summary?.totalApplications ?? 0}</strong>
          <p>All opportunities in your pipeline</p>
        </article>
        <article className="metric-card">
          <span>Active applications</span>
          <strong>{summary?.activeApplications ?? 0}</strong>
          <p>Excludes hired, rejected, and withdrawn</p>
        </article>
        <article className="metric-card">
          <span>Interviews</span>
          <strong>{summary?.interviews ?? 0}</strong>
          <p>Currently in interview</p>
        </article>
        <article className="metric-card">
          <span>Offers</span>
          <strong>{summary?.offers ?? 0}</strong>
          <p>Current offer status</p>
        </article>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div><h2>Pipeline</h2><p>Applications grouped by current status</p></div>
        </div>
        <div className="pipeline-list">
          {APPLICATION_STATUSES.map((status) => (
            <div className="pipeline-row" key={status}>
              <StatusBadge status={status} />
              <div
                className="pipeline-track"
                aria-label={`${getStatusLabel(status)}: ${summary?.byStatus[status] ?? 0}`}
              >
                <span
                  className={`pipeline-bar pipeline-${status.toLowerCase()}`}
                  style={{
                    width: `${((summary?.byStatus[status] ?? 0) / highestStatusCount) * 100}%`,
                  }}
                />
              </div>
              <strong>{summary?.byStatus[status] ?? 0}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="section-block card">
        <div className="section-heading">
          <div><h2>Recent applications</h2><p>Your five most recently updated opportunities</p></div>
          <Link to="/applications">View all</Link>
        </div>
        {summary?.recentApplications.length ? (
          <div className="recent-list">
            {summary.recentApplications.map((application) => (
              <Link className="recent-item" key={application.id} to={`/applications/${application.id}`}>
                <div>
                  <strong>{application.companyName}</strong>
                  <span>{application.positionTitle}</span>
                </div>
                <StatusBadge status={application.status} />
                <time dateTime={application.updatedAt}>
                  {new Date(application.updatedAt).toLocaleDateString()}
                </time>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state"><h3>No applications yet</h3><p>Add your first opportunity to start tracking progress.</p><Link className="button button-primary" to="/applications/new">Add application</Link></div>
        )}
      </section>
    </main>
  );
}
