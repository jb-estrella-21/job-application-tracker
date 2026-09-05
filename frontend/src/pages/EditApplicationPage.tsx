import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import {
  getApplication,
  updateApplication,
} from '../features/applications/api';
import { ApplicationFields } from '../features/applications/ApplicationFields';
import {
  applicationToFormState,
  EMPTY_APPLICATION_FORM,
  formStateToUpdateInput,
} from '../features/applications/form';
import type {
  ApplicationFormChangeHandler,
} from '../features/applications/form';

export function EditApplicationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [form, setForm] = useState(EMPTY_APPLICATION_FORM);
  const [hasApplication, setHasApplication] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFieldChange: ApplicationFormChangeHandler = (
    field,
    value,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  useEffect(() => {
    if (!accessToken || !id) {
      return;
    }

    const token = accessToken;
    const ID = id;

    async function loadApplication() {
      try {
        const data = await getApplication(token, ID);

        setForm(applicationToFormState(data));
        setHasApplication(true);
      } catch {
        setError('Unable to load application.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadApplication();
  }, [accessToken, id]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!accessToken || !id) {
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await updateApplication(
        accessToken,
        id,
        formStateToUpdateInput(form),
      );

      navigate(`/applications/${id}`);
    } catch {
      setError('Unable to update application.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="state-card" role="status">Loading application...</div>;
  }

  if (error && !hasApplication) {
    return <div className="state-card state-error" role="alert">{error}</div>;
  }

  return (
    <main className="page page-narrow">
      <header className="page-header"><div><p className="eyebrow">Applications</p><h1>Edit application</h1><p>Update opportunity details and pipeline status.</p></div></header>

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
          onClick={() => navigate(`/applications/${id}`)}
          disabled={isSubmitting}
        >
          Cancel
        </button>

        <button className="button button-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save changes'}
        </button>
        </div>
      </form>
    </main>
  );
}
