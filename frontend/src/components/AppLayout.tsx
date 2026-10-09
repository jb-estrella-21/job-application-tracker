import {
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '../features/auth/AuthContext';

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-mark" src="/brand/h3a-symbol-reversed.svg" alt="" aria-hidden="true" />
          <div className="brand-copy">
            <strong>Track Thy Path</strong>
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
