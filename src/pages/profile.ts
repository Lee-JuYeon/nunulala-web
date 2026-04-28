import { api } from '../api';
import { isLoggedIn, getAuthUser } from '../auth';
import { navigate } from '../router';
import { renderPlaceCard, attachPlaceCardEvents } from '../components/place-card';
import { renderReviewCard, attachReviewCardEvents } from '../components/review-card';
import { showToast } from '../components/toast';

export async function renderProfile(): Promise<void> {
  const content = document.getElementById('app-content');
  if (!content) return;

  if (!isLoggedIn()) {
    content.innerHTML = `
      <div class="state-container">
        <div class="state-icon">👤</div>
        <div class="state-title">로그인이 필요해요</div>
        <div class="state-desc">마이페이지를 보려면 로그인해주세요</div>
        <a href="/app/login" class="btn btn-primary" style="margin-top:var(--space-4);">로그인하기</a>
      </div>
    `;
    return;
  }

  const user = getAuthUser()!;

  content.innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar">${user.nationality?.charAt(0).toUpperCase() ?? '😊'}</div>
      <div>
        <div class="profile-info-name">여행자</div>
        <div class="profile-info-meta">
          ${user.nationality ? `🌏 ${user.nationality}` : ''}
          ${user.age ? ` · ${user.age}세` : ''}
        </div>
      </div>
    </div>

    <div class="profile-tabs">
      <button class="profile-tab active" data-tab="bookmarks">북마크</button>
      <button class="profile-tab" data-tab="reviews">내 리뷰</button>
      <button class="profile-tab" data-tab="usefuls">도움됐어요</button>
    </div>

    <div id="bookmarks-tab" class="profile-tab-content active">
      <div class="state-container"><div class="spinner"></div></div>
    </div>
    <div id="reviews-tab" class="profile-tab-content">
      <div class="state-container"><div class="spinner"></div></div>
    </div>
    <div id="usefuls-tab" class="profile-tab-content">
      <div class="state-container"><div class="spinner"></div></div>
    </div>
  `;

  attachTabEvents(user.uid);
  await loadBookmarks(user.uid);
}

function attachTabEvents(userUid: string): void {
  document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.profile-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const tabName = (tab as HTMLElement).dataset['tab'] ?? '';
      const tabContent = document.getElementById(`${tabName}-tab`);
      if (tabContent) tabContent.classList.add('active');

      if (tabName === 'bookmarks') await loadBookmarks(userUid);
      if (tabName === 'reviews') await loadUserReviews(userUid);
      if (tabName === 'usefuls') await loadUserUsefuls(userUid);
    });
  });
}

async function loadBookmarks(userUid: string): Promise<void> {
  const el = document.getElementById('bookmarks-tab');
  if (!el) return;

  const res = await api.getUserBookmarks(userUid);
  if (!res.success) {
    el.innerHTML = `<div class="state-container"><div class="state-title">불러오지 못했어요</div></div>`;
    return;
  }

  if (res.data.length === 0) {
    el.innerHTML = `
      <div class="state-container">
        <div class="state-icon">🔖</div>
        <div class="state-title">저장한 장소가 없어요</div>
        <div class="state-desc">장소를 탐색하고 북마크해보세요</div>
        <a href="/app" class="btn btn-primary btn-sm" style="margin-top:var(--space-3);">장소 탐색</a>
      </div>
    `;
    return;
  }

  el.innerHTML = `<div class="grid-auto">${res.data.map(renderPlaceCard).join('')}</div>`;
  attachPlaceCardEvents(el, (uid) => navigate(`/app/places/${uid}`));
}

async function loadUserReviews(userUid: string): Promise<void> {
  const el = document.getElementById('reviews-tab');
  if (!el) return;

  const res = await api.getUserReviews(userUid);
  if (!res.success) {
    el.innerHTML = `<div class="state-container"><div class="state-title">불러오지 못했어요</div></div>`;
    return;
  }

  if (res.data.length === 0) {
    el.innerHTML = `
      <div class="state-container">
        <div class="state-icon">💬</div>
        <div class="state-title">작성한 리뷰가 없어요</div>
        <div class="state-desc">방문한 장소에 리뷰를 남겨보세요</div>
      </div>
    `;
    return;
  }

  const reviews = res.data;
  el.innerHTML = `<div class="reviews-list">${reviews.map(r => renderReviewCard(r, false, () => {}, undefined, undefined)).join('')}</div>`;

  attachReviewCardEvents(
    el,
    () => {},
    () => {},
    async (reviewUid) => {
      if (!confirm('리뷰를 삭제하시겠어요?')) return;
      const deleteRes = await api.deleteReview(reviewUid);
      if (!deleteRes.success) { showToast('삭제에 실패했어요', 'error'); return; }
      showToast('리뷰가 삭제됐어요', 'success');
      await loadUserReviews(userUid);
    }
  );
}

async function loadUserUsefuls(userUid: string): Promise<void> {
  const el = document.getElementById('usefuls-tab');
  if (!el) return;

  const res = await api.getUserUsefuls(userUid);
  if (!res.success) {
    el.innerHTML = `<div class="state-container"><div class="state-title">불러오지 못했어요</div></div>`;
    return;
  }

  if (res.data.length === 0) {
    el.innerHTML = `
      <div class="state-container">
        <div class="state-icon">👍</div>
        <div class="state-title">도움됐다고 한 리뷰가 없어요</div>
      </div>
    `;
    return;
  }

  el.innerHTML = `<div class="reviews-list">${res.data.map(r => renderReviewCard(r, true, () => {}, undefined, undefined)).join('')}</div>`;
}
