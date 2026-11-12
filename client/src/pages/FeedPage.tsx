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
      <div className="container" style={{ padding: '24px 0' }}>
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container" style={{ padding: '32px 0' }}>
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
    <div className="feed-page stack" style={{ maxWidth: '640px', margin: '0 auto', width: '100%', padding: '16px 0' }}>
      <div className="posts-list stack" style={{ gap: '20px' }}>
        {items.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>

      {hasMore && (
        <div
          ref={sentinelRef}
          className="feed-sentinel"
          style={{ minHeight: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 0' }}
        >
          {loading && <Spinner size="md" />}
        </div>
      )}

      {!hasMore && (
        <div className="muted small text-center" style={{ padding: '24px 0', textAlign: 'center' }}>
          Bạn đã xem hết
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ margin: '16px 0' }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default FeedPage;
