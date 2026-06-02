import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc' // もしくは @vitejs/plugin-react

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // フロント側で `/api` から始まるリクエストを送った場合、
      // 自動的にバックエンド（ポート3000）へ転送する設定
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})