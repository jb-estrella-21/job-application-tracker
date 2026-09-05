import { Navigate } from 'react-router-dom';

import { LoginForm } from '../features/auth/LoginForm';
import { useAuth } from '../features/auth/AuthContext';

export function LoginPage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginForm />;
}