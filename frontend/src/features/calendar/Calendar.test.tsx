import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { JobApplication } from '../../types/application';
import { SettingsProvider } from '../settings/SettingsContext';
import { Calendar } from './Calendar';
import { getCalendarApplications } from './api';

const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock('../auth/AuthContext', () => ({ useAuth }));
vi.mock('./api', () => ({ getCalendarApplications: vi.fn() }));

function makeApplication(overrides: Partial<JobApplication> = {}): JobApplication {
  return {
    id: 'application-1',
    userId: 'user-1',
    companyName: 'Acme Systems',
    positionTitle: 'Product Designer',
    jobPostingUrl: null,
    applicationDate: '2026-10-12T00:00:00.000Z',
    status: 'INTERVIEW',
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    salaryPeriod: null,
    location: null,
    applicationSource: null,
    recruiterName: null,
    recruiterEmail: null,
    recruiterPhone: null,
    notes: null,
    employmentStatus: null,
    employmentEndedAt: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderCalendar() {
  return render(
    <MemoryRouter initialEntries={['/calendar']}>
      <SettingsProvider>
        <Routes>
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/applications/:id" element={<p>Application detail page</p>} />
        </Routes>
      </SettingsProvider>
    </MemoryRouter>,
  );
}

describe('Calendar', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 9, 12, 12));
    useAuth.mockReturnValue({ accessToken: 'access-token' });
    vi.mocked(getCalendarApplications).mockReset();
    vi.mocked(getCalendarApplications).mockResolvedValue([]);
  });

  afterEach(() => vi.useRealTimers());

  it('places saved application dates on their date-only calendar day', async () => {
    vi.mocked(getCalendarApplications).mockResolvedValue([makeApplication()]);

    renderCalendar();

    const event = await screen.findByText('Acme Systems');
    expect(screen.getByRole('heading', { name: 'October 2026' })).toBeInTheDocument();
    expect(event.closest('li')).toHaveTextContent('Application date');
    expect(event.closest('li')).toHaveTextContent('Product Designer');
    expect(event.closest('li')).toHaveTextContent('Interview');
    expect(document.querySelector('time[datetime="2026-10-12"]')).toHaveAttribute(
      'aria-current',
      'date',
    );
  });

  it('navigates between months and returns to the current month with Today', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderCalendar();

    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('heading', { name: 'November 2026' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByRole('heading', { name: 'October 2026' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByRole('heading', { name: 'September 2026' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Today' }));
    expect(screen.getByRole('heading', { name: 'October 2026' })).toBeInTheDocument();
  });

  it('ignores applications without a valid date and explains an empty month', async () => {
    vi.mocked(getCalendarApplications).mockResolvedValue([
      makeApplication({ id: 'undated', applicationDate: null }),
      makeApplication({ id: 'invalid', applicationDate: '2026-02-30' }),
    ]);

    renderCalendar();

    expect(await screen.findByText(/no application dates this month/i)).toBeInTheDocument();
    expect(screen.queryByText('Acme Systems')).not.toBeInTheDocument();
  });

  it('shows a retry action after an API error', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.mocked(getCalendarApplications)
      .mockRejectedValueOnce(new Error('request failed'))
      .mockResolvedValueOnce([makeApplication()]);

    renderCalendar();

    expect(await screen.findByRole('alert')).toHaveTextContent(/unable to load calendar/i);
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Acme Systems')).toBeInTheDocument();
    await waitFor(() => expect(getCalendarApplications).toHaveBeenCalledTimes(2));
  });

  it('opens the linked application detail page when an event is selected', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.mocked(getCalendarApplications).mockResolvedValue([makeApplication()]);

    renderCalendar();
    await user.click(await screen.findByRole('link', { name: /acme systems.*application date/i }));

    expect(screen.getByText('Application detail page')).toBeInTheDocument();
  });

  it('filters visible calendar events by application status', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.mocked(getCalendarApplications).mockResolvedValue([
      makeApplication(),
      makeApplication({
        id: 'application-2',
        companyName: 'Northwind Labs',
        positionTitle: 'Engineer',
        status: 'APPLIED',
      }),
    ]);

    renderCalendar();
    await screen.findByText('Northwind Labs');
    await user.selectOptions(screen.getByLabelText('Filter by status'), 'INTERVIEW');

    expect(screen.getByText('Acme Systems')).toBeInTheDocument();
    expect(screen.queryByText('Northwind Labs')).not.toBeInTheDocument();
  });

  it('uses the saved week-start preference for weekday order and date placement', async () => {
    localStorage.setItem('job-app-tracker.calendar-week-start', 'monday');

    renderCalendar();

    expect((await screen.findAllByRole('columnheader')).map((header) => header.textContent)).toEqual([
      'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
    ]);
    expect(document.querySelector('time[datetime="2026-10-01"]')?.closest('td')).toHaveProperty(
      'cellIndex',
      3,
    );
  });
});
