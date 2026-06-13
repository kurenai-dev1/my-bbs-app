import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc' // もしくは @vitejs/plugin-react

export default defineConfig({

  // 相対パスへ
  base: './',

  plugins: [react()],

  // build: {
  //   minify: false,      // コードの圧縮・難読化を完全にオフにする
  //   sourcemap: true,    // ソースマップを出力（ブラウザのF12で元のTSコードが見えるようになる）
  // },

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