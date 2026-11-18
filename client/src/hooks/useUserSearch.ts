// client/src/hooks/useUserSearch.ts
// (A – E01) Tìm người dùng theo chuỗi gõ: chờ ngừng gõ 300 ms, huỷ request cũ bằng AbortController,
// bỏ qua chuỗi bắt đầu bằng "#" (đó là tìm hashtag bài viết).

import { useEffect, useState } from 'react';
import { usersApi } from '../api/users';
import type { UserSummary } from '../types';
import { useDebounce } from './useDebounce';

export function useUserSearch(text: string, enabled = true) {
  const q = useDebounce(text.trim(), 300);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const active = enabled && q.replace(/^@+/, '') !== '' && !q.startsWith('#');

  useEffect(() => {
    if (!active) {
      setUsers([]);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    usersApi
      .search(q, ctrl.signal)
      .then(setUsers)
      .catch(() => !ctrl.signal.aborted && setUsers([]))
      .finally(() => !ctrl.signal.aborted && setLoading(false));
    return () => ctrl.abort();
  }, [q, active]);

  return { users: active ? users : [], loading: active && loading };
}
