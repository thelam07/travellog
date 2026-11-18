// client/src/components/SearchBox.tsx
// Ô tìm kiếm trên header: gõ xong 400ms thì chuyển tới /explore?q=...
// Dùng chung (header + có thể tái sử dụng ở trang Khám phá).

import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useDebounce } from '../hooks/useDebounce';

export interface SearchBoxProps {
  /** Khởi tạo giá trị (vd: từ URL ?q=...). Controlled bên ngoài qua initialValue. */
  initialValue?: string;
  /** Tự chuyển trang khi gõ xong. Mặc định true; đặt false nếu muốn nút "Tìm". */
  autoNavigate?: boolean;
  /** Đường dẫn tìm kiếm (mặc định /explore). */
  to?: string;
  placeholder?: string;
}

export function SearchBox({
  initialValue = '',
  autoNavigate = true,
  to = '/explore',
  placeholder = 'Tìm bài viết, địa điểm, #hashtag…',
}: SearchBoxProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = useState(initialValue);
  const debounced = useDebounce(value, 400);

  // Đồng bộ value khi URL đổi (vd: bấm nút back).
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Tự chuyển trang sau khi ngừng gõ.
  useEffect(() => {
    if (!autoNavigate) return;
    const q = debounced.trim();
    // Chỉ chuyển khi đang ở /explore (hoặc đã ở `to`) — tránh spam điều hướng từ trang khác.
    if (!location.pathname.startsWith(to)) return;
    const params = new URLSearchParams(location.search);
    if (q) params.set('q', q);
    else params.delete('q');
    const search = params.toString();
    const next = `${to}${search ? `?${search}` : ''}`;
    if (next !== `${location.pathname}${location.search}`) {
      navigate(next, { replace: true });
    }
  }, [debounced, autoNavigate, to, location.pathname, location.search, navigate]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    const params = new URLSearchParams(location.search);
    if (q) params.set('q', q);
    else params.delete('q');
    const search = params.toString();
    navigate(`${to}${search ? `?${search}` : ''}`);
  };

  return (
    <form className="search-box" onSubmit={submit} role="search">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Tìm kiếm"
      />
      {value && (
        <button
          type="button"
          className="search-box-clear"
          aria-label="Xoá"
          onClick={() => setValue('')}
        >
          ×
        </button>
      )}
    </form>
  );
}

export default SearchBox;
