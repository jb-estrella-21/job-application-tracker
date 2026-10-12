import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { ApplicationsQuery } from '../../types/application';

export type ThemePreference = 'light' | 'dark' | 'system';
export type CalendarWeekStart = 'sunday' | 'monday';
export type ApplicationSort = NonNullable<ApplicationsQuery['sort']>;
export type ApplicationSortOrder = NonNullable<ApplicationsQuery['order']>;

const THEME_KEY = 'job-app-tracker.theme';
const CALENDAR_WEEK_START_KEY = 'job-app-tracker.calendar-week-start';
const APPLICATION_SORT_KEY = 'job-app-tracker.applications-sort';
const APPLICATION_ORDER_KEY = 'job-app-tracker.applications-order';

const DEFAULT_THEME: ThemePreference = 'system';
const DEFAULT_CALENDAR_WEEK_START: CalendarWeekStart = 'sunday';
const DEFAULT_APPLICATION_SORT: ApplicationSort = 'updatedAt';
const DEFAULT_APPLICATION_ORDER: ApplicationSortOrder = 'desc';

const APPLICATION_SORTS: readonly ApplicationSort[] = [
  'createdAt',
  'updatedAt',
  'applicationDate',
  'companyName',
  'positionTitle',
];

type SettingsContextValue = {
  themePreference: ThemePreference;
  updateThemePreference: (theme: ThemePreference) => void;
  calendarWeekStart: CalendarWeekStart;
  updateCalendarWeekStart: (weekStart: CalendarWeekStart) => void;
  applicationSort: ApplicationSort;
  updateApplicationSort: (sort: ApplicationSort) => void;
  applicationSortOrder: ApplicationSortOrder;
  updateApplicationSortOrder: (order: ApplicationSortOrder) => void;
  persistenceError: string;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

function readStoredValue(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parseTheme(value: string | null): ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
    ? value
    : DEFAULT_THEME;
}

function parseCalendarWeekStart(value: string | null): CalendarWeekStart {
  return value === 'monday' ? 'monday' : DEFAULT_CALENDAR_WEEK_START;
}

function parseApplicationSort(value: string | null): ApplicationSort {
  return APPLICATION_SORTS.includes(value as ApplicationSort)
    ? (value as ApplicationSort)
    : DEFAULT_APPLICATION_SORT;
}

function parseApplicationSortOrder(value: string | null): ApplicationSortOrder {
  return value === 'asc' || value === 'desc'
    ? value
    : DEFAULT_APPLICATION_ORDER;
}

function getSystemPrefersDark() {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
}

type SettingsProviderProps = {
  children: ReactNode;
};

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [themePreference, setThemePreference] = useState(() =>
    parseTheme(readStoredValue(THEME_KEY)),
  );
  const [systemPrefersDark, setSystemPrefersDark] = useState(getSystemPrefersDark);
  const [calendarWeekStart, setCalendarWeekStart] = useState(() =>
    parseCalendarWeekStart(readStoredValue(CALENDAR_WEEK_START_KEY)),
  );
  const [applicationSort, setApplicationSort] = useState(() =>
    parseApplicationSort(readStoredValue(APPLICATION_SORT_KEY)),
  );
  const [applicationSortOrder, setApplicationSortOrder] = useState(() =>
    parseApplicationSortOrder(readStoredValue(APPLICATION_ORDER_KEY)),
  );
  const [persistenceError, setPersistenceError] = useState('');

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mediaQuery) {
      return;
    }

    function handleSystemThemeChange(event: MediaQueryListEvent) {
      setSystemPrefersDark(event.matches);
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  useEffect(() => {
    const resolvedTheme = themePreference === 'system'
      ? (systemPrefersDark ? 'dark' : 'light')
      : themePreference;
    document.documentElement.dataset.theme = resolvedTheme;
  }, [themePreference, systemPrefersDark]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === THEME_KEY || event.key === null) {
        setThemePreference(parseTheme(event.key === null ? null : event.newValue));
      }
      if (event.key === CALENDAR_WEEK_START_KEY || event.key === null) {
        setCalendarWeekStart(
          parseCalendarWeekStart(event.key === null ? null : event.newValue),
        );
      }
      if (event.key === APPLICATION_SORT_KEY || event.key === null) {
        setApplicationSort(
          parseApplicationSort(event.key === null ? null : event.newValue),
        );
      }
      if (event.key === APPLICATION_ORDER_KEY || event.key === null) {
        setApplicationSortOrder(
          parseApplicationSortOrder(event.key === null ? null : event.newValue),
        );
      }
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  function savePreference(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
      setPersistenceError('');
    } catch {
      setPersistenceError(
        'A preference could not be saved in this browser. It will reset when you leave.',
      );
    }
  }

  function updateThemePreference(theme: ThemePreference) {
    setThemePreference(theme);
    savePreference(THEME_KEY, theme);
  }

  function updateCalendarWeekStart(weekStart: CalendarWeekStart) {
    setCalendarWeekStart(weekStart);
    savePreference(CALENDAR_WEEK_START_KEY, weekStart);
  }

  function updateApplicationSort(sort: ApplicationSort) {
    setApplicationSort(sort);
    savePreference(APPLICATION_SORT_KEY, sort);
  }

  function updateApplicationSortOrder(order: ApplicationSortOrder) {
    setApplicationSortOrder(order);
    savePreference(APPLICATION_ORDER_KEY, order);
  }

  return (
    <SettingsContext.Provider
      value={{
        themePreference,
        updateThemePreference,
        calendarWeekStart,
        updateCalendarWeekStart,
        applicationSort,
        updateApplicationSort,
        applicationSortOrder,
        updateApplicationSortOrder,
        persistenceError,
      }}
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
