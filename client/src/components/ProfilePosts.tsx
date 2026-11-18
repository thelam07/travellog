// client/src/components/ProfilePosts.tsx
// (A – F04) Danh sách bài trên trang cá nhân: GET /posts?author=<username> (B10, cùng bộ lọc quyền xem B6
// nên khớp với số bài trên header), hiện bằng PostCard của C, cuộn vô hạn bằng useInfiniteScroll của C.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { parseError } from '../api/client';
import { postsApi } from '../api/posts';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import type { Post } from '../types';
import { EmptyState } from './EmptyState';
import { PostCard } from './PostCard';
import { Spinner } from './Spinner';

interface Props {
  username: string;
  isSelf: boolean;
}

export default function ProfilePosts({ username, isSelf }: Props) {
  const [items, setItems] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Chặn gọi trùng khi IntersectionObserver báo nhiều lần liên tiếp
  const busy = useRef(false);

  // Trang đầu: tải lại khi đổi người (biến active chống StrictMode chạy effect 2 lần)
  useEffect(() => {
    let active = true;
    setItems([]);
    setCursor(null);
    setHasMore(false);
    setError(null);
    setLoading(true);
    postsApi
      .list({ author: username })
      .then((page) => {
        if (!active) return;
        setItems(page.items);
        setCursor(page.nextCursor);
        setHasMore(page.hasMore);
      })
      .catch((err) => active && setError(parseError(err).message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [username]);

  const loadMore = useCallback(async () => {
    if (busy.current || !hasMore || !cursor) return;
    busy.current = true;
    setLoading(true);
    try {
      const page = await postsApi.list({ author: username, cursor });
      // Bỏ bài trùng phòng khi có bài mới đăng chen giữa hai lần tải
      setItems((prev) => [...prev, ...page.items.filter((p) => !prev.some((x) => x._id === p._id))]);
      setCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (err) {
      setError(parseError(err).message);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, [username, cursor, hasMore]);

  const sentinelRef = useInfiniteScroll(loadMore, hasMore && !loading && !error);

  if (loading && items.length === 0) {
    return (
      <div className="feed-sentinel">
        <Spinner size="md" />
      </div>
    );
  }
  if (error && items.length === 0) return <div className="alert alert-error">{error}</div>;
  if (items.length === 0) {
    return (
      <EmptyState
        icon="📝"
        title="Chưa có bài viết nào"
        action={
          isSelf ? (
            <Link to="/posts/new" className="btn btn-primary">
              Đăng chuyến đi đầu tiên
            </Link>
          ) : undefined
        }
      />
    );
  }

  return (
    <>
      <div className="posts-list stack feed-posts">
        {items.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>
      {error && <div className="alert alert-error feed-alert">{error}</div>}
      {hasMore ? (
        <div ref={sentinelRef} className="feed-sentinel">
          {loading && <Spinner size="md" />}
        </div>
      ) : (
        <div className="muted small feed-end">Đã hiển thị tất cả bài viết</div>
      )}
    </>
  );
}
