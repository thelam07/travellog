import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import { EmptyState } from '../components/EmptyState';
import { PostCard } from '../components/PostCard';
import { PageSpinner, Spinner } from '../components/Spinner';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useFeedStore } from '../stores/useFeedStore';

export function FeedPage() {
  const items = useFeedStore((s) => s.items);
  const hasMore = useFeedStore((s) => s.hasMore);
  const loading = useFeedStore((s) => s.loading);
  const error = useFeedStore((s) => s.error);
  const loadFirst = useFeedStore((s) => s.loadFirst);
  const loadMore = useFeedStore((s) => s.loadMore);

  useEffect(() => {
    loadFirst();
  }, [loadFirst]);

  // Đang ở bảng tin mà bấm logo hoặc "Bảng tin": React Router tạo location.key mới (cùng đường dẫn "/")
  // nên trang không mount lại. Bắt thay đổi đó để cuộn lên đầu và tải lại trang đầu, thấy bài mới.
  const location = useLocation();
  const lastKey = useRef(location.key);
  useEffect(() => {
    if (location.key === lastKey.current) return;
    lastKey.current = location.key;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadFirst();
  }, [location.key, loadFirst]);

  const sentinelRef = useInfiniteScroll(loadMore, hasMore && !loading);

  if (loading && items.length === 0) {
    return <PageSpinner />;
  }

  if (error && items.length === 0) {
    return (
      <div className="container feed-error-container">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container feed-empty-container">
        <EmptyState
          icon="🧭"
          title="Bảng tin của bạn đang trống"
          description="Hãy theo dõi những người dùng khác hoặc khám phá bài viết mới nhất để cập nhật bảng tin."
          action={
            <Link to="/explore" className="btn btn-primary">
              Khám phá bài viết
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="feed-page stack">
      <div className="posts-list stack feed-posts">
        {items.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="feed-sentinel">
          {loading && <Spinner size="md" />}
        </div>
      )}

      {!hasMore && (
        <div className="muted small text-center feed-end">
          Bạn đã xem hết
        </div>
      )}

      {error && (
        <div className="alert alert-error feed-alert">
          {error}
        </div>
      )}
    </div>
  );
}

export default FeedPage;
