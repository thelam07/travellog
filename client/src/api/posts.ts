import { api } from './client';
import type { CursorPage, Post } from '../types';

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
};
