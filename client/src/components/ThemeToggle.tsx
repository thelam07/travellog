import { useTheme } from '../contexts/ThemeContext';

/** Nút đổi sáng / tối, dùng trên header, menu admin và trang đăng nhập */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const label = theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối';
  return (
    <button type="button" className="icon-btn" onClick={toggleTheme} aria-label={label} title={label}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
