import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterForm } from './RegisterForm';

const { register } = vi.hoisted(() => ({ register: vi.fn() }));
vi.mock('./api', () => ({ register }));

function renderRegisterForm(onRegistered = vi.fn(), onSignIn = vi.fn()) {
  return render(<RegisterForm onRegistered={onRegistered} onSignIn={onSignIn} />);
}

function getDescribedError(input: HTMLElement) {
  const describedBy = input.getAttribute('aria-describedby');
  expect(describedBy).toBeTruthy();
  const errorId = describedBy?.split(' ').find((id) => id.endsWith('-error'));
  expect(errorId).toBeTruthy();
  return document.getElementById(errorId!);
}

describe('RegisterForm', () => {
  beforeEach(() => register.mockReset());

  it('associates the first required-field error with email and focuses that input', async () => {
    const user = userEvent.setup();
    renderRegisterForm();

    await user.click(screen.getByRole('button', { name: /create account/i }));

    const email = screen.getByLabelText(/email address/i);
    const password = screen.getByLabelText(/^password$/i);
    const confirmation = screen.getByLabelText(/confirm password/i);
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address.');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(getDescribedError(email)).toHaveTextContent('Enter a valid email address.');
    expect(password).not.toHaveAttribute('aria-invalid');
    expect(confirmation).not.toHaveAttribute('aria-invalid');
    expect(email).toHaveFocus();
    expect(register).not.toHaveBeenCalled();
  });

  it('uses the existing invalid-email message and field association', async () => {
    const user = userEvent.setup();
    renderRegisterForm();
    await user.type(screen.getByLabelText(/email address/i), 'invalid-email');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    const email = screen.getByLabelText(/email address/i);
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(getDescribedError(email)).toHaveTextContent('Enter a valid email address.');
    expect(email).toHaveFocus();
  });

  it('preserves the password-required and minimum-length priority before confirmation errors', async () => {
    const user = userEvent.setup();
    renderRegisterForm();
    await user.type(screen.getByLabelText(/email address/i), 'new@example.invalid');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    let password = screen.getByLabelText(/^password$/i);
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a password.');
    expect(password).toHaveAttribute('aria-invalid', 'true');
    expect(getDescribedError(password)).toHaveTextContent('Enter a password.');
    expect(password.getAttribute('aria-describedby')?.split(' ')).toHaveLength(2);
    expect(document.getElementById(password.getAttribute('aria-describedby')!.split(' ')[0]!))
      .toHaveTextContent('Use 8–128 characters.');
    expect(password).toHaveFocus();
    expect(screen.getByLabelText(/confirm password/i)).not.toHaveAttribute('aria-invalid');

    await user.type(password, 'short');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    password = screen.getByLabelText(/^password$/i);
    expect(screen.getByRole('alert')).toHaveTextContent('Password must be between 8 and 128 characters.');
    expect(getDescribedError(password)).toHaveTextContent('Password must be between 8 and 128 characters.');
    expect(password).toHaveFocus();
    expect(screen.getByLabelText(/confirm password/i)).not.toHaveAttribute('aria-invalid');
  });

  it('associates a missing confirmation error with the confirmation input', async () => {
    const user = userEvent.setup();
    renderRegisterForm();
    await user.type(screen.getByLabelText(/email address/i), 'new@example.invalid');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    const confirmation = screen.getByLabelText(/confirm password/i);
    expect(screen.getByRole('alert')).toHaveTextContent('Confirm your password.');
    expect(confirmation).toHaveAttribute('aria-invalid', 'true');
    expect(getDescribedError(confirmation)).toHaveTextContent('Confirm your password.');
    expect(confirmation).toHaveFocus();
    expect(screen.getByLabelText(/^password$/i)).not.toHaveAttribute('aria-invalid');
  });

  it('associates a password mismatch with confirmation and clears it when corrected', async () => {
    const user = userEvent.setup();
    renderRegisterForm();
    await user.type(screen.getByLabelText(/email address/i), 'new@example.invalid');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    const confirmation = screen.getByLabelText(/confirm password/i);
    await user.type(confirmation, 'password456');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match.');
    expect(confirmation).toHaveAttribute('aria-invalid', 'true');
    expect(getDescribedError(confirmation)).toHaveTextContent('Passwords do not match.');
    expect(confirmation).toHaveFocus();
    expect(screen.getByLabelText(/^password$/i)).not.toHaveAttribute('aria-invalid');

    await user.clear(confirmation);
    await user.type(confirmation, 'password123');
    expect(confirmation).not.toHaveAttribute('aria-invalid');
    expect(confirmation).not.toHaveAttribute('aria-describedby');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('clears a corrected email error without moving focus during normal typing', async () => {
    const user = userEvent.setup();
    renderRegisterForm();
    await user.click(screen.getByRole('button', { name: /create account/i }));
    const email = screen.getByLabelText(/email address/i);
    expect(email).toHaveFocus();

    await user.type(email, 'new@example.invalid');

    expect(email).not.toHaveAttribute('aria-invalid');
    expect(email).not.toHaveAttribute('aria-describedby');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(email).toHaveFocus();
  });

  it('creates stable unique field and error IDs for multiple mounted forms', async () => {
    const user = userEvent.setup();
    render(
      <>
        <RegisterForm onRegistered={vi.fn()} onSignIn={vi.fn()} />
        <RegisterForm onRegistered={vi.fn()} onSignIn={vi.fn()} />
      </>,
    );

    const submitButtons = screen.getAllByRole('button', { name: /create account/i });
    await user.click(submitButtons[0]!);
    await user.click(submitButtons[1]!);

    const allIds = Array.from(document.querySelectorAll('[id]'), (element) => element.id);
    expect(new Set(allIds).size).toBe(allIds.length);
    const invalidEmails = screen.getAllByLabelText(/email address/i)
      .filter((input) => input.getAttribute('aria-invalid') === 'true');
    expect(invalidEmails).toHaveLength(2);
    expect(new Set(invalidEmails.map((input) => input.getAttribute('aria-describedby'))).size).toBe(2);
    for (const input of invalidEmails) {
      expect(getDescribedError(input)).toHaveTextContent('Enter a valid email address.');
    }
  });

  it('preserves the registration payload and successful callback', async () => {
    register.mockResolvedValue({ user: { id: 'user-1', email: 'new@example.invalid' } });
    const registered = vi.fn();
    const user = userEvent.setup();
    renderRegisterForm(registered);
    await user.type(screen.getByLabelText(/email address/i), ' new@example.invalid ');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(register).toHaveBeenCalledWith({ email: 'new@example.invalid', password: 'password123' });
    expect(registered).toHaveBeenCalledWith('new@example.invalid');
    expect(screen.getByLabelText(/^password$/i)).toHaveValue('');
    expect(screen.getByLabelText(/confirm password/i)).toHaveValue('');
  });

  it('preserves loading and disabled behavior while registration is pending', async () => {
    const user = userEvent.setup();
    const registered = vi.fn();
    let resolveRegistration!: (value: { user: { id: string; email: string } }) => void;
    register.mockReturnValue(new Promise((resolve) => { resolveRegistration = resolve; }));
    renderRegisterForm(registered);
    await user.type(screen.getByLabelText(/email address/i), 'new@example.invalid');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByRole('button', { name: 'Creating account...' })).toBeDisabled();
    expect(screen.getByLabelText(/email address/i)).toBeDisabled();
    expect(screen.getByLabelText(/^password$/i)).toBeDisabled();
    expect(screen.getByLabelText(/confirm password/i)).toBeDisabled();

    resolveRegistration({ user: { id: 'user-1', email: 'new@example.invalid' } });
    await waitFor(() => expect(registered).toHaveBeenCalledWith('new@example.invalid'));
  });

  it('keeps the login-switch callback available', async () => {
    const user = userEvent.setup();
    const onSignIn = vi.fn();
    renderRegisterForm(vi.fn(), onSignIn);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(onSignIn).toHaveBeenCalledOnce();
  });
});
