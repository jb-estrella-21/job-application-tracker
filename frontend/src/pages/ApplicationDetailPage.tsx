import { useEffect, useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { TerminalStatusDialog } from '../components/TerminalStatusDialog';
import {
  getAvailableStatusOptions,
  getStatusLabel,
  isTerminalStatus,
} from '../features/applications/status';
import {
  deleteApplication,
  getApplication,
  getApplicationHistory,
  updateApplication,
} from '../features/applications/api';

import type {
  ApplicationStatus,
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
  const [selectedStatus, setSelectedStatus] =
    useState<ApplicationStatus>('INTERESTED');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [pendingTerminalStatus, setPendingTerminalStatus] =
    useState<Extract<ApplicationStatus, 'HIRED' | 'REJECTED' | 'WITHDRAWN'> | null>(null);

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
        setSelectedStatus(applicationData.status);
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

  async function updateStatus(
    status: ApplicationStatus,
    closeDialogOnSuccess = false,
  ) {
    if (
      !accessToken ||
      !id ||
      !application ||
      status === application.status
    ) {
      return;
    }

    setStatusError('');
    setIsUpdatingStatus(true);

    try {
      const updatedApplication = await updateApplication(
        accessToken,
        id,
        { status },
      );

      setApplication(updatedApplication);
      setSelectedStatus(updatedApplication.status);
      if (closeDialogOnSuccess) {
        setPendingTerminalStatus(null);
      }

      try {
        const historyData = await getApplicationHistory(accessToken, id);
        setHistory(historyData.data);
      } catch {
        // The status update succeeded; history will refresh on the next visit.
      }
    } catch {
      setStatusError('Unable to update application status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  function handleStatusChange() {
    if (!application || selectedStatus === application.status) {
      return;
    }

    setStatusError('');

    if (isTerminalStatus(selectedStatus)) {
      setPendingTerminalStatus(selectedStatus);
      return;
    }

    void updateStatus(selectedStatus);
  }

  function handleCancelTerminalStatus() {
    setPendingTerminalStatus(null);
    setStatusError('');
    setSelectedStatus(application?.status ?? 'INTERESTED');
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
        <div><p className="eyebrow">{application.companyName}</p><h1>{application.positionTitle}</h1><div className="application-status-display"><StatusBadge status={application.status} />{isTerminalStatus(application.status) && <span className="status-lock-indicator" role="img" aria-label="Final status locked" title="Final status locked"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3M6 10h12v10H6z" /></svg></span>}</div></div>
        <div className="header-actions application-actions">
          {!isTerminalStatus(application.status) && <div className="status-change-control">
            <label className="sr-only" htmlFor="application-status">
              Change application status
            </label>
            <select
              id="application-status"
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(
                  event.target.value as ApplicationStatus,
                )
              }
              disabled={isUpdatingStatus || isDeleting}
            >
              {getAvailableStatusOptions(application.status).map((status) => (
                <option key={status} value={status}>
                  {getStatusLabel(status)}
                </option>
              ))}
            </select>
            <button
              className="button button-primary"
              type="button"
              onClick={() => void handleStatusChange()}
              disabled={
                isUpdatingStatus ||
                isDeleting ||
                selectedStatus === application.status
              }
            >
              {isUpdatingStatus ? 'Updating...' : 'Change status'}
            </button>
          </div>}
          <Link className="button button-secondary" to={`/applications/${application.id}/edit`}>
            Edit application
          </Link>
          <button className="button button-danger" type="button" onClick={() => void handleDelete()} disabled={isDeleting || isUpdatingStatus}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
          {statusError && <p className="status-change-error" role="alert">{statusError}</p>}
        </div>
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
      {pendingTerminalStatus && (
        <TerminalStatusDialog
          status={pendingTerminalStatus}
          isSubmitting={isUpdatingStatus}
          error={statusError}
          onCancel={handleCancelTerminalStatus}
          onConfirm={() => void updateStatus(pendingTerminalStatus, true)}
        />
      )}
    </main>
  );
}
