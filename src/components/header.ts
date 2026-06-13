import { isLoggedIn, getAuthUser, clearAuth } from '../auth';
import { api } from '../api';
import { navigate } from '../router';

function getCurrentPath(): string {
  return window.location.pathname.replace(/^\/app/, '') || '/';
}

export function renderHeader(containerId: string): void {
  const container = document.getElementById(containerId);
  if (!container) return;

  const update = (): void => {
    const loggedIn = isLoggedIn();
    const user = getAuthUser();
    const path = getCurrentPath();

    container.innerHTML = `
      <a class="app-header-logo" href="/app">nunulala</a>
      <nav class="app-header-nav">
        <a href="/app" class="${path === '/' ? 'active' : ''}">장소 탐색</a>
        <a href="/app/planner" class="${path === '/planner' ? 'active' : ''}">AI 플래너</a>
        <a href="/app/schedule" class="${path === '/schedule' ? 'active' : ''}">일정</a>
        <a href="/app/profile" class="${path === '/profile' ? 'active' : ''}">마이페이지</a>
      </nav>
      <div class="app-header-actions">
        ${loggedIn && user
          ? `<button id="header-logout-btn" class="btn btn-outline btn-sm">로그아웃</button>`
          : `<a href="/app/login" class="btn btn-primary btn-sm">로그인</a>`
        }
      </div>
    `;

    document.getElementById('header-logout-btn')?.addEventListener('click', async () => {
      // SEC-14: 서버가 HttpOnly 쿠키를 지우고 refresh 세션을 폐기하도록 호출.
      await api.authLogout().catch(() => {});
      clearAuth();
      navigate('/app', true);
    });
  };

  update();
  window.addEventListener('authchange', update);
  window.addEventListener('popstate', update);
}
