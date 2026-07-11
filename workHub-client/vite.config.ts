import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },

  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      // ✅ Proxy API calls to backend — avoids CORS in development
      '/api': {
        target: 'http://localhost:5210',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'http://localhost:5210',
        changeOrigin: true,
      },
    },
  },
})