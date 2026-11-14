// client/src/hooks/useFetch.ts
// Hook fetch dữ liệu qua axios `api` (có gắn token tự động), huỷ request bằng AbortController
// khi unmount hoặc url đổi. Trả về { data, loading, error, reload }.
//
// StrictMode chạy effect 2 lần: lần đầu bị huỷ ném CanceledError của axios (không phải DOMException).
// Dùng biến `active` riêng cho mỗi lần chạy để tránh lỗi huỷ ghi đè dữ liệu.

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { api, parseError } from '../api/client';

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

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!url) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError(null);

    api
      .get<T>(url, { signal: controller.signal })
      .then((res) => {
        if (active) {
          setData(res.data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!active || axios.isCancel(err)) return;
        setError(parseError(err).message);
        setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [url, tick]);

  return { data, loading, error, reload };
}
