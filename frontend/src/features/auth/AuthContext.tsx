import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';

import type { LoginResponse, User } from '../../types/auth';

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (response: LoginResponse) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [auth, setAuth] = useState<LoginResponse | null>(null);

  function login(response: LoginResponse) {
    setAuth(response);
  }

  function logout() {
    setAuth(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user: auth?.user ?? null,
        accessToken: auth?.accessToken ?? null,
        isAuthenticated: auth !== null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}