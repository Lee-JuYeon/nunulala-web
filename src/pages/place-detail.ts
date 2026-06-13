import { api } from '../api';
import { navigate } from '../router';
import { isLoggedIn } from '../auth';
import {
  renderReviewCard,
  attachReviewCardEvents,
} from '../components/review-card';
import { renderReviewForm, attachReviewFormEvents } from '../components/review-form';
import { showToast } from '../components/toast';
import { escapeHtml } from '../ai-render';
import { safeImageUrl } from '../safe-url';
import type { Review, PlaceDetail } from '../types/models';

let usefulSet = new Set<string>();

export async function renderPlaceDetail(params: Record<string, string>): Promise<void> {
  const { uid } = params;
  const content = document.getElementById('app-content');
  if (!content) return;

  content.innerHTML = `
    <button class="back-btn" id="back-btn">← 목록으로</button>
    <div class="state-container"><div class="spinner"></div></div>
  `;

  document.getElementById('back-btn')?.addEventListener('click', () => navigate('/app'));

  const [placeRes, reviewsRes] = await Promise.all([
    api.getPlaceDetail(uid),
    api.getPlaceReviews(uid, 1, 'latest'),
  ]);

  if (!placeRes.success) {
    content.querySelector('.state-container')!.innerHTML = `
      <div class="state-icon">😕</div>
      <div class="state-title">장소를 찾을 수 없어요</div>
      <div class="state-desc"><button class="btn btn-primary btn-sm" onclick="history.back()">돌아가기</button></div>
    `;
    return;
  }

  const place = placeRes.data;
  const reviews: Review[] = reviewsRes.success ? reviewsRes.data : [];

  let bookmarked = false;
  let userStar = 0;

  if (isLoggedIn()) {
    const [bkRes, starRes] = await Promise.all([
      api.getBookmarkStatus(uid),
      api.getUserStar(uid),
    ]);
    if (bkRes.success) bookmarked = bkRes.data.bookmarked;
    if (starRes.success) userStar = starRes.data.star ?? 0;
  }

  renderDetailPage(content, place, reviews, bookmarked, userStar);
}

function getPlaceIcon(type: string): string {
  const map: Record<string, string> = {
    restaurant: '🍽️', cafe: '☕', store: '🛍️', park: '🌿',
    hotel: '🏨', hospital: '🏥', theater: '🎭', landmark: '🗼',
    temple: '⛩️', pharmacy: '💊',
  };
  return map[type] ?? '📍';
}

function renderDetailPage(
  container: HTMLElement,
  place: PlaceDetail,
  reviews: Review[],
  bookmarked: boolean,
  userStar: number
): void {
  const icon = getPlaceIcon(place.type);
  const avgStar = place.average_star;
  const addr = place.address;
  const loggedIn = isLoggedIn();

  container.innerHTML = `
    <button class="back-btn" id="back-btn">← 목록으로</button>

    ${place.thumbnail_image
      ? `<img class="place-detail-hero" src="${escapeHtml(safeImageUrl(place.thumbnail_image.image_url))}" alt="${escapeHtml(place.title)}">`
      : `<div class="place-detail-hero-placeholder">${icon}</div>`
    }

    <div class="place-detail-header">
      <div class="place-detail-type">
        ${escapeHtml(place.type_display_text)}${place.subtype_display_text ? ` · ${escapeHtml(place.subtype_display_text)}` : ''}
      </div>
      <div class="place-detail-title">${escapeHtml(place.title)}</div>
      ${place.subtitle ? `<div style="font-size:var(--text-sm);color:var(--label-alternative);margin-bottom:var(--space-3);">${escapeHtml(place.subtitle)}</div>` : ''}

      <div class="place-detail-stats">
        ${avgStar ? `<span class="place-detail-stat">⭐ ${avgStar.toFixed(1)} 평균</span>` : ''}
        <span class="place-detail-stat">💬 리뷰 ${reviews.length}개</span>
      </div>

      <div class="place-detail-actions">
        ${loggedIn ? `
          <button class="bookmark-btn${bookmarked ? ' active' : ''}" id="bookmark-btn">
            ${bookmarked ? '🔖 저장됨' : '🔖 저장'}
          </button>
        ` : `<a href="/app/login" class="btn btn-outline btn-sm">로그인 후 저장</a>`}
      </div>
    </div>

    ${addr ? `
      <div class="place-detail-info">
        <div class="place-detail-info-row">
          <span class="place-detail-info-icon">📍</span>
          <span class="place-detail-info-value">${escapeHtml(addr.full_address ?? addr.address_title ?? '')}</span>
        </div>
        ${place.working_times.length > 0 ? place.working_times.map(wt => `
          <div class="place-detail-info-row">
            <span class="place-detail-info-icon">🕐</span>
            <span class="place-detail-info-label">${escapeHtml(wt.day_title)}</span>
            <span class="place-detail-info-value">
              ${wt.open && wt.close ? `${escapeHtml(wt.open)} – ${escapeHtml(wt.close)}` : '정보 없음'}
              ${wt.last_order ? ` (라스트오더 ${escapeHtml(wt.last_order)})` : ''}
            </span>
          </div>
        `).join('') : ''}
      </div>
    ` : ''}

    ${loggedIn ? `
      <div class="place-star-container">
        <div class="place-star-title">별점 주기</div>
        <div class="stars" id="user-star-input">
          ${Array.from({ length: 5 }, (_, i) =>
            `<span class="star${i < userStar ? ' filled' : ''}" data-value="${i + 1}" role="button" tabindex="0">★</span>`
          ).join('')}
        </div>
      </div>
    ` : ''}

    <div class="reviews-section">
      <div class="reviews-header">
        <div class="reviews-title">리뷰</div>
        ${loggedIn ? `<button class="btn btn-primary btn-sm" id="write-review-btn">리뷰 작성</button>` : `<a href="/app/login" class="btn btn-outline btn-sm">로그인하여 리뷰 작성</a>`}
      </div>
      <div id="review-form-area"></div>
      <div class="reviews-list" id="reviews-list">
        ${renderReviewList(reviews)}
      </div>
    </div>
  `;

  document.getElementById('back-btn')?.addEventListener('click', () => navigate('/app'));
  attachDetailEvents(place.uid, reviews, bookmarked, userStar);
}

