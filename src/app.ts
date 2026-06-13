import './styles/reset.css';
import './styles/variables.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/app.css';

import { renderHeader } from './components/header';
import { initAuth, refreshTokens } from './auth';
import { route, initRouter } from './router';
import { renderPlaces } from './pages/places';
import { renderPlaceDetail } from './pages/place-detail';
import { renderSchedule } from './pages/schedule';
import { renderProfile } from './pages/profile';
import { renderLogin } from './pages/login';
import { renderPlanner } from './pages/planner';

document.addEventListener('DOMContentLoaded', () => {
  // SEC-14: 구버전 localStorage 토큰 제거 + HttpOnly 쿠키로 세션 무음 복원.
  initAuth();
  void refreshTokens();

  renderHeader('app-header');

  route('/', renderPlaces);
  route('/planner', renderPlanner);
  route('/places/:uid', renderPlaceDetail);
  route('/schedule', renderSchedule);
  route('/profile', renderProfile);
  route('/login', renderLogin);

  initRouter();
});
