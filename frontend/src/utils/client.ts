// utils/client.ts

// 📡 バックエンドサーバーのホスト名（例: https://example.com ）
// 同じサーバーなら空文字、別サーバーならURLが入る
const API_SERVER = import.meta.env.VITE_API_SERVER || '';

// 📁 プロキシまたはサブパスの名前（デフォルトは /api）
const PROXY_PATH = import.meta.env.VITE_PROXY_PATH || '/api';

/**
 * 汎用Fetch関数
 */
export const customFetch = async (path: string, options?: RequestInit) => {
  // 💡 API_SERVER が空なら、相対パス「/api/threads」になる（同じサーバー用）
  // 💡 API_SERVER があれば、絶対パス「https://server名/api/threads」になる（別サーバー用）
  const url = `${API_SERVER}${PROXY_PATH}${path}`;
  return fetch(url, options);
};

/**
 * <img> タグ用の画像URL生成関数
 * ※ バックエンドが /upload/xxx.png で返してくる想定
 */
export const getImageUrl = (imagePath: string) => {
  // 💡 fetchと同じく、サーバー名とプロキシパス（/api）を綺麗に結合する
  return `${API_SERVER}${PROXY_PATH}${imagePath}`;
};

