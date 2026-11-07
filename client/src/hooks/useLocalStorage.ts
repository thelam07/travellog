import { useCallback, useState } from 'react';

/** useState đồng bộ với localStorage (lưu dạng JSON) */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStored = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // localStorage có thể bị chặn (chế độ ẩn danh) – vẫn giữ trong bộ nhớ
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, setStored] as const;
}
