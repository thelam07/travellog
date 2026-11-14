// client/src/hooks/useFetch.ts
// Hook fetch dữ liệu từ URL, huỷ request bằng AbortController khi unmount hoặc url đổi.
// Trả về { data, loading, error, reload }.

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useFetch<T>(url: string | null): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const cancelledRef = useRef(false);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    cancelledRef.current = false;
    if (!url) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || `HTTP ${res.status}`);
        }
        return res.json() as Promise<T>;
      })
      .then((json) => {
        if (cancelledRef.current) return;
        setData(json);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelledRef.current) return;
        // Bỏ qua lỗi do huỷ request (AbortError) — không phải lỗi thật
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.');
        setLoading(false);
      });

    return () => {
      cancelledRef.current = true;
      controller.abort();
    };
  }, [url, tick]);

  return { data, loading, error, reload };
}
