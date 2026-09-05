import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge';
import { APPLICATION_STATUSES } from '../../types/application';
import { useAuth } from '../auth/AuthContext';
import { getApplications } from './api';
import { getStatusLabel } from './status';
import type { ApplicationStatus, ApplicationsQuery, JobApplication } from '../../types/application';

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
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 400);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!accessToken) return;
    const token = accessToken;
    async function loadApplications() {
      setError('');
      setIsLoading(true);
      try {
        const response = await getApplications(token, { page, limit, search: debouncedSearch || undefined, status: status ? (status as ApplicationStatus) : undefined, sort: sort as ApplicationsQuery['sort'], order });
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
  }, [accessToken, page, debouncedSearch, status, sort, order]);

  if (isLoading) return <div className="state-card" role="status">Loading applications...</div>;
  if (error) return <div className="state-card state-error" role="alert">{error}</div>;

  return (
    <section className="applications-panel card">
      <div className="filters" aria-label="Application filters">
        <div className="field field-search"><label htmlFor="application-search">Search</label><input id="application-search" type="search" placeholder="Search company or position..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></div>
        <div className="field"><label htmlFor="status-filter">Status</label><select id="status-filter" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option>{APPLICATION_STATUSES.map((option) => <option key={option} value={option}>{getStatusLabel(option)}</option>)}</select></div>
        <div className="field"><label htmlFor="sort">Sort by</label><select id="sort" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="updatedAt">Last updated</option><option value="createdAt">Created</option><option value="applicationDate">Application date</option><option value="companyName">Company</option><option value="positionTitle">Position</option></select></div>
        <div className="field"><label htmlFor="sort-order">Order</label><select id="sort-order" value={order} onChange={(event) => { setOrder(event.target.value as 'asc' | 'desc'); setPage(1); }}><option value="desc">Descending</option><option value="asc">Ascending</option></select></div>
      </div>
      {applications.length === 0 ? (
        <div className="empty-state"><h2>No applications found</h2><p>{search || status ? 'No applications match your current filters.' : 'Add your first application to start building your pipeline.'}</p>{!search && !status && <Link className="button button-primary" to="/applications/new">Add application</Link>}</div>
      ) : (
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Company</th><th>Position</th><th>Status</th><th>Location</th><th>Applied</th><th>Updated</th></tr></thead><tbody>{applications.map((application) => <tr key={application.id}><td><Link className="table-primary" to={`/applications/${application.id}`}>{application.companyName}</Link></td><td>{application.positionTitle}</td><td><StatusBadge status={application.status} /></td><td>{application.location ?? '—'}</td><td>{application.applicationDate ? new Date(application.applicationDate).toLocaleDateString() : '—'}</td><td>{new Date(application.updatedAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>
      )}
      <footer className="pagination"><p><strong>{totalItems}</strong> application{totalItems === 1 ? '' : 's'}</p><div className="pagination-controls"><button className="button button-secondary" type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button><span className="page-count">Page {page} of {totalPages || 1}</span><button className="button button-secondary" type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</button></div></footer>
    </section>
  );
}
