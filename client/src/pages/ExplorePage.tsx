// client/src/pages/ExplorePage.tsx
// Trang Khám phá /explore (B11).
// - Đọc q từ URL; q bắt đầu bằng "#" thì gửi tag (bỏ #, chữ thường), còn lại gửi q.
// - Có 2 ô chi phí từ / đến (minCost / maxCost) — bấm "Lọc" (hoặc Enter) mới tải lại.
// - Danh sách dùng PostCard của C, cuộn vô hạn bằng useInfiniteScroll của C.
// - Không có kết quả → EmptyState.

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { parseError } from '../api/client';
import { postsApi } from '../api/posts';
import { EmptyState } from '../components/EmptyState';
import { PostCard } from '../components/PostCard';
import { SearchBox } from '../components/SearchBox';
import { PageSpinner, Spinner } from '../components/Spinner';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useUserSearch } from '../hooks/useUserSearch';
import UserMiniCard from '../components/UserMiniCard';
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
  const [costError, setCostError] = useState<string | null>(null);
  // Dùng để bỏ qua response cũ khi đổi query.
  const requestIdRef = useRef(0);

  // Tách q / tag: q bắt đầu bằng "#" → tag (bỏ #, chữ thường).
  const trimmedQ = urlQ.trim();
  const isHashtag = trimmedQ.startsWith('#');
  const q = isHashtag ? undefined : trimmedQ || undefined;
  const tag = isHashtag ? trimmedQ.slice(1).toLowerCase() : undefined;
  // (A – E01) Tìm người dùng cùng ô tìm kiếm; gõ "@lan" thì chỉ tìm người dùng, không tìm bài
  const userOnly = trimmedQ.startsWith('@');
  const { users, loading: usersLoading } = useUserSearch(trimmedQ);
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
    if (userOnly) return; // "@..." chỉ tìm người dùng
    loadPage(null, true);
  }, [loadPage, userOnly]);

  const sentinelRef = useInfiniteScroll(
    () => {
      if (hasMore && !loading && nextCursor) loadPage(nextCursor, false);
    },
    hasMore && !loading,
  );

  const setCostParams = (min: string, max: string) => {
    const params = new URLSearchParams(searchParams);
    if (min) params.set('minCost', min);
    else params.delete('minCost');
    if (max) params.set('maxCost', max);
    else params.delete('maxCost');
    setSearchParams(params, { replace: true });
  };

  const applyCost = (e: FormEvent) => {
    e.preventDefault();
    const min = minCost.trim();
    const max = maxCost.trim();
    const a = min ? Number(min) : null;
    const b = max ? Number(max) : null;
    if ((a !== null && (Number.isNaN(a) || a < 0)) || (b !== null && (Number.isNaN(b) || b < 0)))
      return setCostError('Chi phí phải là số ≥ 0.');
    if (a !== null && b !== null && a > b) return setCostError('Chi phí tối thiểu phải nhỏ hơn tối đa.');
    setCostError(null);
    setCostParams(min, max);
  };

  const clearCost = () => {
    setMinCost('');
    setMaxCost('');
    setCostError(null);
    setCostParams('', '');
  };

  const initialLoading = loading && posts.length === 0;

  return (
    <div className="explore-page stack">
      <h1 className="page-title">Khám phá</h1>
      <div className="explore-filters card">
        <SearchBox initialValue={urlQ} placeholder="Tìm địa điểm, #hashtag hoặc @người dùng" />
        <form className="explore-cost" onSubmit={applyCost} noValidate>
          <label>
            Chi phí từ
            <input
              type="number"
              min={0}
              step={100000}
              inputMode="numeric"
              value={minCost}
              placeholder="0"
              onChange={(e) => setMinCost(e.target.value)}
            />
          </label>
          <label>
            đến
            <input
              type="number"
              min={0}
              step={100000}
              inputMode="numeric"
              value={maxCost}
              placeholder="không giới hạn"
              onChange={(e) => setMaxCost(e.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-secondary btn-sm">Lọc</button>
          {(urlMinCost || urlMaxCost) && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearCost}>Bỏ lọc</button>
          )}
        </form>
        {costError && <div className="field-error">{costError}</div>}
      </div>

      {(users.length > 0 || userOnly) && (
        <section className="card explore-users" aria-label="Người dùng">
          <h2 className="explore-users-title">Người dùng</h2>
          {users.map((u) => (
            <UserMiniCard key={u._id} user={u} />
          ))}
          {!users.length && <p className="muted small">{usersLoading ? 'Đang tìm…' : 'Không có người dùng phù hợp.'}</p>}
        </section>
      )}

      {!userOnly && (<>
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
      </>)}
    </div>
  );
}
