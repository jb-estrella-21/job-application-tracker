import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type CalendarWeekStart = 'sunday' | 'monday';

const CALENDAR_WEEK_START_KEY = 'job-app-tracker.calendar-week-start';
const DEFAULT_CALENDAR_WEEK_START: CalendarWeekStart = 'sunday';

type SettingsContextValue = {
  calendarWeekStart: CalendarWeekStart;
  updateCalendarWeekStart: (weekStart: CalendarWeekStart) => void;
  persistenceError: string;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

function parseCalendarWeekStart(value: string | null): CalendarWeekStart {
  return value === 'monday' ? 'monday' : DEFAULT_CALENDAR_WEEK_START;
}

function readCalendarWeekStart(): CalendarWeekStart {
  try {
    return parseCalendarWeekStart(window.localStorage.getItem(CALENDAR_WEEK_START_KEY));
  } catch {
    return DEFAULT_CALENDAR_WEEK_START;
  }
}

type SettingsProviderProps = {
  children: ReactNode;
};

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [calendarWeekStart, setCalendarWeekStart] = useState(readCalendarWeekStart);
  const [persistenceError, setPersistenceError] = useState('');

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === CALENDAR_WEEK_START_KEY || event.key === null) {
        setCalendarWeekStart(parseCalendarWeekStart(event.newValue));
      }
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  function updateCalendarWeekStart(weekStart: CalendarWeekStart) {
    setCalendarWeekStart(weekStart);

    try {
      window.localStorage.setItem(CALENDAR_WEEK_START_KEY, weekStart);
      setPersistenceError('');
    } catch {
      setPersistenceError(
        'This preference could not be saved in this browser. It will reset when you leave.',
      );
    }
  }

  return (
    <SettingsContext.Provider
      value={{ calendarWeekStart, updateCalendarWeekStart, persistenceError }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

// This hook intentionally shares the context module with its provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useSettings must be used inside SettingsProvider');
  }

  return context;
}
