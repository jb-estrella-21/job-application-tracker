import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { ApiError } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import { ApplicationFields } from './ApplicationFields';
import { createApplication } from './api';
import type {
  ApplicationFormChangeHandler,
} from './form';
import {
  EMPTY_APPLICATION_FORM,
  formStateToCreateInput,
} from './form';

export function ApplicationForm() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_APPLICATION_FORM);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange: ApplicationFormChangeHandler = (
    field,
    value,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken) {
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await createApplication(
        accessToken,
        formStateToCreateInput(form),
      );

      navigate('/applications');
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        setError('Please check the information you entered.');
      } else {
        setError('Unable to create application.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card application-form">
      <ApplicationFields
        form={form}
        onChange={handleFieldChange}
      />

      {error && <p className="alert alert-error" role="alert">{error}</p>}

      <div className="form-actions">
      <button
        className="button button-secondary"
        type="button"
        onClick={() => navigate('/applications')}
        disabled={isSubmitting}
      >
        Cancel
      </button>

      <button
        className="button button-primary"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? 'Creating...'
          : 'Create application'}
      </button>
      </div>
    </form>
  );
}
