import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsProvider, useSettings } from './SettingsContext';

function SettingsProbe() {
  const { themePreference } = useSettings();
  return <output aria-label="Theme preference">{themePreference}</output>;
}

function createMediaQuery(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  const mediaQuery = {
    get matches() {
      return matches;
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
      if (typeof listener === 'function') {
        listeners.add(listener as (event: MediaQueryListEvent) => void);
      }
    },
    removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
      if (typeof listener === 'function') {
        listeners.delete(listener as (event: MediaQueryListEvent) => void);
      }
    },
    addListener: (listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
    removeListener: (listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
    dispatchEvent: () => true,
    update(nextMatches: boolean) {
      matches = nextMatches;
      const event = { matches, media: this.media } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };

  return mediaQuery as unknown as MediaQueryList & { update: (matches: boolean) => void };
}

describe('SettingsProvider theme behavior', () => {
  let originalMatchMedia: PropertyDescriptor | undefined;

  beforeEach(() => {
    localStorage.clear();
    originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    document.documentElement.dataset.theme = '';
  });

  afterEach(() => {
    if (originalMatchMedia) {
      Object.defineProperty(window, 'matchMedia', originalMatchMedia);
    } else {
      Reflect.deleteProperty(window, 'matchMedia');
    }
  });

  it('defaults to System and follows operating-system theme changes', async () => {
    const mediaQuery = createMediaQuery(false);
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn(() => mediaQuery) });

    render(
      <SettingsProvider>
        <SettingsProbe />
      </SettingsProvider>,
    );

    expect(screen.getByLabelText('Theme preference')).toHaveTextContent('system');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');

    act(() => mediaQuery.update(true));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('uses explicit themes instead of later operating-system changes', () => {
    const mediaQuery = createMediaQuery(true);
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn(() => mediaQuery) });
    localStorage.setItem('job-app-tracker.theme', 'light');

    render(
      <SettingsProvider>
        <SettingsProbe />
      </SettingsProvider>,
    );

    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    act(() => mediaQuery.update(false));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });

  it('synchronizes a theme change from another tab', () => {
    const mediaQuery = createMediaQuery(false);
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn(() => mediaQuery) });

    render(
      <SettingsProvider>
        <SettingsProbe />
      </SettingsProvider>,
    );

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'job-app-tracker.theme',
        newValue: 'dark',
      }));
    });

    expect(screen.getByLabelText('Theme preference')).toHaveTextContent('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });
});
