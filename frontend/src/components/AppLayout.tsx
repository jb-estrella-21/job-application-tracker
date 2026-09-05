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
    <div>
      <header>
        <strong>Job Application Tracker</strong>

        <nav>
          <NavLink to="/dashboard">
            Dashboard
          </NavLink>

          {' | '}

          <NavLink to="/applications">
            Applications
          </NavLink>
        </nav>

        <div>
          <span>{user?.email}</span>{' '}

          <button
            type="button"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </header>

      <Outlet />
    </div>
  );
}