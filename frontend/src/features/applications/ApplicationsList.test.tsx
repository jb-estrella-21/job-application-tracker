import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { APPLICATION_STATUSES } from '../../types/application';
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

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
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

  it.each(['light', 'dark'] as const)(
    'preserves status, sort, and order selection behavior in %s theme',
    async (theme) => {
      const user = userEvent.setup();
      document.documentElement.dataset.theme = theme;
      localStorage.setItem('job-app-tracker.theme', theme);

      render(
        <MemoryRouter>
          <SettingsProvider>
            <ApplicationsList />
          </SettingsProvider>
        </MemoryRouter>,
      );

      expect(await screen.findByText('No applications found')).toBeInTheDocument();

      const statusSelect = screen.getByLabelText('Status') as HTMLSelectElement;
      expect(Array.from(statusSelect.options, (option) => option.value)).toEqual([
        '',
        ...APPLICATION_STATUSES,
      ]);

      await user.selectOptions(statusSelect, 'REJECTED');
      await user.selectOptions(screen.getByLabelText('Sort by'), 'companyName');
      await user.selectOptions(screen.getByLabelText('Order'), 'asc');

      await waitFor(() => {
        expect(getApplications).toHaveBeenLastCalledWith(
          'access-token',
          expect.objectContaining({
            status: 'REJECTED',
            sort: 'companyName',
            order: 'asc',
          }),
        );
      });
      expect(statusSelect).toHaveValue('REJECTED');
      expect(screen.getByLabelText('Sort by')).toHaveValue('companyName');
      expect(screen.getByLabelText('Order')).toHaveValue('asc');
    },
  );
});