function renderReviewList(reviews: Review[]): string {
  if (reviews.length === 0) {
    return `
      <div class="state-container">
        <div class="state-icon">💬</div>
        <div class="state-title">아직 리뷰가 없어요</div>
        <div class="state-desc">첫 번째 리뷰를 작성해보세요</div>
      </div>
    `;
  }
  return reviews.map(r =>
    renderReviewCard(r, usefulSet.has(r.review_uid), () => {}, undefined, undefined)
  ).join('');
}

function attachDetailEvents(
  placeUid: string,
  reviews: Review[],
  bookmarked: boolean,
  userStar: number
): void {
  let isBookmarked = bookmarked;
  let currentStar = userStar;
  let showingForm = false;

  // Bookmark
  const bookmarkBtn = document.getElementById('bookmark-btn');
  bookmarkBtn?.addEventListener('click', async () => {
    if (!isLoggedIn()) { navigate('/app/login'); return; }
    const res = await api.toggleBookmark(placeUid);
    if (!res.success) { showToast('오류가 발생했습니다', 'error'); return; }
    isBookmarked = res.data.bookmarked;
    bookmarkBtn.className = `bookmark-btn${isBookmarked ? ' active' : ''}`;
    bookmarkBtn.textContent = isBookmarked ? '🔖 저장됨' : '🔖 저장';
    showToast(isBookmarked ? '북마크에 저장했어요' : '북마크를 해제했어요', 'success');
  });

  // Star rating
  const starInput = document.getElementById('user-star-input');
  starInput?.addEventListener('click', async (e) => {
    const star = (e.target as HTMLElement).closest('[data-value]') as HTMLElement | null;
    if (!star) return;
    const val = Number(star.dataset['value'] ?? 0);
    if (val === currentStar) return;
    const res = await api.upsertStar(placeUid, val);
    if (!res.success) { showToast('오류가 발생했습니다', 'error'); return; }
    currentStar = val;
    starInput.querySelectorAll('.star').forEach((s, i) => {
      s.classList.toggle('filled', i < val);
    });
    showToast(`${val}점을 주었어요 ⭐`, 'success');
  });

  // Write review
  document.getElementById('write-review-btn')?.addEventListener('click', () => {
    if (showingForm) return;
    showingForm = true;
    const area = document.getElementById('review-form-area');
    if (!area) return;
    area.innerHTML = renderReviewForm();
    attachReviewFormEvents(
      async (data) => {
        const res = await api.createReview(placeUid, data);
        if (!res.success) { showToast('리뷰 작성에 실패했어요', 'error'); return; }
        showToast('리뷰가 작성됐어요!', 'success');
        area.innerHTML = '';
        showingForm = false;
        reviews.unshift(res.data);
        const list = document.getElementById('reviews-list');
        if (list) list.innerHTML = renderReviewList(reviews);
        attachReviewListEvents(placeUid, reviews);
      },
      () => { area.innerHTML = ''; showingForm = false; }
    );
  });

  attachReviewListEvents(placeUid, reviews);
}

function attachReviewListEvents(placeUid: string, reviews: Review[]): void {
  const list = document.getElementById('reviews-list');
  if (!list) return;

  attachReviewCardEvents(
    list,
    async (reviewUid) => {
      if (!isLoggedIn()) { navigate('/app/login'); return; }
      const res = await api.toggleUseful(reviewUid);
      if (!res.success) return;
      if (res.data.useful) {
        usefulSet.add(reviewUid);
      } else {
        usefulSet.delete(reviewUid);
      }
      const idx = reviews.findIndex(r => r.review_uid === reviewUid);
      if (idx >= 0) {
        reviews[idx] = { ...reviews[idx]!, useful_count: res.data.count };
        list.innerHTML = renderReviewList(reviews);
        attachReviewListEvents(placeUid, reviews);
      }
    },
    (reviewUid) => {
      const review = reviews.find(r => r.review_uid === reviewUid);
      if (!review) return;
      const area = document.getElementById('review-form-area');
      if (!area) return;
      area.innerHTML = renderReviewForm(review);
      attachReviewFormEvents(
        async (data) => {
          const res = await api.updateReview(reviewUid, data);
          if (!res.success) { showToast('수정에 실패했어요', 'error'); return; }
          showToast('리뷰가 수정됐어요', 'success');
          area.innerHTML = '';
          const idx = reviews.findIndex(r => r.review_uid === reviewUid);
          if (idx >= 0) reviews[idx] = res.data;
          list.innerHTML = renderReviewList(reviews);
          attachReviewListEvents(placeUid, reviews);
        },
        () => { area.innerHTML = ''; }
      );
    },
    async (reviewUid) => {
      if (!confirm('리뷰를 삭제하시겠어요?')) return;
      const res = await api.deleteReview(reviewUid);
      if (!res.success) { showToast('삭제에 실패했어요', 'error'); return; }
      showToast('리뷰가 삭제됐어요', 'success');
      const idx = reviews.findIndex(r => r.review_uid === reviewUid);
      if (idx >= 0) reviews.splice(idx, 1);
      list.innerHTML = renderReviewList(reviews);
      attachReviewListEvents(placeUid, reviews);
    }
  );
}
