import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { NewApplicationPage } from './pages/NewApplicationPage';
import { ApplicationDetailPage } from './pages/ApplicationDetailPage';
import { EditApplicationPage } from './pages/EditApplicationPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/applications"
            element={<ApplicationsPage />}
          />

          <Route
            path="/applications/new"
            element={<NewApplicationPage />}
          />

          <Route
            path="/applications/:id"
            element={<ApplicationDetailPage />}
          />

          <Route
            path="/applications/:id/edit"
            element={<EditApplicationPage />}
          />
        </Route>
      </Route>

      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}

export default App;