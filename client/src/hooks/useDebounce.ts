// client/src/hooks/useDebounce.ts
// Trả về giá trị `value` nhưng chỉ cập nhật sau khi ngừng thay đổi `delay` ms.
// Dùng cho ô tìm kiếm: gõ xong mới gọi API, không gọi mỗi lần gõ.

import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
