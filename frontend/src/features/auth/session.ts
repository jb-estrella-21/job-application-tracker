const API_URL = import.meta.env.VITE_API_URL;

type SessionListener = {
  onAccessTokenChange: (accessToken: string | null) => void;
  onSessionEnded: () => void;
};

let accessToken: string | null = null;
let lifecycleVersion = 0;
let refreshPromise: Promise<string | null> | null = null;
const listeners = new Set<SessionListener>();

function publishAccessToken() {
  listeners.forEach((listener) => {
    listener.onAccessTokenChange(accessToken);
  });
}

function publishSessionEnded() {
  listeners.forEach((listener) => {
    listener.onSessionEnded();
  });
}

function isAccessTokenResponse(value: unknown): value is { accessToken: string } {
  return Boolean(
    value
      && typeof value === 'object'
      && 'accessToken' in value
      && typeof value.accessToken === 'string'
      && value.accessToken.length > 0,
  );
}

export function subscribeToSession(listener: SessionListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getAccessToken() {
  return accessToken;
}

export function getSessionVersion() {
  return lifecycleVersion;
}

export function isCurrentSession(version: number) {
  return version === lifecycleVersion;
}

export function establishSession(nextAccessToken: string) {
  lifecycleVersion += 1;
  accessToken = nextAccessToken;
  publishAccessToken();
}

export function endSession() {
  lifecycleVersion += 1;
  accessToken = null;
  publishAccessToken();
  publishSessionEnded();
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshVersion = lifecycleVersion;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      const data: unknown = await response.json().catch(() => null);

      if (!response.ok || !isAccessTokenResponse(data)) {
        throw new Error('Refresh session was rejected.');
      }

      if (!isCurrentSession(refreshVersion)) {
        return null;
      }

      accessToken = data.accessToken;
      publishAccessToken();
      return accessToken;
    } catch {
      if (isCurrentSession(refreshVersion)) {
        endSession();
      }

      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
