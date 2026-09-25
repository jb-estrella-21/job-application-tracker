import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterForm } from './RegisterForm';

const { register } = vi.hoisted(() => ({ register: vi.fn() }));
vi.mock('./api', () => ({ register }));

describe('RegisterForm', () => {
  beforeEach(() => register.mockReset());

  it('rejects mismatched passwords without calling registration', async () => {
    const user = userEvent.setup();
    render(<RegisterForm onRegistered={vi.fn()} onSignIn={vi.fn()} />);
    await user.type(screen.getByLabelText(/email address/i), 'new@example.invalid');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password456');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/do not match/i);
    expect(register).not.toHaveBeenCalled();
  });

  it('registers with only backend-supported fields', async () => {
    register.mockResolvedValue({ user: { id: 'user-1', email: 'new@example.invalid' } });
    const registered = vi.fn();
    const user = userEvent.setup();
    render(<RegisterForm onRegistered={registered} onSignIn={vi.fn()} />);
    await user.type(screen.getByLabelText(/email address/i), ' new@example.invalid ');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(register).toHaveBeenCalledWith({ email: 'new@example.invalid', password: 'password123' });
    expect(registered).toHaveBeenCalledWith('new@example.invalid');
  });

});
