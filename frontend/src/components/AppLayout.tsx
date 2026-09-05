import {
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '../features/auth/AuthContext';

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">JT</span>
          <div>
            <strong>Job Tracker</strong>
            <span>Application workspace</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          <NavLink to="/dashboard">
            Dashboard
          </NavLink>
          <NavLink to="/applications">
            Applications
          </NavLink>
        </nav>

        <div className="sidebar-account">
          <span className="account-label">Signed in as</span>
          <span className="account-email">{user?.email}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="button button-secondary button-full"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="content-shell">
        <Outlet />
      </div>
    </div>
  );
}
