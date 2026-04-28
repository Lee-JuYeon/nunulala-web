import type { Review } from '../types/models';
import { isLoggedIn, getAuthUser } from '../auth';

function renderStars(rating: number): string {
  return Array.from({ length: 5 }, (_, i) =>
    `<span class="star${i < rating ? ' filled' : ''}">★</span>`
  ).join('');
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function renderReviewCard(
  review: Review,
  usefulActive: boolean,
  _onUseful: (reviewUid: string) => void,
  _onEdit?: (review: Review) => void,
  _onDelete?: (reviewUid: string) => void
): string {
  const user = getAuthUser();
  const isOwner = isLoggedIn() && user?.uid === review.user_uid;

  return `
    <div class="review-card" data-review-uid="${review.review_uid}">
      <div class="review-card-header">
        <div class="review-card-user">
          <div class="review-card-avatar">${getInitial(review.user_name)}</div>
          <div>
            <div class="review-card-name">${review.user_name}</div>
            <div class="review-card-date">${formatDate(review.created_at)}</div>
          </div>
        </div>
        <div class="review-card-stars">${renderStars(review.rating)}</div>
      </div>
      ${review.review_text ? `<div class="review-card-text">${review.review_text}</div>` : ''}
      <div class="review-card-footer">
        <div class="review-card-useful${usefulActive ? ' active' : ''}">
          <button class="useful-btn" data-review-uid="${review.review_uid}">
            ${usefulActive ? '👍' : '👍'} 도움되요 ${review.useful_count}
          </button>
        </div>
        ${isOwner ? `
          <div style="display:flex;gap:8px;">
            <button class="btn btn-sm btn-outline edit-review-btn" data-review-uid="${review.review_uid}">수정</button>
            <button class="btn btn-sm btn-danger delete-review-btn" data-review-uid="${review.review_uid}">삭제</button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

export function attachReviewCardEvents(
  container: HTMLElement,
  onUseful: (reviewUid: string) => void,
  onEdit: (reviewUid: string) => void,
  onDelete: (reviewUid: string) => void
): void {
  container.addEventListener('click', (e) => {
    const el = e.target as HTMLElement;

    const usefulBtn = el.closest('.useful-btn') as HTMLElement | null;
    if (usefulBtn) {
      onUseful(usefulBtn.dataset['reviewUid'] ?? '');
      return;
    }

    const editBtn = el.closest('.edit-review-btn') as HTMLElement | null;
    if (editBtn) {
      onEdit(editBtn.dataset['reviewUid'] ?? '');
      return;
    }

    const deleteBtn = el.closest('.delete-review-btn') as HTMLElement | null;
    if (deleteBtn) {
      onDelete(deleteBtn.dataset['reviewUid'] ?? '');
    }
  });
}
