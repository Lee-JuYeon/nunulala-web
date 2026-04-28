import type { AuthState, User } from './types/models';

const STORAGE_KEY = 'nunulala_auth';

let _state: AuthState | null = loadFromStorage();

function loadFromStorage(): AuthState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthState;
  } catch {
    return null;
  }
}

function saveToStorage(state: AuthState | null): void {
  if (state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function getAccessToken(): string | null {
  return _state?.access_token ?? null;
}

export function getRefreshToken(): string | null {
  return _state?.refresh_token ?? null;
}

export function getAuthUser(): User | null {
  return _state?.user ?? null;
}

export function isLoggedIn(): boolean {
  return _state !== null;
}

export function setAuth(state: AuthState): void {
  _state = state;
  saveToStorage(state);
  window.dispatchEvent(new CustomEvent('authchange', { detail: state }));
}

export function clearAuth(): void {
  _state = null;
  saveToStorage(null);
  window.dispatchEvent(new CustomEvent('authchange', { detail: null }));
}

export async function refreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const data = (await res.json()) as { success: boolean; data?: AuthState };
    if (data.success && data.data) {
      setAuth(data.data);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function initGoogleAuth(
  clientId: string,
  onCredential: (token: string) => void
): void {
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.onload = () => {
    window.google?.accounts.id.initialize({
      client_id: clientId,
      callback: (response: { credential: string }) => {
        onCredential(response.credential);
      },
    });
  };
  document.head.appendChild(script);
}

export function renderGoogleButton(containerId: string): void {
  window.google?.accounts.id.renderButton(
    document.getElementById(containerId)!,
    {
      theme: 'outline',
      size: 'large',
      width: 320,
      text: 'signin_with',
      shape: 'rectangular',
    }
  );
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (r: { credential: string }) => void;
          }) => void;
          renderButton: (
            el: HTMLElement,
            opts: {
              theme?: string;
              size?: string;
              width?: number;
              text?: string;
              shape?: string;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}
