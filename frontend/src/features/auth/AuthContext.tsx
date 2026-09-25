import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import type { LoginResponse, User } from '../../types/auth';
import { getCurrentUser, logoutFromServer } from './api';
import {
  endSession,
  establishSession,
  getSessionVersion,
  isCurrentSession,
  refreshAccessToken,
  subscribeToSession,
} from './session';

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  login: (response: LoginResponse) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [auth, setAuth] = useState<LoginResponse | null>(null);
  const [status, setStatus] = useState<AuthStatus>('checking');

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeToSession({
      onAccessTokenChange: (accessToken) => {
        if (!active) {
          return;
        }

        setAuth((currentAuth) => {
          if (!currentAuth || !accessToken) {
            return accessToken ? currentAuth : null;
          }

          return { ...currentAuth, accessToken };
        });
      },
      onSessionEnded: () => {
        if (active) {
          setAuth(null);
          setStatus('unauthenticated');
        }
      },
    });

    async function restoreSession() {
      const restoreVersion = getSessionVersion();
      const restoredAccessToken = await refreshAccessToken();

      if (!active || !isCurrentSession(restoreVersion) || !restoredAccessToken) {
        if (active && isCurrentSession(restoreVersion)) {
          setAuth(null);
          setStatus('unauthenticated');
        }
        return;
      }

      try {
        const user = await getCurrentUser(restoredAccessToken);

        if (!active || !isCurrentSession(restoreVersion)) {
          return;
        }

        setAuth({ user, accessToken: restoredAccessToken });
        setStatus('authenticated');
      } catch {
        if (active && isCurrentSession(restoreVersion)) {
          endSession();
        }
      }
    }

    void restoreSession();

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  function login(response: LoginResponse) {
    establishSession(response.accessToken);
    setAuth(response);
    setStatus('authenticated');
  }

  async function logout() {
    endSession();
    setAuth(null);
    setStatus('unauthenticated');

    try {
      await logoutFromServer();
    } catch {
      // Local logout is intentionally final even when the network request fails.
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user: auth?.user ?? null,
        accessToken: auth?.accessToken ?? null,
        status,
        isAuthenticated: status === 'authenticated',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// This hook intentionally shares the context module with its provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
