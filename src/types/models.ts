export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiPaginated<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string };
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;
export type ApiListResult<T> = ApiPaginated<T> | ApiError;

export interface ImageInfo {
  id: string;
  image_url: string;
  is_ai_generated: boolean;
  created_at: string;
}

export interface Address {
  uid: string;
  place_uid: string;
  lat: number;
  lon: number;
  address_title: string | null;
  address_block1: string | null;
  address_block2: string | null;
  address_block3: string | null;
  full_address: string | null;
}

export interface WorkingTime {
  id: string;
  place_uid: string;
  day_title: string;
  open: string | null;
  close: string | null;
  last_order: string | null;
}

export interface PlaceListItem {
  uid: string;
  title: string;
  subtitle: string | null;
  type: string;
  subtype: string | null;
  type_display_text: string;
  subtype_display_text: string | null;
  address: Address | null;
  average_star: number | null;
  thumbnail_image: ImageInfo | null;
  created_at: string;
  updated_at: string;
}

export interface PlaceDetail extends PlaceListItem {
  working_times: WorkingTime[];
}

export interface Review {
  review_uid: string;
  place_uid: string;
  user_uid: string;
  user_name: string;
  review_text: string | null;
  visit_date: string | null;
  rating: number;
  useful_count: number;
  created_at: string;
  updated_at: string;
}

export interface StarStats {
  average: number;
  count: number;
  distribution: Record<string, number>;
}

export interface BookmarkStatus {
  bookmarked: boolean;
  count: number;
}

export interface UsefulStatus {
  useful: boolean;
  count: number;
}

export interface Schedule {
  uid: string;
  user_uid: string;
  title: string;
  memo: string;
  d_day: string;
  index_order: number;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  uid: string;
  schedule_uid: string;
  place_uid: string | null;
  index_order: number;
  memo: string;
  created_at: string;
  updated_at: string;
}

export interface PlanWithPlace extends Plan {
  place: PlaceListItem | null;
}

export interface ScheduleDetail extends Schedule {
  plans: PlanWithPlace[];
}

export interface User {
  uid: string;
  nationality: string;
  gender: string;
  age: number | null;
  created_at: string;
}

export interface AuthState {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface PlaceFilters {
  type?: string;
  subtype?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}
