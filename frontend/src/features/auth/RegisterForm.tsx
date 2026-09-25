import { useState, type FormEvent } from 'react';
import { ApiError } from '../../lib/api';
import { register } from './api';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegisterFormProps = {
  onRegistered: (email: string) => void;
  onSignIn: () => void;
};

export function RegisterForm({ onRegistered, onSignIn }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !EMAIL_PATTERN.test(normalizedEmail)) {
      return 'Enter a valid email address.';
    }

    if (!password) {
      return 'Enter a password.';
    }

    if (
      password.length < PASSWORD_MIN_LENGTH
      || password.length > PASSWORD_MAX_LENGTH
    ) {
      return `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`;
    }

    if (!confirmPassword) {
      return 'Confirm your password.';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      await register({ email: email.trim(), password });
      const registeredEmail = email.trim();
      setPassword('');
      setConfirmPassword('');
      onRegistered(registeredEmail);
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        if (requestError.status === 409) {
          setError('An account with this email already exists.');
        } else if (requestError.status === 429) {
          setError('Too many registration attempts. Please try again later.');
        } else if (requestError.status === 400) {
          setError('Please check your email and password, then try again.');
        } else {
          setError('Something went wrong. Please try again.');
        }
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="auth-card">
      <div className="auth-brand">
        <span className="brand-mark" aria-hidden="true">JT</span>
        <span>Job Tracker</span>
      </div>
      <div className="auth-heading">
        <h1>Create account</h1>
        <p>Start managing your job search.</p>
      </div>

      <div className="field">
        <label htmlFor="register-email">Email address</label>
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isSubmitting}
          required
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
        />
        <span className="field-hint">Use 8–128 characters.</span>
      </div>

      <div className="field">
        <label htmlFor="register-confirm-password">Confirm password</label>
        <input
          id="register-confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>

      {error && <p className="alert alert-error" role="alert">{error}</p>}

      <button type="submit" className="button button-primary button-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </button>

      <p className="auth-switch">
        Already have an account?{' '}
        <button type="button" className="auth-link" onClick={onSignIn} disabled={isSubmitting}>
          Sign in
        </button>
      </p>
    </form>
  );
}
