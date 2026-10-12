import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppLayout } from './AppLayout';

const { logout, useAuth } = vi.hoisted(() => ({
  logout: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock('../features/auth/AuthContext', () => ({ useAuth }));

function renderLayout(initialPath = '/applications') {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/applications" element={<p>Applications page</p>} />
          <Route path="/applications/new" element={<p>New application form</p>} />
          <Route path="/dashboard" element={<p>Dashboard page</p>} />
          <Route path="/calendar" element={<p>Calendar page</p>} />
          <Route path="/settings" element={<p>Settings page</p>} />
        </Route>
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AppLayout', () => {
  beforeEach(() => {
    logout.mockReset();
    logout.mockResolvedValue(undefined);
    useAuth.mockReturnValue({
      user: { email: 'jane.doe@example.com' },
      logout,
    });
  });

  it('shows the authenticated email and highlights the active page', () => {
    renderLayout();

    expect(
      screen.getByRole('button', { name: 'Account: jane.doe@example.com' }),
    ).toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Applications' })).toHaveClass('active');
  });

  it('provides Calendar as a protected-layout navigation destination', () => {
    renderLayout('/calendar');

    expect(screen.getByText('Calendar page')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Calendar' })).toHaveClass('active');
  });

  it('provides Settings as a protected-layout navigation destination', () => {
    renderLayout('/settings');

    expect(screen.getByText('Settings page')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveClass('active');
  });

  it('opens and closes the mobile navigation with keyboard support', async () => {
    const user = userEvent.setup();
    renderLayout();

    const navigationButton = screen.getByRole('button', { name: 'Open navigation' });
    await user.click(navigationButton);

    expect(navigationButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveFocus();
  });

  it('opens the existing application form from the sidebar action', async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByRole('button', { name: 'Open navigation' }));
    await user.click(screen.getByRole('link', { name: 'Add Application' }));

    expect(await screen.findByText('New application form')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('keeps the existing logout action in the account menu', async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.click(
      screen.getByRole('button', { name: 'Account: jane.doe@example.com' }),
    );
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(logout).toHaveBeenCalledOnce();
    expect(await screen.findByText('Login page')).toBeInTheDocument();
  });
});
