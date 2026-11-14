import { api } from './client';
import type { CursorPage, Post } from '../types';

export interface CreatePostBody {
  title: string;
  content: string;
  location: { name: string; placeId?: string; address?: string; lat?: number; lng?: number };
  tripDate: string; // YYYY-MM-DD
  cost?: number;
  visibility: 'public' | 'followers';
  images: File[];
}

export interface UpdatePostBody {
  title?: string;
  content?: string;
  location?: { name: string; placeId?: string; address?: string; lat?: number; lng?: number };
  tripDate?: string;
  cost?: number;
  visibility?: 'public' | 'followers';
  /** File mới thêm vào */
  images?: File[];
  /** _id ảnh cũ muốn giữ. Không gửi = giữ tất cả. */
  keepImageIds?: string[];
}

export const postsApi = {
  getFeed: async (cursor?: string | null, limit?: number): Promise<CursorPage<Post>> => {
    const params: Record<string, unknown> = {};
    if (cursor) params.cursor = cursor;
    if (limit) params.limit = limit;
    const res = await api.get<CursorPage<Post>>('/feed', { params });
    return res.data;
  },

  getPost: async (id: string): Promise<Post> => {
    const res = await api.get<Post>(`/posts/${id}`);
    return res.data;
  },

  like: async (postId: string): Promise<{ liked: boolean; likeCount: number }> => {
    const res = await api.post<{ liked: boolean; likeCount: number }>(`/posts/${postId}/likes`);
    return res.data;
  },

  unlike: async (postId: string): Promise<{ liked: boolean; likeCount: number }> => {
    const res = await api.delete<{ liked: boolean; likeCount: number }>(`/posts/${postId}/likes`);
    return res.data;
  },

  /** Tạo bài mới (multipart/form-data). Server: POST /api/posts */
  createPost: async (body: CreatePostBody): Promise<Post> => {
    const form = new FormData();
    form.append('title', body.title);
    form.append('content', body.content);
    form.append('location', JSON.stringify(body.location));
    form.append('tripDate', body.tripDate);
    if (body.cost !== undefined) form.append('cost', String(body.cost));
    form.append('visibility', body.visibility);
    for (const file of body.images) form.append('images', file);
    const res = await api.post<Post>('/posts', form);
    return res.data;
  },

  /** Sửa bài (multipart/form-data). Server: PATCH /api/posts/:id */
  updatePost: async (id: string, body: UpdatePostBody): Promise<Post> => {
    const form = new FormData();
    if (body.title !== undefined) form.append('title', body.title);
    if (body.content !== undefined) form.append('content', body.content);
    if (body.location !== undefined) form.append('location', JSON.stringify(body.location));
    if (body.tripDate !== undefined) form.append('tripDate', body.tripDate);
    if (body.cost !== undefined) form.append('cost', String(body.cost));
    if (body.visibility !== undefined) form.append('visibility', body.visibility);
    if (body.images) for (const file of body.images) form.append('images', file);
    if (body.keepImageIds) form.append('keepImageIds', JSON.stringify(body.keepImageIds));
    const res = await api.patch<Post>(`/posts/${id}`, form);
    return res.data;
  },

  /** Xoá bài. Server: DELETE /api/posts/:id */
  deletePost: async (id: string): Promise<{ deleted: boolean }> => {
    const res = await api.delete<{ deleted: boolean }>(`/posts/${id}`);
    return res.data;
  },
};
