// client/src/components/SearchBox.tsx
// Ô tìm kiếm trên header: gõ xong 400ms thì chuyển tới /explore?q=...
// Dùng chung (header + có thể tái sử dụng ở trang Khám phá).

import { useEffect, useRef, useState, type FormEvent } from 'react';
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
  // Lưu giá trị debounced lần trước để biết khi nào nó thật sự đổi.
  const lastDebouncedRef = useRef(debounced);
  // Lưu giá trị initialValue lần trước để đồng bộ value khi URL đổi (bấm Back).
  const lastInitialRef = useRef(initialValue);

  // Đồng bộ value khi URL đổi (vd: bấm nút back).
  useEffect(() => {
    if (initialValue === lastInitialRef.current) return;
    lastInitialRef.current = initialValue;
    setValue(initialValue);
  }, [initialValue]);

  // Tự chuyển trang sau khi ngừng gõ.
  // Chỉ chạy khi debounced thật sự đổi (dùng ref để so sánh), và chỉ khi user đã ngừng gõ (debounced === value).
  // Bỏ location.search khỏi deps để effect không chạy lại khi chính nó vừa navigate.
  useEffect(() => {
    if (!autoNavigate) return;
    if (debounced === lastDebouncedRef.current) return;
    lastDebouncedRef.current = debounced;
    if (debounced !== value) return; // còn đang gõ, chờ
    // Chỉ chuyển khi đang ở trang tìm kiếm — tránh spam điều hướng từ trang khác.
    if (!location.pathname.startsWith(to)) return;
    const q = debounced.trim();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    const search = params.toString();
    navigate(`${to}${search ? `?${search}` : ''}`, { replace: true });
  }, [debounced, autoNavigate, to, value, location.pathname, navigate]);

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
