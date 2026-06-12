import React from 'react';

// Props（親から受け取るデータや関数）の型定義
interface HeaderProps {
  user: { username: string; isAdmin: boolean };
  onViewChange: (view: 'register' | 'login' | 'dashboard' | 'mypage') => void;
  onLogout: () => void;
}

export function Header({ user, onViewChange, onLogout }: HeaderProps) {
  return (
    <div style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e9ecef', padding: '10px 20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', color: '#495057' }}>
          こんにちは、<strong>{user.username}</strong> さん 
          {user.isAdmin && (
            <span style={{ color: 'gold', fontWeight: 'bold', backgroundColor: '#333', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', marginLeft: '6px' }}>
              管理者
            </span>
          )}
        </span>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => onViewChange('mypage')} 
            style={{ padding: '5px 12px', cursor: 'pointer', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', color: '#333' }}
          >
            👤 マイページ
          </button>
          <button 
            onClick={onLogout} 
            style={{ padding: '5px 12px', cursor: 'pointer', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', color: '#333' }}
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}