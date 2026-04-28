import { api } from '../api';
import { navigate } from '../router';
import { renderPlaceCard, attachPlaceCardEvents } from '../components/place-card';
import { showToast } from '../components/toast';
const PLACE_TYPES = [
    { value: '', label: '전체' },
    { value: 'restaurant', label: '레스토랑' },
    { value: 'cafe', label: '카페' },
    { value: 'store', label: '상점' },
    { value: 'park', label: '공원' },
    { value: 'hotel', label: '숙소' },
    { value: 'landmark', label: '유적지' },
    { value: 'theater', label: '공연장' },
    { value: 'temple', label: '종교시설' },
];
let currentFilters = { page: 1, limit: 20, sort: 'popularity' };
let currentPage = 1;
let totalPages = 1;
export async function renderPlaces() {
    const content = document.getElementById('app-content');
    if (!content)
        return;
    content.innerHTML = `
    <div class="places-toolbar">
      <div class="search-bar">
        <span>🔍</span>
        <input type="text" id="place-search" placeholder="장소 이름으로 검색..." autocomplete="off">
      </div>
      <div class="chip-group" id="type-chips">
        ${PLACE_TYPES.map(t => `<button class="chip${currentFilters.type === t.value ? ' active' : ''}" data-type="${t.value}">${t.label}</button>`).join('')}
      </div>
      <div class="places-sort">
        <label>정렬:</label>
        <select id="sort-select">
          <option value="popularity" ${currentFilters.sort === 'popularity' ? 'selected' : ''}>인기순</option>
          <option value="latest" ${currentFilters.sort === 'latest' ? 'selected' : ''}>최신순</option>
        </select>
      </div>
    </div>
    <div class="places-count" id="places-count"></div>
    <div class="grid-auto" id="places-grid"></div>
    <div class="pagination" id="places-pagination"></div>
  `;
    attachToolbarEvents();
    await loadPlaces();
}
function attachToolbarEvents() {
    const searchInput = document.getElementById('place-search');
    const chipGroup = document.getElementById('type-chips');
    const sortSelect = document.getElementById('sort-select');
    let searchDebounce;
    searchInput?.addEventListener('input', () => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
            currentFilters.search = searchInput.value.trim() || undefined;
            currentFilters.page = 1;
            currentPage = 1;
            loadPlaces();
        }, 400);
    });
    chipGroup?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-type]');
        if (!btn)
            return;
        currentFilters.type = btn.dataset['type'] || undefined;
        currentFilters.page = 1;
        currentPage = 1;
        chipGroup.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        loadPlaces();
    });
    sortSelect?.addEventListener('change', () => {
        currentFilters.sort = sortSelect.value;
        currentFilters.page = 1;
        currentPage = 1;
        loadPlaces();
    });
}
async function loadPlaces() {
    const grid = document.getElementById('places-grid');
    const countEl = document.getElementById('places-count');
    if (!grid)
        return;
    grid.innerHTML = `<div class="state-container"><div class="spinner"></div></div>`;
    const result = await api.getPlaces({ ...currentFilters, page: currentPage });
    if (!result.success) {
        showToast('장소를 불러오지 못했습니다.', 'error');
        grid.innerHTML = `<div class="state-container"><div class="state-icon">😕</div><div class="state-title">장소를 불러올 수 없어요</div></div>`;
        return;
    }
    const { data, meta } = result;
    totalPages = meta.totalPages;
    if (countEl)
        countEl.textContent = `총 ${meta.total}개의 장소`;
    if (data.length === 0) {
        grid.innerHTML = `
      <div class="state-container" style="grid-column:1/-1;">
        <div class="state-icon">🗺️</div>
        <div class="state-title">장소가 없어요</div>
        <div class="state-desc">다른 검색어나 필터를 시도해보세요</div>
      </div>
    `;
        updatePagination();
        return;
    }
    grid.innerHTML = data.map(renderPlaceCard).join('');
    attachPlaceCardEvents(grid, (uid) => navigate(`/app/places/${uid}`));
    updatePagination();
}
function updatePagination() {
    const el = document.getElementById('places-pagination');
    if (!el)
        return;
    if (totalPages <= 1) {
        el.innerHTML = '';
        return;
    }
    const pages = [];
    if (currentPage > 1) {
        pages.push(`<button class="page-btn" data-page="${currentPage - 1}">←</button>`);
    }
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) {
        pages.push(`<button class="page-btn${i === currentPage ? ' active' : ''}" data-page="${i}">${i}</button>`);
    }
    if (currentPage < totalPages) {
        pages.push(`<button class="page-btn" data-page="${currentPage + 1}">→</button>`);
    }
    el.innerHTML = pages.join('');
    el.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-page]');
        if (!btn)
            return;
        currentPage = Number(btn.dataset['page'] ?? 1);
        currentFilters.page = currentPage;
        loadPlaces();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}
