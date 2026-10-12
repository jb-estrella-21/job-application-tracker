import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsProvider } from '../features/settings/SettingsContext';
import { SettingsPage } from './SettingsPage';

const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock('../features/auth/AuthContext', () => ({ useAuth }));

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
    useAuth.mockReturnValue({ user: { email: 'jane@example.com' } });
  });

  it('shows the signed-in account identity as read-only information', () => {
    renderSettings();

    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText(/profile editing and notification preferences are not available/i)).toBeInTheDocument();
  });

  it('saves the selected calendar week start in this browser', async () => {
    const user = userEvent.setup();
    const { unmount } = renderSettings();
    const weekStart = screen.getByLabelText('Week starts on');

    expect(weekStart).toHaveValue('sunday');
    await user.selectOptions(weekStart, 'monday');
    expect(localStorage.getItem('job-app-tracker.calendar-week-start')).toBe('monday');

    unmount();
    renderSettings();
    expect(screen.getByLabelText('Week starts on')).toHaveValue('monday');
  });
});
