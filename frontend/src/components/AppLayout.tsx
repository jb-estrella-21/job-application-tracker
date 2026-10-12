import { useEffect, useRef, useState } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '../features/auth/AuthContext';

const SIDEBAR_COLLAPSED_KEY = 'job-app-tracker.sidebar-collapsed';

function readSidebarCollapsedPreference() {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function getAvatarInitials(email: string | undefined) {
  if (!email) {
    return 'U';
  }

  const localPart = email.split('@')[0] ?? email;
  const parts = localPart.split(/[._+-]+/).filter(Boolean);

  if (parts.length > 1) {
    return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }

  return localPart.slice(0, 2).toUpperCase() || 'U';
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    readSidebarCollapsedPreference,
  );
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const mobileNavigationButtonRef = useRef<HTMLButtonElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const accountIdentity = user?.email ?? 'Account';

  useEffect(() => {
    function handleSidebarStorage(event: StorageEvent) {
      if (event.key === SIDEBAR_COLLAPSED_KEY || event.key === null) {
        setIsSidebarCollapsed(
          event.key === null ? false : event.newValue === 'true',
        );
      }
    }

    window.addEventListener('storage', handleSidebarStorage);
    return () => window.removeEventListener('storage', handleSidebarStorage);
  }, []);

  useEffect(() => {
    if (!isAccountMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsAccountMenuOpen(false);
        accountButtonRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAccountMenuOpen]);

  useEffect(() => {
    if (!isMobileNavigationOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMobileNavigationOpen(false);
        mobileNavigationButtonRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileNavigationOpen]);

  async function handleLogout() {
    setIsAccountMenuOpen(false);
    setIsMobileNavigationOpen(false);
    await logout();
    navigate('/login');
  }

  function closeMobileNavigation() {
    if (!isMobileNavigationOpen) {
      return;
    }

    setIsMobileNavigationOpen(false);
    mobileNavigationButtonRef.current?.focus();
  }

  function toggleSidebar() {
    const nextCollapsed = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextCollapsed);

    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(nextCollapsed));
    } catch {
      // Keep the control usable if browser storage is unavailable.
    }
  }

  const shellClassName = `app-shell${isSidebarCollapsed ? ' sidebar-is-collapsed' : ''}`;
  const sidebarClassName = [
    'sidebar',
    isMobileNavigationOpen && 'sidebar-open',
    isSidebarCollapsed && 'sidebar-collapsed',
  ].filter(Boolean).join(' ');

  return (
    <div className={shellClassName}>
      <aside className={sidebarClassName}>
        <div className="brand">
          <img
            className="brand-mark"
            src="/brand/h3a-symbol-reversed.svg"
            alt=""
            aria-hidden="true"
          />
          <div className="brand-copy">
            <strong>Track Thy Path</strong>
          </div>
        </div>

        <nav className="sidebar-nav" id="primary-navigation" aria-label="Primary navigation">
          <NavLink to="/dashboard" onClick={closeMobileNavigation} title={isSidebarCollapsed ? 'Dashboard' : undefined}>
            <svg className="sidebar-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
              <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
              <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
              <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
            </svg>
            <span className="sidebar-nav-label">Dashboard</span>
          </NavLink>
          <NavLink to="/applications" onClick={closeMobileNavigation} title={isSidebarCollapsed ? 'Applications' : undefined}>
            <svg className="sidebar-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="4" y="5" width="16" height="15" rx="2" />
              <path d="M9 5V3.5h6V5M8 10h8M8 14h8" />
            </svg>
            <span className="sidebar-nav-label">Applications</span>
          </NavLink>
          <NavLink to="/calendar" onClick={closeMobileNavigation} title={isSidebarCollapsed ? 'Calendar' : undefined}>
            <svg className="sidebar-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3.5" y="5" width="17" height="16" rx="2" />
              <path d="M7.5 3.5v3M16.5 3.5v3M3.5 9h17M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01" />
            </svg>
            <span className="sidebar-nav-label">Calendar</span>
          </NavLink>
          <NavLink to="/settings" onClick={closeMobileNavigation} title={isSidebarCollapsed ? 'Settings' : undefined}>
            <svg className="sidebar-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 6h5m4 0h7M4 12h9m4 0h3M4 18h2m4 0h10" />
              <circle cx="11" cy="6" r="2" />
              <circle cx="15" cy="12" r="2" />
              <circle cx="8" cy="18" r="2" />
            </svg>
            <span className="sidebar-nav-label">Settings</span>
          </NavLink>
        </nav>

        <Link
          className="sidebar-add-action"
          to="/applications/new"
          onClick={closeMobileNavigation}
          title={isSidebarCollapsed ? 'Add Application' : undefined}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="sidebar-add-label">Add Application</span>
        </Link>

        <div className="sidebar-footer">
          <button
            className="sidebar-collapse-toggle"
            type="button"
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-controls="primary-navigation"
            aria-expanded={!isSidebarCollapsed}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={toggleSidebar}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {isSidebarCollapsed ? (
                <path d="m9 18 6-6-6-6" />
              ) : (
                <path d="m15 18-6-6 6-6" />
              )}
            </svg>
            <span className="sidebar-collapse-label">
              {isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </span>
          </button>
        </div>
      </aside>

      <header className="app-header">
        <button
          ref={mobileNavigationButtonRef}
          className="mobile-menu-toggle"
          type="button"
          aria-label={isMobileNavigationOpen ? 'Close navigation' : 'Open navigation'}
          aria-controls="primary-navigation"
          aria-expanded={isMobileNavigationOpen}
          onClick={() => {
            setIsMobileNavigationOpen((isOpen) => !isOpen);
            setIsAccountMenuOpen(false);
          }}
        >
          {isMobileNavigationOpen ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>

        <div className="mobile-brand">
          <img src="/brand/h3a-symbol-evergreen.svg" alt="" aria-hidden="true" />
          <span>Track Thy Path</span>
        </div>

        <div className="account-menu" ref={accountMenuRef}>
          <button
            ref={accountButtonRef}
            className="account-trigger"
            type="button"
            aria-label={`Account: ${accountIdentity}`}
            aria-controls={isAccountMenuOpen ? 'account-menu-panel' : undefined}
            aria-expanded={isAccountMenuOpen}
            onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
          >
            <span className="account-avatar" aria-hidden="true">
              {getAvatarInitials(user?.email)}
            </span>
            <span className="account-name" title={accountIdentity}>
              {accountIdentity}
            </span>
            <svg className="account-chevron" viewBox="0 0 20 20" aria-hidden="true">
              <path d="m5 7.5 5 5 5-5" />
            </svg>
          </button>

          {isAccountMenuOpen && (
            <div className="account-menu-panel" id="account-menu-panel">
              <div className="account-menu-identity">
                <span>Signed in as</span>
                <strong>{accountIdentity}</strong>
              </div>
              <button
                type="button"
                className="button button-secondary button-full"
                onClick={() => void handleLogout()}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="content-shell">
        <Outlet />
      </div>
    </div>
  );
}
