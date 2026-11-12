import { create } from 'zustand';
import { postsApi } from '../api/posts';
import { parseError } from '../api/client';
import type { Post } from '../types';

export interface LikeState {
  likedByMe: boolean;
  likeCount: number;
}

export interface FeedState {
  items: Post[];
  nextCursor: string | null;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  likesMap: Record<string, LikeState>;
  pendingLikes: Record<string, boolean>;

  loadFirst: () => Promise<void>;
  loadMore: () => Promise<void>;
  reset: () => void;
  syncLike: (postId: string, likedByMe: boolean, likeCount: number) => void;
  toggleLike: (postId: string, fallback?: LikeState) => Promise<void>;
}

const initial = {
  items: [] as Post[],
  nextCursor: null as string | null,
  hasMore: true,
  loading: false,
  error: null as string | null,
  likesMap: {} as Record<string, LikeState>,
  pendingLikes: {} as Record<string, boolean>,
};

export const useFeedStore = create<FeedState>()((set, get) => ({
  ...initial,

  loadFirst: async () => {
    set({ loading: true, error: null });
    try {
      const page = await postsApi.getFeed(null);
      const newLikesMap = { ...get().likesMap };
      for (const item of page.items) {
        newLikesMap[item._id] = { likedByMe: item.likedByMe, likeCount: item.likeCount };
      }
      set({
        items: page.items,
        nextCursor: page.nextCursor,
        hasMore: page.hasMore,
        likesMap: newLikesMap,
      });
    } catch (err) {
      set({ error: parseError(err).message, hasMore: false });
    } finally {
      set({ loading: false });
    }
  },

  loadMore: async () => {
    const { loading, hasMore, nextCursor } = get();
    if (loading || !hasMore || !nextCursor) return;
    set({ loading: true });
    try {
      const page = await postsApi.getFeed(nextCursor);
      const newLikesMap = { ...get().likesMap };
      for (const item of page.items) {
        newLikesMap[item._id] = { likedByMe: item.likedByMe, likeCount: item.likeCount };
      }
      set((s) => ({
        items: [...s.items, ...page.items],
        nextCursor: page.nextCursor,
        hasMore: page.hasMore,
        likesMap: newLikesMap,
      }));
    } catch (err) {
      set({ error: parseError(err).message });
    } finally {
      set({ loading: false });
    }
  },

  reset: () => {
    set({ ...initial });
  },

  syncLike: (postId: string, likedByMe: boolean, likeCount: number) => {
    set((s) => ({
      likesMap: {
        ...s.likesMap,
        [postId]: { likedByMe, likeCount },
      },
    }));
  },

  toggleLike: async (postId: string, fallback?: LikeState) => {
    const { pendingLikes, likesMap, items } = get();
    if (pendingLikes[postId]) return;

    const currentPost = items.find((p) => p._id === postId);
    const currentState = likesMap[postId] ?? (currentPost
      ? { likedByMe: currentPost.likedByMe, likeCount: currentPost.likeCount }
      : fallback ?? { likedByMe: false, likeCount: 0 });

    const currentLiked = currentState.likedByMe;
    const currentCount = currentState.likeCount;
    const nextLiked = !currentLiked;
    const nextCount = nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

    set((s) => ({
      pendingLikes: { ...s.pendingLikes, [postId]: true },
      likesMap: {
        ...s.likesMap,
        [postId]: { likedByMe: nextLiked, likeCount: nextCount },
      },
      items: s.items.map((p) =>
        p._id === postId ? { ...p, likedByMe: nextLiked, likeCount: nextCount } : p
      ),
    }));

    try {
      const res = nextLiked
        ? await postsApi.like(postId)
        : await postsApi.unlike(postId);

      set((s) => ({
        likesMap: {
          ...s.likesMap,
          [postId]: { likedByMe: res.liked, likeCount: res.likeCount },
        },
        items: s.items.map((p) =>
          p._id === postId ? { ...p, likedByMe: res.liked, likeCount: res.likeCount } : p
        ),
      }));
    } catch (err) {
      set((s) => ({
        likesMap: {
          ...s.likesMap,
          [postId]: { likedByMe: currentLiked, likeCount: currentCount },
        },
        items: s.items.map((p) =>
          p._id === postId ? { ...p, likedByMe: currentLiked, likeCount: currentCount } : p
        ),
      }));
      throw err;
    } finally {
      set((s) => {
        const nextPending = { ...s.pendingLikes };
        delete nextPending[postId];
        return { pendingLikes: nextPending };
      });
    }
  },
}));
