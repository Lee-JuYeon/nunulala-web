// [2026-06-08] AI 여행 챗 타입 — 서버 계약(nunulala-api/src/ai/chat) 1:1 미러. snake_case 그대로.
// 응답 판별자 = `type`. 세션 규칙: 첫 턴은 session 필드 자체를 생략(빈/부분 객체 전송 시 HTTP 500),
// 서버가 돌려준 session 을 그대로 보관했다가 다음 턴에 재전송한다.

export type Companions = 'solo' | 'couple' | 'family_kids' | 'friends' | 'parents' | 'group';
export type Pace = 'relaxed' | 'balanced' | 'packed';
export type Budget = 'budget' | 'mid' | 'luxury';

export interface TravelProfile {
  interests: string[];
  companions: Companions | null;
  pace: Pace | null;
  budget: Budget | null;
  duration_days: number | null;
  base_area: string | null;
  dietary: string[];
}

export interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatSession {
  profile: TravelProfile;
  history: ChatMsg[];
}

export interface NearRestaurant {
  place_uid: string;
  name: string;
  dist_km: number;
  lat: number;
  lon: number;
  thumbnail_url: string | null;
  full_address: string | null;
}

export interface CourseStop {
  place_uid: string;
  name: string;
  order: number;
  reason: string;
  lat?: number;
  lon?: number;
  thumbnail_url?: string | null;
  full_address?: string | null;
}

export interface DiningSpot {
  near_stop: string;
  place_uid: string;
  name: string;
  dist_km: number;
  lat: number;
  lon: number;
  thumbnail_url?: string | null;
  full_address?: string | null;
}

export interface Recommendation {
  theme: string;
  city: string;
  coherence_km: number;
  course: CourseStop[];
  dining_near_course: DiningSpot[];
}

export type TurnResponse =
  | { type: 'rejected'; message: string }
  | { type: 'answer'; text: string; place_uid: string | null; place_name: string | null }
  | { type: 'near_place'; anchor: string; restaurants: NearRestaurant[] }
  | { type: 'clarify'; question: string; profile: TravelProfile }
  | { type: 'recommendation'; profile: TravelProfile; recommendation: Recommendation };

export interface AIChatResponse {
  response: TurnResponse;
  session: ChatSession;
}
