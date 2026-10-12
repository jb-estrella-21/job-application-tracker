import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn() }));

vi.mock('./features/auth/AuthContext', () => ({ useAuth }));
vi.mock('./features/applications/ApplicationForm', () => ({
  ApplicationForm: () => <form aria-label="Application details" />,
}));

function renderApp(status: 'authenticated' | 'unauthenticated') {
  useAuth.mockReturnValue({
    status,
    isAuthenticated: status === 'authenticated',
    user: { email: 'jane@example.com' },
    login: vi.fn(),
    logout: vi.fn(),
  });

  return render(
    <MemoryRouter initialEntries={['/applications/new']}>
      <App />
    </MemoryRouter>,
  );
}

describe('application creation route', () => {
  beforeEach(() => {
    useAuth.mockReset();
  });

  it('renders the form in its own full-screen layout without the authenticated shell', () => {
    const { container } = renderApp('authenticated');

    expect(screen.getByRole('heading', { name: 'Add application' })).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Application details' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to dashboard' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    expect(container.querySelector('.app-shell')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /account:/i })).not.toBeInTheDocument();
  });

  it('continues to require authentication for the full-screen creation route', () => {
    renderApp('unauthenticated');

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Add application' })).not.toBeInTheDocument();
    expect(screen.queryByRole('form', { name: 'Application details' })).not.toBeInTheDocument();
  });
});
