export function renderReviewForm(existing) {
    const rating = existing?.rating ?? 0;
    const text = existing?.review_text ?? '';
    const date = existing?.visit_date ?? '';
    return `
    <form id="review-form" class="card" style="padding:var(--space-5);">
      <div style="margin-bottom:var(--space-4);">
        <div class="form-label" style="margin-bottom:var(--space-2);">별점</div>
        <div class="stars" id="star-input">
          ${Array.from({ length: 5 }, (_, i) => `<span class="star${i < rating ? ' filled' : ''}" data-value="${i + 1}" role="button" tabindex="0">★</span>`).join('')}
        </div>
        <input type="hidden" id="rating-input" name="rating" value="${rating}">
      </div>
      <div class="form-group" style="margin-bottom:var(--space-4);">
        <label class="form-label" for="review-text">리뷰 (선택)</label>
        <textarea
          class="form-input form-textarea"
          id="review-text"
          name="review_text"
          placeholder="방문 경험을 알려주세요"
          maxlength="1000"
        >${text}</textarea>
      </div>
      <div class="form-group" style="margin-bottom:var(--space-5);">
        <label class="form-label" for="visit-date">방문 날짜 (선택)</label>
        <input
          class="form-input"
          type="date"
          id="visit-date"
          name="visit_date"
          value="${date}"
        >
      </div>
      <div style="display:flex;gap:var(--space-3);">
        <button type="submit" class="btn btn-primary" id="review-submit-btn">
          ${existing ? '수정하기' : '리뷰 작성'}
        </button>
        <button type="button" class="btn btn-secondary" id="review-cancel-btn">취소</button>
      </div>
    </form>
  `;
}
export function attachReviewFormEvents(onSubmit, onCancel) {
    const form = document.getElementById('review-form');
    const starInput = document.getElementById('star-input');
    const ratingInput = document.getElementById('rating-input');
    if (starInput && ratingInput) {
        starInput.addEventListener('click', (e) => {
            const star = e.target.closest('[data-value]');
            if (!star)
                return;
            const val = Number(star.dataset['value'] ?? 0);
            ratingInput.value = String(val);
            starInput.querySelectorAll('.star').forEach((s, i) => {
                s.classList.toggle('filled', i < val);
            });
        });
    }
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const rating = Number(ratingInput?.value ?? 0);
        if (rating === 0) {
            alert('별점을 선택해주세요.');
            return;
        }
        const text = document.getElementById('review-text').value.trim();
        const date = document.getElementById('visit-date').value;
        onSubmit({ rating, review_text: text, visit_date: date });
    });
    document.getElementById('review-cancel-btn')?.addEventListener('click', onCancel);
}
