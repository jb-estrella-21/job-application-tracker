import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';

const { login, setAuth } = vi.hoisted(() => ({ login: vi.fn(), setAuth: vi.fn() }));

vi.mock('./api', () => ({ login }));
vi.mock('./AuthContext', () => ({ useAuth: () => ({ login: setAuth }) }));

describe('LoginForm', () => {
  beforeEach(() => {
    login.mockReset();
    setAuth.mockReset();
  });

  it('authenticates after valid credentials are submitted', async () => {
    login.mockResolvedValue({ user: { id: 'user-1', email: 'test-user@example.invalid' }, accessToken: 'access-token' });
    const user = userEvent.setup();
    render(<LoginForm onCreateAccount={vi.fn()} />);

    await user.type(screen.getByLabelText(/email address/i), 'test-user@example.invalid');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(login).toHaveBeenCalledWith({ email: 'test-user@example.invalid', password: 'password123' });
    expect(setAuth).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'access-token' }));
  });

  it('shows a safe error and prevents duplicate submission while pending', async () => {
    let rejectLogin!: (error: Error) => void;
    login.mockReturnValue(new Promise((_, reject) => { rejectLogin = reject; }));
    const user = userEvent.setup();
    render(<LoginForm onCreateAccount={vi.fn()} />);
    await user.type(screen.getByLabelText(/email address/i), 'test-user@example.invalid');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    rejectLogin(new Error('network'));
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
    expect(setAuth).not.toHaveBeenCalled();
  });
});
