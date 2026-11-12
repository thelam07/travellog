import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Server chạy cổng khác thì: API_PROXY=http://localhost:3001 npm run dev
      '/api': { target: process.env.API_PROXY ?? 'http://localhost:3000', changeOrigin: true },
      // Socket.IO cho thông báo tức thời (N03)
      '/socket.io': { target: process.env.API_PROXY ?? 'http://localhost:3000', ws: true },
    },
  },
});
