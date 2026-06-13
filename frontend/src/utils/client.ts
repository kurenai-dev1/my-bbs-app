// 環境変数からベースURLを取得。取得できなければ安全のために '' をフォールバック
export const API_BASE = import.meta.env.VITE_API_BASE_PATH || '';

/**
 * 汎用的なカスタムFetch関数。環境に合わせて自動的にAPIのベースURLを結合します。
 */
export const customFetch = async (path: string, options?: RequestInit) => {
  // path が '/api/change-password' なら、本番では '/bbs_api/api/change-password' になる
  return fetch(`${API_BASE}${path}`, options);
};