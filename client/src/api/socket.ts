import { io, type Socket } from 'socket.io-client';

// VITE_API_URL dạng https://<server>/api → socket nối tới https://<server>; dev để trống thì đi qua proxy của Vite.
const apiUrl = import.meta.env.VITE_API_URL;
const socketUrl = apiUrl ? new URL(apiUrl).origin : undefined;

export function connectSocket(token: string): Socket {
  return io(socketUrl ?? '', { auth: { token }, transports: ['websocket', 'polling'] });
}
