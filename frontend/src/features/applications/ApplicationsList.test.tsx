import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsProvider } from '../settings/SettingsContext';
import { ApplicationsList } from './ApplicationsList';
import { getApplications } from './api';

const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock('../auth/AuthContext', () => ({ useAuth }));
vi.mock('./api', () => ({ getApplications: vi.fn() }));

describe('ApplicationsList preferences', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuth.mockReturnValue({ accessToken: 'access-token' });
    vi.mocked(getApplications).mockReset();
    vi.mocked(getApplications).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 5, totalItems: 0, totalPages: 0 },
    });
  });

  it('uses saved default sort and order for its initial request', async () => {
    localStorage.setItem('job-app-tracker.applications-sort', 'companyName');
    localStorage.setItem('job-app-tracker.applications-order', 'asc');

    render(
      <MemoryRouter>
        <SettingsProvider>
          <ApplicationsList />
        </SettingsProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText('No applications found')).toBeInTheDocument();
    expect(getApplications).toHaveBeenCalledWith('access-token', expect.objectContaining({
      page: 1,
      limit: 5,
      sort: 'companyName',
      order: 'asc',
    }));
  });
});
