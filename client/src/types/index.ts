// Kiểu dữ liệu trả về của API (mục 0 tài liệu v1.2). Server khai báo schema + DTO riêng,
// hai bên đối chiếu theo docs/api-contract.md.

export type Role = 'member' | 'admin';
export type Visibility = 'public' | 'followers';
export type PostStatus = 'active' | 'hidden';
export type NotificationType = 'like' | 'comment' | 'follow';
export type ReportReason = 'spam' | 'offensive' | 'false_info' | 'other';
export type ReportStatus = 'pending' | 'resolved' | 'rejected';

export interface Avatar {
  url: string;
  publicId: string;
}

export interface UserSummary {
  _id: string;
  username: string;
  displayName: string;
  avatar: Avatar | null;
}

export interface User extends UserSummary {
  email: string;
  bio: string;
  role: Role;
  isLocked: boolean;
  createdAt: string;
}

export interface Profile extends UserSummary {
  bio: string;
  role: Role;
  createdAt: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isLocked?: boolean; // chỉ admin thấy
}

export interface PostImage {
  _id: string;
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

export interface PostLocation {
  name: string;
  nameKey: string;
  placeId?: string;
  address?: string;
  lat?: number;
  lng?: number;
}

export interface Post {
  _id: string;
  author: UserSummary;
  title: string;
  content: string;
  images: PostImage[];
  location: PostLocation;
  hashtags: string[];
  tripDate: string;
  cost: number;
  visibility: Visibility;
  status: PostStatus;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  post: string;
  author: UserSummary;
  parent: string | null;
  content: string;
  createdAt: string;
  replies?: Comment[];
}

export interface Notification {
  _id: string;
  actor: UserSummary;
  type: NotificationType;
  post: { _id: string; title: string } | null;
  isRead: boolean;
  createdAt: string;
}

export interface Report {
  _id: string;
  post: { _id: string; title: string; status: PostStatus; author: UserSummary } | null;
  reporter: UserSummary;
  reason: ReportReason;
  note: string;
  status: ReportStatus;
  handledBy: UserSummary | null;
  createdAt: string;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PagedList<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LocationStat {
  _id: string;
  name: string;
  count: number;
  likes: number;
}

export interface PlaceSuggestion {
  placeId: string;
  text: string;
}

export interface PlaceDetail {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface MapPoint {
  postId: string;
  title: string;
  name: string;
  lat: number;
  lng: number;
}
