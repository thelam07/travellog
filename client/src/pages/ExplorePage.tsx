// client/src/pages/ExplorePage.tsx
// Trang Khám phá /explore (B11).
// - Đọc q từ URL; q bắt đầu bằng "#" thì gửi tag (bỏ #, chữ thường), còn lại gửi q.
// - Có 2 ô chi phí từ / đến (minCost / maxCost) — chỉ tải lại khi URL đổi (Enter/blur).
// - Danh sách dùng PostCard của C, cuộn vô hạn bằng useInfiniteScroll của C.
// - Không có kết quả → EmptyState.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { parseError } from '../api/client';
import { postsApi } from '../api/posts';
import { EmptyState } from '../components/EmptyState';
import { PostCard } from '../components/PostCard';
import { SearchBox } from '../components/SearchBox';
import { PageSpinner, Spinner } from '../components/Spinner';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import type { Post } from '../types';

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQ = searchParams.get('q') ?? '';
  const urlMinCost = searchParams.get('minCost') ?? '';
  const urlMaxCost = searchParams.get('maxCost') ?? '';

  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // State cho ô input (chỉ để hiển thị, không trigger API).
  const [minCost, setMinCost] = useState(urlMinCost);
  const [maxCost, setMaxCost] = useState(urlMaxCost);
  // Dùng để bỏ qua response cũ khi đổi query.
  const requestIdRef = useRef(0);

  // Tách q / tag: q bắt đầu bằng "#" → tag (bỏ #, chữ thường).
  const trimmedQ = urlQ.trim();
  const isHashtag = trimmedQ.startsWith('#');
  const q = isHashtag ? undefined : trimmedQ || undefined;
  const tag = isHashtag ? trimmedQ.slice(1).toLowerCase() : undefined;
  const minN = urlMinCost.trim() ? Number(urlMinCost) : undefined;
  const maxN = urlMaxCost.trim() ? Number(urlMaxCost) : undefined;

  const loadPage = useCallback(
    async (cursor: string | null, reset: boolean) => {
      const myId = ++requestIdRef.current;
      setLoading(true);
      if (reset) setError(null);
      try {
        const page = await postsApi.search({
          q,
          tag,
          minCost: Number.isFinite(minN) ? minN : undefined,
          maxCost: Number.isFinite(maxN) ? maxN : undefined,
          cursor,
        });
        if (myId !== requestIdRef.current) return; // bỏ response cũ
        setPosts((prev) => (reset ? page.items : [...prev, ...page.items]));
        setNextCursor(page.nextCursor);
        setHasMore(page.hasMore);
      } catch (err) {
        if (myId !== requestIdRef.current) return;
        setError(parseError(err).message);
      } finally {
        if (myId === requestIdRef.current) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, tag, urlMinCost, urlMaxCost],
  );

  // Đồng bộ state input khi URL đổi (vd: bấm nút back).
  useEffect(() => {
    setMinCost(urlMinCost);
  }, [urlMinCost]);
  useEffect(() => {
    setMaxCost(urlMaxCost);
  }, [urlMaxCost]);

  // Tải lại khi q / tag / cost đổi (URL đổi).
  useEffect(() => {
    loadPage(null, true);
  }, [loadPage]);

  const sentinelRef = useInfiniteScroll(
    () => {
      if (hasMore && !loading && nextCursor) loadPage(nextCursor, false);
    },
    hasMore && !loading,
  );

  const applyCost = () => {
    const params = new URLSearchParams(searchParams);
    if (minCost.trim()) params.set('minCost', minCost.trim());
    else params.delete('minCost');
    if (maxCost.trim()) params.set('maxCost', maxCost.trim());
    else params.delete('maxCost');
    setSearchParams(params, { replace: true });
  };

  const onCostKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyCost();
    }
  };

  const initialLoading = loading && posts.length === 0;

  return (
    <div className="explore-page stack">
      <div className="explore-filters card">
        <SearchBox initialValue={urlQ} />
        <div className="explore-cost">
          <label htmlFor="explore-minCost">Chi phí từ</label>
          <input
            id="explore-minCost"
            type="number"
            min={0}
            step="0.01"
            value={minCost}
            placeholder="0"
            onChange={(e) => setMinCost(e.target.value)}
            onBlur={applyCost}
            onKeyDown={onCostKey}
          />
          <label htmlFor="explore-maxCost">đến</label>
          <input
            id="explore-maxCost"
            type="number"
            min={0}
            step="0.01"
            value={maxCost}
            placeholder="∞"
            onChange={(e) => setMaxCost(e.target.value)}
            onBlur={applyCost}
            onKeyDown={onCostKey}
          />
        </div>
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {initialLoading && <PageSpinner />}

      {!initialLoading && posts.length === 0 && (
        <EmptyState
          icon="🔍"
          title="Không có bài viết nào"
          description={
            urlQ || urlMinCost || urlMaxCost
              ? 'Thử bỏ bộ lọc hoặc đổi từ khoá khác.'
              : 'Hãy là người đầu tiên đăng bài!'
          }
        />
      )}

      {posts.length > 0 && (
        <div className="explore-list stack">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
          {hasMore && (
            <div ref={sentinelRef} className="explore-sentinel">
              {loading && <Spinner size="md" />}
            </div>
          )}
          {!hasMore && (
            <div className="muted small text-center explore-end">
              Bạn đã xem hết
            </div>
          )}
        </div>
      )}
    </div>
  );
}
