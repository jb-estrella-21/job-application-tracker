import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getApplications } from './api';

import type {
  ApplicationStatus,
  ApplicationsQuery,
  JobApplication,
} from '../../types/application';

export function ApplicationsList() {
  const { accessToken } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [status, setStatus] = useState('');
    const [sort, setSort] = useState('updatedAt');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 5;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
        setDebouncedSearch(search);
    }, 400);

    return () => {
        window.clearTimeout(timeout);
    };
    }, [search]);
  
    useEffect(() => {
    if (!accessToken) {
      return;
    }

    const token = accessToken;

    async function loadApplications() {
      try {
        const response = await getApplications(token, {
            page,
            limit,
            search: debouncedSearch || undefined,
            status: status
                ? (status as ApplicationStatus)
                : undefined,
            sort: sort as ApplicationsQuery['sort'],
            order,
            });

        setApplications(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotalItems(response.pagination.totalItems);
      } catch {
        setError('Unable to load applications.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadApplications();
    }, [
    accessToken,
    page,
    debouncedSearch,
    status,
    sort,
    order,
    ]);

  if (isLoading) {
    return <p>Loading applications...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h2>Applications</h2>

        <div>
        <label htmlFor="application-search">
            Search
        </label>

        <input
            id="application-search"
            type="search"
            placeholder="Search company or position"
            value={search}
            onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
            }}
        />
        </div>

        <div>
        <label htmlFor="status-filter">
            Status
        </label>

        <select
            id="status-filter"
            value={status}
            onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
            }}
        >
            <option value="">All statuses</option>
            <option value="INTERESTED">Interested</option>
            <option value="APPLIED">Applied</option>
            <option value="ASSESSMENT">Assessment</option>
            <option value="INTERVIEW">Interview</option>
            <option value="OFFER">Offer</option>
            <option value="REJECTED">Rejected</option>
            <option value="WITHDRAWN">Withdrawn</option>
        </select>
        </div>

        <div>
        <label htmlFor="sort">
            Sort by
        </label>

        <select
            id="sort"
            value={sort}
            onChange={(event) => {
            setSort(event.target.value);
            setPage(1);
            }}
        >
            <option value="updatedAt">Last updated</option>
            <option value="createdAt">Created</option>
            <option value="applicationDate">Application date</option>
            <option value="companyName">Company</option>
            <option value="positionTitle">Position</option>
        </select>
        </div>

        <select
        aria-label="Sort direction"
        value={order}
        onChange={(event) => {
            setOrder(event.target.value as 'asc' | 'desc');
            setPage(1);
        }}
        >
        <option value="desc">Descending</option>
        <option value="asc">Ascending</option>
        </select>

        <div>
        <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
        >
            Previous
        </button>

        <span>
            Page {page} of {totalPages || 1}
        </span>

        <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
        >
            Next
        </button>
        </div>

        <p>
        {totalItems} application{totalItems === 1 ? '' : 's'}
        </p>

      <table>
        <thead>
          <tr>
            <th>Company</th>
            <th>Position</th>
            <th>Status</th>
            <th>Location</th>
            <th>Applied</th>
          </tr>
        </thead>

        <tbody>
          {applications.map((application) => (
            <tr key={application.id}>
              <td>
                <Link to={`/applications/${application.id}`}>
                  {application.companyName}
                </Link>
              </td>
              <td>{application.positionTitle}</td>
              <td>{application.status}</td>
              <td>{application.location ?? '—'}</td>
              <td>
                {application.applicationDate
                  ? new Date(
                      application.applicationDate,
                    ).toLocaleDateString()
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
