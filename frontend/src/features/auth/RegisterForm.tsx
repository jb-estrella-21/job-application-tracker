import { useId, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { ApiError } from '../../lib/api';
import { register } from './api';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegisterFormProps = {
  onRegistered: (email: string) => void;
  onSignIn: () => void;
};

type RegistrationField = 'email' | 'password' | 'confirmPassword';

type ValidationError = {
  field: RegistrationField;
  message: string;
};

export function RegisterForm({ onRegistered, onSignIn }: RegisterFormProps) {
  const idPrefix = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState<ValidationError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const emailId = `${idPrefix}-register-email`;
  const passwordId = `${idPrefix}-register-password`;
  const confirmPasswordId = `${idPrefix}-register-confirm-password`;
  const passwordHintId = `${idPrefix}-register-password-hint`;
  const validationErrorId = validationError
    ? `${idPrefix}-register-${validationError.field}-error`
    : undefined;

  useLayoutEffect(() => {
    if (!validationError) return;

    const invalidField = {
      email: emailRef.current,
      password: passwordRef.current,
      confirmPassword: confirmPasswordRef.current,
    }[validationError.field];

    if (invalidField && !invalidField.disabled) {
      invalidField.focus();
    }
  }, [validationError]);

  function validate(): ValidationError | null {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !EMAIL_PATTERN.test(normalizedEmail)) {
      return { field: 'email', message: 'Enter a valid email address.' };
    }

    if (!password) {
      return { field: 'password', message: 'Enter a password.' };
    }

    if (
      password.length < PASSWORD_MIN_LENGTH
      || password.length > PASSWORD_MAX_LENGTH
    ) {
      return {
        field: 'password',
        message: `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`,
      };
    }

    if (!confirmPassword) {
      return { field: 'confirmPassword', message: 'Confirm your password.' };
    }

    if (password !== confirmPassword) {
      return { field: 'confirmPassword', message: 'Passwords do not match.' };
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setValidationError(null);

    const validationError = validate();

    if (validationError) {
      setError(validationError.message);
      setValidationError(validationError);
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

  function updateValidationErrorForField(field: RegistrationField, value: string) {
    if (!validationError) return;

    let nextValidationError: ValidationError | null | undefined;
    if (validationError.field === 'email' && field === 'email') {
      const normalizedEmail = value.trim();
      nextValidationError = !normalizedEmail || !EMAIL_PATTERN.test(normalizedEmail)
        ? validationError
        : null;
    } else if (validationError.field === 'password' && field === 'password') {
      if (!value) {
        nextValidationError = { field: 'password', message: 'Enter a password.' };
      } else if (value.length < PASSWORD_MIN_LENGTH || value.length > PASSWORD_MAX_LENGTH) {
        nextValidationError = {
          field: 'password',
          message: `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`,
        };
      } else {
        nextValidationError = null;
      }
    } else if (validationError.field === 'confirmPassword') {
      const nextPassword = field === 'password' ? value : password;
      const nextConfirmPassword = field === 'confirmPassword' ? value : confirmPassword;
      if (!nextConfirmPassword) {
        nextValidationError = { field: 'confirmPassword', message: 'Confirm your password.' };
      } else if (nextPassword !== nextConfirmPassword) {
        nextValidationError = { field: 'confirmPassword', message: 'Passwords do not match.' };
      } else {
        nextValidationError = null;
      }
    }

    if (nextValidationError === null) {
      setValidationError(null);
      setError('');
    } else if (
      nextValidationError
      && nextValidationError.message !== validationError.message
    ) {
      setValidationError(nextValidationError);
      setError(nextValidationError.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="auth-card">
      <div className="auth-brand">
        <img className="brand-mark" src="/brand/h3a-symbol-evergreen.svg" alt="" aria-hidden="true" />
        <span>Track Thy Path</span>
      </div>
      <div className="auth-heading">
        <h1>Create account</h1>
        <p>Start managing your job search.</p>
      </div>

      <div className="field">
        <label htmlFor={emailId}>Email address</label>
        <input
          ref={emailRef}
          id={emailId}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            updateValidationErrorForField('email', event.target.value);
          }}
          disabled={isSubmitting}
          required
          aria-invalid={validationError?.field === 'email' ? true : undefined}
          aria-describedby={validationError?.field === 'email' ? validationErrorId : undefined}
        />
        {validationError?.field === 'email' && (
          <p id={validationErrorId} className="alert alert-error">{validationError.message}</p>
        )}
      </div>

      <div className="field">
        <label htmlFor={passwordId}>Password</label>
        <input
          ref={passwordRef}
          id={passwordId}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            updateValidationErrorForField('password', event.target.value);
          }}
          disabled={isSubmitting}
          required
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
          aria-invalid={validationError?.field === 'password' ? true : undefined}
          aria-describedby={[
            passwordHintId,
            validationError?.field === 'password' ? validationErrorId : undefined,
          ].filter(Boolean).join(' ')}
        />
        <span id={passwordHintId} className="field-hint">Use 8–128 characters.</span>
        {validationError?.field === 'password' && (
          <p id={validationErrorId} className="alert alert-error">{validationError.message}</p>
        )}
      </div>

      <div className="field">
        <label htmlFor={confirmPasswordId}>Confirm password</label>
        <input
          ref={confirmPasswordRef}
          id={confirmPasswordId}
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            updateValidationErrorForField('confirmPassword', event.target.value);
          }}
          disabled={isSubmitting}
          required
          aria-invalid={validationError?.field === 'confirmPassword' ? true : undefined}
          aria-describedby={validationError?.field === 'confirmPassword' ? validationErrorId : undefined}
        />
        {validationError?.field === 'confirmPassword' && (
          <p id={validationErrorId} className="alert alert-error">{validationError.message}</p>
        )}
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
