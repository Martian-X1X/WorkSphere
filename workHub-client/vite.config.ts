import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      // ✅ Path aliases — import from '@/components/Button' instead of '../../components/Button'
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },

  server: {
    port: 3000,
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