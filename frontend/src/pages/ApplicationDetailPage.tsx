import { useEffect, useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
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
    return <p>Loading application...</p>;
  }

  if (error || !application) {
    return <p>{error || 'Application not found.'}</p>;
  }

  return (
    <main>
      <Link to="/applications">
        Back to applications
      </Link>

      <h1>{application.positionTitle}</h1>
      <h2>{application.companyName}</h2>

      <p>Status: {application.status}</p>
      <p>Location: {application.location ?? '—'}</p>
      <p>
        Application date:{' '}
        {application.applicationDate
          ? new Date(
              application.applicationDate,
            ).toLocaleDateString()
          : '—'}
      </p>

      {application.jobPostingUrl && (
        <p>
          Job posting:{' '}
          <a
            href={application.jobPostingUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open posting
          </a>
        </p>
      )}

      <p>
        Source: {application.applicationSource ?? '—'}
      </p>

      <p>
        Salary:{' '}
        {application.salaryMin || application.salaryMax ? (
          <>
            {application.salaryCurrency ?? ''}
            {' '}
            {application.salaryMin ?? '?'}
            {' - '}
            {application.salaryMax ?? '?'}
            {' '}
            {application.salaryPeriod ?? ''}
          </>
        ) : (
          '—'
        )}
      </p>

      <h2>Recruiter</h2>

      <p>
        Name: {application.recruiterName ?? '—'}
      </p>

      <p>
        Email: {application.recruiterEmail ?? '—'}
      </p>

      <p>
        Phone: {application.recruiterPhone ?? '—'}
      </p>

      <p>Notes: {application.notes ?? '—'}</p>

      <Link to={`/applications/${application.id}/edit`}>
        Edit application
      </Link>

      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={isDeleting}
      >
        {isDeleting ? 'Deleting...' : 'Delete application'}
      </button>

      <h2>Status history</h2>

      {history.length === 0 ? (
        <p>No status history.</p>
      ) : (
        <ul>
          {history.map((entry) => (
            <li key={entry.id}>
              {entry.fromStatus ?? 'Created'}
              {' → '}
              {entry.toStatus}
              {' — '}
              {new Date(entry.changedAt).toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
