import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsProvider } from '../features/settings/SettingsContext';
import { SettingsPage } from './SettingsPage';

const { useAuth, downloadApplicationsExport } = vi.hoisted(() => ({
  useAuth: vi.fn(),
  downloadApplicationsExport: vi.fn(),
}));
vi.mock('../features/auth/AuthContext', () => ({ useAuth }));
vi.mock('../features/settings/export', () => ({ downloadApplicationsExport }));

function renderSettings() {
  return render(
    <SettingsProvider>
      <SettingsPage />
    </SettingsProvider>,
  );
}

describe('SettingsPage', () => {
  beforeEach(() => {
    localStorage.clear();
    downloadApplicationsExport.mockReset();
    downloadApplicationsExport.mockResolvedValue(2);
    useAuth.mockReturnValue({
      user: { email: 'jane@example.com' },
      accessToken: 'access-token',
    });
  });

  it('shows the signed-in account identity as read-only information', () => {
    renderSettings();

    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Account' })).toBeInTheDocument();
  });

  it('persists the selected theme preference and applies it immediately', async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.selectOptions(screen.getByLabelText('Theme'), 'dark');

    expect(localStorage.getItem('job-app-tracker.theme')).toBe('dark');
    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });
  });

  it('falls back to safe defaults for invalid stored preferences', () => {
    localStorage.setItem('job-app-tracker.theme', 'sepia');
    localStorage.setItem('job-app-tracker.calendar-week-start', 'friday');
    localStorage.setItem('job-app-tracker.applications-sort', 'password');
    localStorage.setItem('job-app-tracker.applications-order', 'sideways');

    renderSettings();

    expect(screen.getByLabelText('Theme')).toHaveValue('system');
    expect(screen.getByLabelText('Calendar week starts on')).toHaveValue('sunday');
    expect(screen.getByLabelText('Default applications sort')).toHaveValue('updatedAt');
    expect(screen.getByLabelText('Default sort order')).toHaveValue('desc');
  });

  it('persists calendar and applications list preferences locally', async () => {
    const user = userEvent.setup();
    const { unmount } = renderSettings();

    await user.selectOptions(screen.getByLabelText('Calendar week starts on'), 'monday');
    await user.selectOptions(screen.getByLabelText('Default applications sort'), 'companyName');
    await user.selectOptions(screen.getByLabelText('Default sort order'), 'asc');

    expect(localStorage.getItem('job-app-tracker.calendar-week-start')).toBe('monday');
    expect(localStorage.getItem('job-app-tracker.applications-sort')).toBe('companyName');
    expect(localStorage.getItem('job-app-tracker.applications-order')).toBe('asc');

    unmount();
    renderSettings();
    expect(screen.getByLabelText('Calendar week starts on')).toHaveValue('monday');
    expect(screen.getByLabelText('Default applications sort')).toHaveValue('companyName');
    expect(screen.getByLabelText('Default sort order')).toHaveValue('asc');
  });

  it('downloads an application export and reports completion', async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole('button', { name: 'Download CSV' }));

    expect(downloadApplicationsExport).toHaveBeenCalledWith('access-token', 'csv');
    expect(await screen.findByRole('status')).toHaveTextContent('CSV export downloaded with 2 applications.');
  });

  it('shows normal error feedback when export fails', async () => {
    const user = userEvent.setup();
    downloadApplicationsExport.mockRejectedValueOnce(new Error('request failed'));
    renderSettings();

    await user.click(screen.getByRole('button', { name: 'Download JSON' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to export your applications. Please try again.',
    );
  });
});
