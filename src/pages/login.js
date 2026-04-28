import { api } from '../api';
import { setAuth, isLoggedIn, initGoogleAuth, renderGoogleButton } from '../auth';
import { navigate } from '../router';
import { showToast } from '../components/toast';
const GOOGLE_CLIENT_ID = import.meta.env['VITE_GOOGLE_CLIENT_ID'];
export async function renderLogin() {
    const content = document.getElementById('app-content');
    if (!content)
        return;
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

        ${GOOGLE_CLIENT_ID
        ? `<div id="google-btn-container"></div>`
        : `
            <button class="btn-google" id="google-signin-btn">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google로 로그인
            </button>
          `}

        <div class="login-terms">
          로그인하면 <a href="#">이용약관</a> 및 <a href="#">개인정보처리방침</a>에 동의하는 것으로 간주됩니다.
        </div>
      </div>
    </div>
  `;
    if (GOOGLE_CLIENT_ID) {
        initGoogleAuth(GOOGLE_CLIENT_ID, handleGoogleToken);
        setTimeout(() => renderGoogleButton('google-btn-container'), 500);
    }
    else {
        document.getElementById('google-signin-btn')?.addEventListener('click', () => {
            showToast('Google 로그인 설정이 필요합니다 (VITE_GOOGLE_CLIENT_ID)', 'error');
        });
    }
}
async function handleGoogleToken(token) {
    const res = await api.authToken('google', token);
    if (!res.success) {
        showToast('로그인에 실패했어요. 다시 시도해주세요.', 'error');
        return;
    }
    setAuth(res.data);
    showToast('로그인됐어요! 환영합니다 🎉', 'success');
    navigate('/app', true);
}
