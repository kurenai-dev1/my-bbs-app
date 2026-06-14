// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc' // もしくは @vitejs/plugin-react

export default defineConfig(({ mode }) => {
  // 環境変数を読み込む（デフォルト値のフォールバックも設定）
  const env = loadEnv(mode, process.cwd(), '');
  const proxyPath = env.VITE_PROXY_PATH || '/api';
  const apiServer = env.VITE_API_SERVER || 'http://localhost:3000';

  return {

    // 相対パスへ
    base: './',

    plugins: [react()],

    // build: {
    //   minify: false,      // コードの圧縮・難読化を完全にオフにする
    //   sourcemap: true,    // ソースマップを出力（ブラウザのF12で元のTSコードが見えるようになる）
    // },

    server: {
      proxy: {
        // 💡 動的にプロキシパスをキーにする
        [proxyPath]: {
          target: apiServer,
          changeOrigin: true,
          // 💡 正規表現を使って、先頭のプロキシパス（例: /api）を動的に削り落とす！
          rewrite: (path) => path.replace(new RegExp(`^${proxyPath}`), '')
        }
      }
    }
  }
})