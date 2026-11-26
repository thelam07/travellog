// client/src/components/SearchBox.tsx
// Ô tìm kiếm trên header: gõ xong 400ms thì chuyển tới /explore?q=...
// Dùng chung (header + có thể tái sử dụng ở trang Khám phá).

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useDebounce } from '../hooks/useDebounce';
import { useUserSearch } from '../hooks/useUserSearch';
import UserMiniCard from './UserMiniCard';
import { Search, X } from 'lucide-react';

export interface SearchBoxProps {
  /** Khởi tạo giá trị (vd: từ URL ?q=...). Controlled bên ngoài qua initialValue. */
  initialValue?: string;
  /** Tự chuyển trang khi gõ xong. Mặc định true; đặt false nếu muốn nút "Tìm". */
  autoNavigate?: boolean;
  /** Đường dẫn tìm kiếm (mặc định /explore). */
  to?: string;
  placeholder?: string;
  /** (A – E01) Hiện danh sách người dùng khớp ngay dưới ô (ô tìm kiếm trên header) */
  suggestUsers?: boolean;
}

export function SearchBox({
  initialValue = '',
  autoNavigate = true,
  to = '/explore',
  placeholder = 'Tìm bài viết, địa điểm, #hashtag…',
  suggestUsers = false,
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

  // (A – E01) Gợi ý người dùng dưới ô: mở khi gõ, đóng khi chuyển trang / bấm ra ngoài / Esc
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { users, loading: usersLoading } = useUserSearch(value, suggestUsers);
  const text = value.trim();
  const userOnly = text.startsWith('@');
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !formRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);
  const showList = suggestUsers && open && text !== '' && !text.startsWith('#');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setOpen(false);
    // "@lan" + Enter: tới thẳng trang người khớp đầu tiên
    if (suggestUsers && userOnly && users[0]) {
      navigate(`/u/${users[0].username}`);
      return;
    }
    const q = value.trim();
    const params = new URLSearchParams(location.search);
    if (q) params.set('q', q);
    else params.delete('q');
    const search = params.toString();
    navigate(`${to}${search ? `?${search}` : ''}`);
  };

  return (
    <form ref={formRef} className="search-box" onSubmit={submit} role="search">
      <span className="search-box-icon" aria-hidden="true"><Search size={16} /></span>
      <input
        type="search"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Escape' && setOpen(false)}
        aria-expanded={suggestUsers ? showList : undefined}
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
          <X size={16} />
        </button>
      )}
      {showList && (
        <div className="search-suggest" role="listbox">
          <div className="search-suggest-title">Người dùng</div>
          {users.map((u) => (
            <UserMiniCard key={u._id} user={u} />
          ))}
          {!users.length && (
            <div className="search-suggest-empty muted small">{usersLoading ? 'Đang tìm…' : 'Không có người dùng phù hợp'}</div>
          )}
          {!userOnly && (
            <button type="submit" className="search-suggest-posts">
              <Search size={15} aria-hidden /> Tìm bài viết với “{text}”
            </button>
          )}
        </div>
      )}
    </form>
  );
}

export default SearchBox;
