// Kiểm tra phía client, bám theo luật DTO ở server (mục 5.1, BR19). Server vẫn kiểm lại.

export type Errors<K extends string = string> = Partial<Record<K, string>>;

export function validateUsername(v: string): string | undefined {
  if (!v) return 'Vui lòng nhập tên đăng nhập.';
  if (v.length < 3 || v.length > 30) return 'Tên đăng nhập dài 3–30 kí tự.';
  if (!/^[a-z0-9_]+$/.test(v)) return 'Chỉ dùng chữ thường không dấu, số và dấu gạch dưới (_).';
  return undefined;
}

export function validateEmail(v: string): string | undefined {
  if (!v.trim()) return 'Vui lòng nhập email.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Email không hợp lệ.';
  return undefined;
}

export function validatePassword(v: string): string | undefined {
  if (!v) return 'Vui lòng nhập mật khẩu.';
  if (v.length < 8) return 'Mật khẩu có ít nhất 8 kí tự.';
  if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return 'Mật khẩu phải có cả chữ và số.';
  return undefined;
}

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}
