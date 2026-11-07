import { useEffect, useRef } from 'react';

/** Gọi fn ngay rồi lặp lại mỗi `interval` ms; dừng khi unmount hoặc enabled = false */
export function usePolling(fn: () => void, interval = 30000, enabled = true) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled) return;
    fnRef.current();
    const id = setInterval(() => fnRef.current(), interval);
    return () => clearInterval(id);
  }, [interval, enabled]);
}
