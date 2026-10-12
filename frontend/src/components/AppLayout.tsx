import { useEffect, useRef, useState } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '../features/auth/AuthContext';

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
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const mobileNavigationButtonRef = useRef<HTMLButtonElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const accountIdentity = user?.email ?? 'Account';

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

  return (
    <div className="app-shell">
      <aside className={`sidebar${isMobileNavigationOpen ? ' sidebar-open' : ''}`}>
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
          <NavLink to="/dashboard" onClick={closeMobileNavigation}>
            Dashboard
          </NavLink>
          <NavLink to="/applications" onClick={closeMobileNavigation}>
            Applications
          </NavLink>
          <NavLink to="/calendar" onClick={closeMobileNavigation}>
            Calendar
          </NavLink>
          <NavLink to="/settings" onClick={closeMobileNavigation}>
            Settings
          </NavLink>
        </nav>

        <Link
          className="sidebar-add-action"
          to="/applications/new"
          onClick={closeMobileNavigation}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Add Application</span>
        </Link>
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
