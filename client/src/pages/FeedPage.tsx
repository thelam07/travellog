import { useEffect } from 'react';
import { Link } from 'react-router';
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
