// [2026-06-08] AI 응답 → 어시스턴트 말풍선 HTML. iOS AIChatRenderer 포팅(순수함수, 5분기).
// 분기: rejected / answer / clarify / near_place / recommendation. place_uid dedup, course nullable 필터.
import type { TurnResponse, NearRestaurant, DiningSpot, CourseStop } from './types/ai';

const ESC: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESC[c] ?? c);
}

function km(n: number): string {
  return `${n.toFixed(2)}km`;
}

/** place_uid 기준 중복 제거(같은 식당이 여러 stop 근처에 중복 등장) */
function dedupByUid<T extends { place_uid: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    if (!it.place_uid || seen.has(it.place_uid)) continue;
    seen.add(it.place_uid);
    out.push(it);
  }
  return out;
}

function restaurantList(rs: NearRestaurant[]): string {
  const items = dedupByUid(rs).map(
    (r) => `<li><span class="ai-place-name">${escapeHtml(r.name)}</span> <span class="ai-dist">${km(r.dist_km)}</span></li>`
  );
  return items.length ? `<ul class="ai-place-list">${items.join('')}</ul>` : '';
}

function diningList(ds: DiningSpot[]): string {
  const items = dedupByUid(ds).map(
    (d) => `<li><span class="ai-place-name">${escapeHtml(d.name)}</span> <span class="ai-dist">${km(d.dist_km)}</span> <span class="ai-near">· ${escapeHtml(d.near_stop)} 근처</span></li>`
  );
  return items.length
    ? `<p class="ai-dining-label">🍽️ 코스 주변 맛집</p><ul class="ai-place-list">${items.join('')}</ul>`
    : '';
}

function courseList(course: CourseStop[]): string {
  // iOS fromCourse: place_uid/name 없는 stop 은 버린다(nullable compactMap)
  const stops = course
    .filter((c) => c.place_uid && c.name)
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((c) => {
      const reason = c.reason ? ` — <span class="ai-reason">${escapeHtml(c.reason)}</span>` : '';
      return `<li><span class="ai-order">${c.order}</span><span class="ai-place-name">${escapeHtml(c.name)}</span>${reason}</li>`;
    });
  return stops.length ? `<ol class="ai-course">${stops.join('')}</ol>` : '';
}

/** TurnResponse → 어시스턴트 말풍선 내부 HTML(이미 escape 처리됨) */
export function renderAssistant(resp: TurnResponse): string {
  switch (resp.type) {
    case 'rejected':
      return `<p>${escapeHtml(resp.message)}</p>`;
    case 'answer':
      return `<p>${escapeHtml(resp.text)}</p>`;
    case 'clarify':
      return `<p>${escapeHtml(resp.question)}</p>`;
    case 'near_place': {
      const list = restaurantList(resp.restaurants);
      return `<p><strong>${escapeHtml(resp.anchor)}</strong> 근처 맛집</p>${
        list || '<p class="ai-empty">근처 맛집을 찾지 못했어요.</p>'
      }`;
    }
    case 'recommendation': {
      const rec = resp.recommendation;
      return (
        `<p class="ai-theme">🗺️ <strong>${escapeHtml(rec.theme)}</strong></p>` +
        courseList(rec.course) +
        diningList(rec.dining_near_course)
      );
    }
  }
  return '';
}
