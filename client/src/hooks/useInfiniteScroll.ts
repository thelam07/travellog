import { useEffect, useRef } from 'react';

export function useInfiniteScroll(onLoadMore: () => void, enabled = true) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first && first.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: '300px' },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [onLoadMore, enabled]);

  return sentinelRef;
}

export default useInfiniteScroll;
