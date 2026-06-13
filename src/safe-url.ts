// [2026-06-09] SEC-01: img src 스킴 화이트리스트. javascript:/data:/vbscript: 등 차단.
// 허용: http(s):// 절대 URL 또는 '/' 로 시작하는 동일출처 상대 경로. 그 외는 '' 반환.
// 반환값은 호출부에서 escapeHtml 을 거쳐 속성 인용부호 안전성까지 확보한다.
export function safeImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) return trimmed;
  return '';
}
