import { Navigate } from 'react-router-dom';
import { useState } from 'react';

import { LoginForm } from '../features/auth/LoginForm';
import { RegisterForm } from '../features/auth/RegisterForm';
import { useAuth } from '../features/auth/AuthContext';

export function LoginPage() {
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="auth-page">
      {mode === 'login' ? (
        <LoginForm
          initialEmail={registeredEmail}
          successMessage={successMessage}
          onCreateAccount={() => {
            setSuccessMessage('');
            setMode('register');
          }}
        />
      ) : (
        <RegisterForm
          onRegistered={(email) => {
            setRegisteredEmail(email);
            setSuccessMessage('Account created successfully. You can now sign in.');
            setMode('login');
          }}
          onSignIn={() => setMode('login')}
        />
      )}
    </main>
  );
}
