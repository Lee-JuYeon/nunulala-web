import { isLoggedIn } from '../auth';
import { navigate } from '../router';

export function renderLogin(): void {
  const content = document.getElementById('app-content');
  if (!content) return;

  if (isLoggedIn()) {
    navigate('/app', true);
    return;
  }

  content.innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <div class="login-logo">nunulala</div>
        <div class="login-subtitle">
          서울의 숨겨진 명소를 발견하고<br>
          나만의 여행 일정을 만들어보세요
        </div>

        <div class="login-coming-soon">
          <div class="login-coming-icon">🔐</div>
          <div class="login-coming-title">로그인 기능 준비 중</div>
          <div class="login-coming-desc">
            현재 로그인 기능을 준비하고 있어요.<br>
            로그인 없이도 장소를 탐색할 수 있어요.
          </div>
        </div>

        <a href="/app" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:var(--space-4);">
          장소 탐색하기
        </a>

        <div class="login-terms">
          <a href="#">이용약관</a> · <a href="#">개인정보처리방침</a>
        </div>
      </div>
    </div>
  `;
}
