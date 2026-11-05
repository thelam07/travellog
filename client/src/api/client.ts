import axios, { AxiosError } from 'axios';
import type { ApiError } from '../types';

export const TOKEN_KEY = 'travellog_token';

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Gắn token vào mọi request
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// AuthContext đăng ký hàm xử lý khi phiên hết hạn (401) hoặc tài khoản bị khoá (403 ACCOUNT_LOCKED)
type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler | null = null;
export function setSessionExpiredHandler(handler: SessionExpiredHandler | null) {
  onSessionExpired = handler;
}

// Các request đăng nhập trả 401 khi sai mật khẩu: không coi là hết phiên
const AUTH_ENDPOINTS = ['/auth/login', '/auth/admin/login', '/auth/register'];

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiError>) => {
    const status = error.response?.status;
    const code = error.response?.data?.error?.code;
    const url = error.config?.url ?? '';
    const hadToken = Boolean(tokenStorage.get());
    const isAuthCall = AUTH_ENDPOINTS.some((p) => url.startsWith(p));
    if (hadToken && !isAuthCall && (status === 401 || (status === 403 && code === 'ACCOUNT_LOCKED'))) {
      onSessionExpired?.();
    }
    return Promise.reject(error);
  },
);

export interface ParsedError {
  status: number | null;
  code: string | null;
  message: string;
  details: Record<string, string[]>;
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Dữ liệu không hợp lệ.',
  401: 'Bạn cần đăng nhập lại.',
  403: 'Bạn không có quyền thực hiện thao tác này.',
  404: 'Không tìm thấy dữ liệu.',
  409: 'Dữ liệu bị trùng.',
  502: 'Dịch vụ bên ngoài đang lỗi, thử lại sau.',
};

export function parseError(err: unknown): ParsedError {
  if (axios.isAxiosError<ApiError>(err)) {
    const status = err.response?.status ?? null;
    const body = err.response?.data?.error;
    if (!err.response) {
      return { status: null, code: 'NETWORK', message: 'Không kết nối được máy chủ.', details: {} };
    }
    return {
      status,
      code: body?.code ?? null,
      message: body?.message || (status && STATUS_MESSAGES[status]) || 'Đã có lỗi xảy ra.',
      details: body?.details ?? {},
    };
  }
  return { status: null, code: null, message: 'Đã có lỗi xảy ra.', details: {} };
}

/** Chuyển error.details của server ({ 'location.name': ['...'] }) thành lỗi theo trường của form. */
export function fieldErrorsFrom(err: unknown): Record<string, string> {
  const { details } = parseError(err);
  const result: Record<string, string> = {};
  for (const [key, messages] of Object.entries(details)) {
    const field = key.split('.')[0];
    if (!result[field] && messages?.length) result[field] = messages[0];
  }
  return result;
}

export function isCanceled(err: unknown): boolean {
  return axios.isCancel(err);
}
