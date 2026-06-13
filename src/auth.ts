import type { AuthState, User } from './types/models';

// SEC-14: 토큰을 localStorage 에 저장하지 않는다. access token 은 메모리에만,
// refresh token 은 API 가 발급한 HttpOnly 쿠키(nunulala_rt)에만 존재한다(JS 접근 불가).
let _state: AuthState | null = null;

/** 구버전 클라이언트가 남긴 localStorage 토큰 블롭을 방어적으로 제거. 부팅 시 1회 호출. */
export function initAuth(): void {
  try {
    localStorage.removeItem('nunulala_auth');
  } catch {
    /* noop */
  }
}

export function getAccessToken(): string | null {
  return _state?.access_token ?? null;
}

export function getAuthUser(): User | null {
  return _state?.user ?? null;
}

export function isLoggedIn(): boolean {
  return _state !== null;
}

export function setAuth(state: AuthState): void {
  _state = state;
  window.dispatchEvent(new CustomEvent('authchange', { detail: state }));
}

export function clearAuth(): void {
  _state = null;
  window.dispatchEvent(new CustomEvent('authchange', { detail: null }));
}

// [재감사] 동시 401이 각각 refresh를 호출하면 회전 refresh 토큰이 중복 사용되어
// 서버의 reuse-detection이 정상 세션을 폐기(self-DoS)한다. in-flight Promise 싱글톤으로
// 동시 호출을 하나로 합치고, settle 시 초기화한다.
let _refreshInFlight: Promise<boolean> | null = null;

export function refreshTokens(): Promise<boolean> {
  if (_refreshInFlight) return _refreshInFlight;
  _refreshInFlight = doRefresh().finally(() => {
    _refreshInFlight = null;
  });
  return _refreshInFlight;
}

async function doRefresh(): Promise<boolean> {
  try {
    // refresh token 은 HttpOnly 쿠키로 전송된다(credentials:'include'). 본문은 비움.
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    const data = (await res.json()) as {
      success: boolean;
      data?: { user: User; accessToken: string };
    };
    if (data.success && data.data) {
      // refresh_token 은 쿠키에만 존재 → AuthState 형태 유지를 위해 빈 문자열로 보관.
      setAuth({
        user: data.data.user,
        access_token: data.data.accessToken,
        refresh_token: '',
      });
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
