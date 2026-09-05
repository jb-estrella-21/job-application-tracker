import { useState, type FormEvent } from 'react';
import { ApiError } from '../../lib/api';
import { login } from './api';
import { useAuth } from './AuthContext';

export function LoginForm() {
  const { login: setAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setIsSubmitting(true);

    try {
      const response = await login({
        email,
        password,
      });

      setAuth(response);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setError('Invalid email or password.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-card">
      <div className="auth-brand">
        <span className="brand-mark" aria-hidden="true">JT</span>
        <span>Job Tracker</span>
      </div>
      <div className="auth-heading">
        <h1>Welcome back</h1>
        <p>Sign in to manage your job search.</p>
      </div>

      <div className="field">
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      {error && <p className="alert alert-error" role="alert">{error}</p>}

      <button type="submit" className="button button-primary button-full" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
