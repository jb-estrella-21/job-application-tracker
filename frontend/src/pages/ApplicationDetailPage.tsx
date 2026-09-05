import { useEffect, useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { getStatusLabel } from '../features/applications/status';
import {
  deleteApplication,
  getApplication,
  getApplicationHistory,
} from '../features/applications/api';

import type {
  ApplicationHistoryEntry,
  JobApplication,
} from '../types/application';

export function ApplicationDetailPage() {
  const { id } = useParams();
  const { accessToken } = useAuth();
  const [application, setApplication] =
    useState<JobApplication | null>(null);
  const [history, setHistory] =
    useState<ApplicationHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!accessToken || !id) {
      return;
    }

    const token = accessToken;
    const ID = id;

    async function loadApplication() {
      try {
        const [applicationData, historyData] = await Promise.all([
          getApplication(token, ID),
          getApplicationHistory(token, ID),
        ]);

        setApplication(applicationData);
        setHistory(historyData.data);
      } catch {
        setError('Unable to load application.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadApplication();
  }, [accessToken, id]);

  async function handleDelete() {
    if (!accessToken || !id) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this application?',
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      await deleteApplication(accessToken, id);
      navigate('/applications', { replace: true });
    } catch {
      setError('Unable to delete application.');
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <div className="state-card" role="status">Loading application...</div>;
  }

  if (error || !application) {
    return <div className="state-card state-error" role="alert"><h2>Application unavailable</h2><p>{error || 'Application not found.'}</p><Link to="/applications">Back to applications</Link></div>;
  }

  return (
    <main className="page page-narrow">
      <Link className="back-link" to="/applications">← Back to applications</Link>
      <header className="detail-header">
        <div><p className="eyebrow">{application.companyName}</p><h1>{application.positionTitle}</h1><StatusBadge status={application.status} /></div>
        <div className="header-actions"><Link className="button button-secondary" to={`/applications/${application.id}/edit`}>Edit application</Link><button className="button button-danger" type="button" onClick={() => void handleDelete()} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete'}</button></div>
      </header>

      <section className="card detail-section"><h2>Job details</h2><div className="detail-grid"><div><span>Location</span><strong>{application.location ?? '—'}</strong></div><div><span>Application date</span><strong>
        {application.applicationDate ? new Date(application.applicationDate).toLocaleDateString() : '—'}
      </strong></div><div><span>Source</span><strong>{application.applicationSource ?? '—'}</strong></div><div><span>Job posting</span><strong>{application.jobPostingUrl ? <a href={application.jobPostingUrl} target="_blank" rel="noreferrer">Open posting ↗</a> : '—'}</strong></div></div></section>

      <section className="card detail-section"><h2>Compensation</h2>
      <p>
        {application.salaryMin || application.salaryMax ? <>{application.salaryCurrency ?? ''} {application.salaryMin ?? '?'} – {application.salaryMax ?? '?'} {application.salaryPeriod ?? ''}</> : 'No compensation details provided.'}
      </p>
      </section>

      <section className="card detail-section"><h2>Recruiter</h2><div className="detail-grid"><div><span>Name</span><strong>{application.recruiterName ?? '—'}</strong></div><div><span>Email</span><strong>{application.recruiterEmail ? <a href={`mailto:${application.recruiterEmail}`}>{application.recruiterEmail}</a> : '—'}</strong></div><div><span>Phone</span><strong>{application.recruiterPhone ? <a href={`tel:${application.recruiterPhone}`}>{application.recruiterPhone}</a> : '—'}</strong></div></div></section>

      <section className="card detail-section"><h2>Notes</h2><p className="notes-content">{application.notes ?? 'No notes added.'}</p></section>

      <section className="card detail-section"><h2>Status history</h2>

      {history.length === 0 ? (
        <p>No status history.</p>
      ) : (
        <ul>
          {history.map((entry) => (
            <li className="timeline-item" key={entry.id}>
              <span className="timeline-dot" aria-hidden="true" />
              <div><strong>{entry.fromStatus ? getStatusLabel(entry.fromStatus) : 'Created'} → {getStatusLabel(entry.toStatus)}</strong><time dateTime={entry.changedAt}>{new Date(entry.changedAt).toLocaleString()}</time></div>
            </li>
          ))}
        </ul>
      )}
      </section>
    </main>
  );
}
