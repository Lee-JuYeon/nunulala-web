import type {
  ApiResult,
  ApiListResult,
  PlaceListItem,
  PlaceDetail,
  Review,
  StarStats,
  BookmarkStatus,
  UsefulStatus,
  Schedule,
  ScheduleDetail,
  User,
  AuthState,
  PlaceFilters,
} from './types/models';
import type { AIChatResponse, ChatSession } from './types/ai';
import { getAccessToken, clearAuth, refreshTokens } from './auth';

const API_BASE = '/api';

class ApiClient {
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // SEC-14: HttpOnly refresh 쿠키(nunulala_rt)를 /api/auth/* 요청에 함께 전송.
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (res.status === 401) {
      const refreshed = await refreshTokens();
      if (!refreshed) {
        clearAuth();
        return Promise.reject(new Error('UNAUTHORIZED'));
      }
      return this.request<T>(path, options);
    }

    return res.json() as Promise<T>;
  }

  private get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  private post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  private put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  private delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  // ── Auth ──
  authToken(provider: string, token: string): Promise<ApiResult<AuthState>> {
    return this.post('/auth/token', { provider, token });
  }

  // SEC-14: 서버가 HttpOnly 쿠키를 지우고 server-side refresh 세션을 폐기한다.
  authLogout(): Promise<ApiResult<{ message: string }>> {
    return this.post('/auth/logout');
  }

  // ── Places ──
  getPlaces(filters: PlaceFilters = {}): Promise<ApiListResult<PlaceListItem>> {
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.subtype) params.set('subtype', filters.subtype);
    if (filters.search) params.set('search', filters.search);
    if (filters.sort) params.set('sort', filters.sort);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    const qs = params.toString();
    return this.get(`/places${qs ? `?${qs}` : ''}`);
  }

  getPlaceDetail(uid: string): Promise<ApiResult<PlaceDetail>> {
    return this.get(`/places/${uid}`);
  }

  // ── Reviews ──
  getPlaceReviews(
    placeUid: string,
    page = 1,
    sort = 'latest'
  ): Promise<ApiListResult<Review>> {
    return this.get(
      `/places/${placeUid}/reviews?page=${page}&limit=10&sort=${sort}`
    );
  }

  createReview(
    placeUid: string,
    data: { rating: number; review_text?: string; visit_date?: string }
  ): Promise<ApiResult<Review>> {
    return this.post(`/places/${placeUid}/reviews`, data);
  }

  updateReview(
    reviewUid: string,
    data: { rating?: number; review_text?: string; visit_date?: string }
  ): Promise<ApiResult<Review>> {
    return this.put(`/reviews/${reviewUid}`, data);
  }

  deleteReview(reviewUid: string): Promise<ApiResult<{ message: string }>> {
    return this.delete(`/reviews/${reviewUid}`);
  }

  toggleUseful(reviewUid: string): Promise<ApiResult<UsefulStatus>> {
    return this.post(`/reviews/${reviewUid}/useful`);
  }

  // ── Bookmarks ──
  toggleBookmark(placeUid: string): Promise<ApiResult<BookmarkStatus>> {
    return this.post(`/places/${placeUid}/bookmark`);
  }

  getBookmarkStatus(placeUid: string): Promise<ApiResult<BookmarkStatus>> {
    return this.get(`/places/${placeUid}/bookmark/status`);
  }

  getBookmarkCount(placeUid: string): Promise<ApiResult<{ count: number }>> {
    return this.get(`/places/${placeUid}/bookmark/count`);
  }

  getUserBookmarks(userUid: string, page = 1): Promise<ApiListResult<PlaceListItem>> {
    return this.get(`/users/${userUid}/bookmarks?page=${page}&limit=20`);
  }

  // ── Stars ──
  getStarStats(placeUid: string): Promise<ApiResult<StarStats>> {
    return this.get(`/places/${placeUid}/stars`);
  }

  getUserStar(placeUid: string): Promise<ApiResult<{ star: number | null }>> {
    return this.get(`/places/${placeUid}/star/me`);
  }

  upsertStar(
    placeUid: string,
    star: number
  ): Promise<ApiResult<{ star: number }>> {
    return this.post(`/places/${placeUid}/star`, { star });
  }

  // ── Schedules ──
  getSchedules(page = 1): Promise<ApiListResult<Schedule>> {
    return this.get(`/schedules?page=${page}&limit=20`);
  }

  getScheduleDetail(uid: string): Promise<ApiResult<ScheduleDetail>> {
    return this.get(`/schedules/${uid}`);
  }

  createSchedule(data: {
    title: string;
    memo?: string;
    d_day: string;
  }): Promise<ApiResult<Schedule>> {
    return this.post('/schedules', data);
  }

  updateSchedule(
    uid: string,
    data: { title?: string; memo?: string; d_day?: string }
  ): Promise<ApiResult<Schedule>> {
    return this.put(`/schedules/${uid}`, data);
  }

  deleteSchedule(uid: string): Promise<ApiResult<{ message: string }>> {
    return this.delete(`/schedules/${uid}`);
  }

  // ── Users ──
  getUser(uid: string): Promise<ApiResult<User>> {
    return this.get(`/users/${uid}`);
  }

  createUser(data: {
    nationality?: string;
    gender?: string;
    age?: number;
  }): Promise<ApiResult<User>> {
    return this.post('/users', data);
  }

  getUserReviews(userUid: string, page = 1): Promise<ApiListResult<Review>> {
    return this.get(`/users/${userUid}/reviews?page=${page}&limit=20`);
  }

  getUserUsefuls(userUid: string, page = 1): Promise<ApiListResult<Review>> {
    return this.get(`/users/${userUid}/usefuls?page=${page}&limit=20`);
  }

  // ── AI Chat ──
  // ⚠️ 첫 턴은 session 필드 생략(빈/부분 객체 전송 시 HTTP 500). 서버 반환 session 을 그대로 재전송.
  aiChat(message: string, session?: ChatSession): Promise<AIChatResponse> {
    const body: { message: string; session?: ChatSession } = { message };
    if (session) body.session = session;
    return this.post('/ai/chat', body);
  }
}

export const api = new ApiClient();
