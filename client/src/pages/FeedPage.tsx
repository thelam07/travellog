import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { usersApi } from '../api/users';
import { EmptyState } from '../components/EmptyState';
import FollowButton from '../components/FollowButton';
import { PostCard } from '../components/PostCard';
import { PageSpinner, Spinner } from '../components/Spinner';
import UserMiniCard from '../components/UserMiniCard';
import { useAuth } from '../contexts/AuthContext';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useFeedStore } from '../stores/useFeedStore';
import type { UserSummary } from '../types';

export function FeedPage() {
  const { user } = useAuth();
  const items = useFeedStore((s) => s.items);
  const hasMore = useFeedStore((s) => s.hasMore);
  const loading = useFeedStore((s) => s.loading);
  const error = useFeedStore((s) => s.error);
  const loadFirst = useFeedStore((s) => s.loadFirst);
  const loadMore = useFeedStore((s) => s.loadMore);

  const [suggestions, setSuggestions] = useState<UserSummary[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const loadSuggestions = useCallback(async () => {
    if (!user || user.role !== 'member') return;
    setLoadingSuggestions(true);
    try {
      const res = await usersApi.suggestions();
      setSuggestions(res);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [user]);

  useEffect(() => {
    loadFirst();
    void loadSuggestions();
  }, [loadFirst, loadSuggestions]);

  // Đang ở bảng tin mà bấm logo hoặc "Bảng tin": React Router tạo location.key mới (cùng đường dẫn "/")
  // nên trang không mount lại. Bắt thay đổi đó để cuộn lên đầu và tải lại trang đầu, thấy bài mới.
  const location = useLocation();
  const lastKey = useRef(location.key);
  useEffect(() => {
    if (location.key === lastKey.current) return;
    lastKey.current = location.key;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadFirst();
    void loadSuggestions();
  }, [location.key, loadFirst, loadSuggestions]);

  const sentinelRef = useInfiniteScroll(loadMore, hasMore && !loading);

  const handleFollowChange = (targetUserId: string, isFollowing: boolean) => {
    if (isFollowing) {
      setSuggestions((prev) => prev.filter((u) => u._id !== targetUserId));
      loadFirst();
    }
  };

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

  return (
    <div className="feed-layout">
      <div className="feed-main stack">
        {items.length === 0 ? (
          <div className="feed-empty-container">
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
        ) : (
          <>
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
          </>
        )}
      </div>

      {user?.role === 'member' && (suggestions.length > 0 || loadingSuggestions) && (
        <aside className="feed-sidebar">
          <div className="card suggestions-card">
            <h3 className="suggestions-title">Gợi ý theo dõi</h3>
            {loadingSuggestions && suggestions.length === 0 ? (
              <div className="suggestions-loading">
                <Spinner size="sm" />
              </div>
            ) : (
              <div className="suggestions-list">
                {suggestions.map((item) => (
                  <div key={item._id} className="suggestion-item">
                    <UserMiniCard user={item} />
                    <FollowButton
                      userId={item._id}
                      isFollowing={false}
                      onChange={(isFollowing) => handleFollowChange(item._id, isFollowing)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

export default FeedPage;
