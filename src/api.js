import { getAccessToken, clearAuth, refreshTokens } from './auth';
const API_BASE = '/api';
class ApiClient {
    async request(path, options = {}) {
        const token = getAccessToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        if (token)
            headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
        if (res.status === 401) {
            const refreshed = await refreshTokens();
            if (!refreshed) {
                clearAuth();
                return Promise.reject(new Error('UNAUTHORIZED'));
            }
            return this.request(path, options);
        }
        return res.json();
    }
    get(path) {
        return this.request(path, { method: 'GET' });
    }
    post(path, body) {
        return this.request(path, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    }
    put(path, body) {
        return this.request(path, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        });
    }
    delete(path) {
        return this.request(path, { method: 'DELETE' });
    }
    // ── Auth ──
    authToken(provider, token) {
        return this.post('/auth/token', { provider, token });
    }
    authRefresh(refreshToken) {
        return this.post('/auth/refresh', { refresh_token: refreshToken });
    }
    // ── Places ──
    getPlaces(filters = {}) {
        const params = new URLSearchParams();
        if (filters.type)
            params.set('type', filters.type);
        if (filters.subtype)
            params.set('subtype', filters.subtype);
        if (filters.search)
            params.set('search', filters.search);
        if (filters.sort)
            params.set('sort', filters.sort);
        if (filters.page)
            params.set('page', String(filters.page));
        if (filters.limit)
            params.set('limit', String(filters.limit));
        const qs = params.toString();
        return this.get(`/places${qs ? `?${qs}` : ''}`);
    }
    getPlaceDetail(uid) {
        return this.get(`/places/${uid}`);
    }
    // ── Reviews ──
    getPlaceReviews(placeUid, page = 1, sort = 'latest') {
        return this.get(`/places/${placeUid}/reviews?page=${page}&limit=10&sort=${sort}`);
    }
    createReview(placeUid, data) {
        return this.post(`/places/${placeUid}/reviews`, data);
    }
    updateReview(reviewUid, data) {
        return this.put(`/reviews/${reviewUid}`, data);
    }
    deleteReview(reviewUid) {
        return this.delete(`/reviews/${reviewUid}`);
    }
    toggleUseful(reviewUid) {
        return this.post(`/reviews/${reviewUid}/useful`);
    }
    // ── Bookmarks ──
    toggleBookmark(placeUid) {
        return this.post(`/places/${placeUid}/bookmark`);
    }
    getBookmarkStatus(placeUid) {
        return this.get(`/places/${placeUid}/bookmark/status`);
    }
    getBookmarkCount(placeUid) {
        return this.get(`/places/${placeUid}/bookmark/count`);
    }
    getUserBookmarks(userUid, page = 1) {
        return this.get(`/users/${userUid}/bookmarks?page=${page}&limit=20`);
    }
    // ── Stars ──
    getStarStats(placeUid) {
        return this.get(`/places/${placeUid}/stars`);
    }
    getUserStar(placeUid) {
        return this.get(`/places/${placeUid}/star/me`);
    }
    upsertStar(placeUid, star) {
        return this.post(`/places/${placeUid}/star`, { star });
    }
    // ── Schedules ──
    getSchedules(page = 1) {
        return this.get(`/schedules?page=${page}&limit=20`);
    }
    getScheduleDetail(uid) {
        return this.get(`/schedules/${uid}`);
    }
    createSchedule(data) {
        return this.post('/schedules', data);
    }
    updateSchedule(uid, data) {
        return this.put(`/schedules/${uid}`, data);
    }
    deleteSchedule(uid) {
        return this.delete(`/schedules/${uid}`);
    }
    // ── Users ──
    getUser(uid) {
        return this.get(`/users/${uid}`);
    }
    createUser(data) {
        return this.post('/users', data);
    }
    getUserReviews(userUid, page = 1) {
        return this.get(`/users/${userUid}/reviews?page=${page}&limit=20`);
    }
    getUserUsefuls(userUid, page = 1) {
        return this.get(`/users/${userUid}/usefuls?page=${page}&limit=20`);
    }
}
export const api = new ApiClient();
