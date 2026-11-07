import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Tên khoá phải khớp với đoạn script trong index.html
const STORAGE_KEY = 'travellog_theme';

const systemTheme = (): Theme => (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

// F16. Màu định nghĩa bằng biến CSS trong styles.css; đổi theme chỉ là đổi data-theme trên <html>.
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Chưa chọn lần nào thì theo cài đặt sáng / tối của máy
  const [theme, setTheme] = useLocalStorage<Theme>(STORAGE_KEY, systemTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme phải dùng bên trong ThemeProvider');
  return ctx;
}
