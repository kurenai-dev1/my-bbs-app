import React, { useState } from 'react';
import { customFetch } from '../utils/client';

interface MyPageProps {
  user: {
    username: string;
    email: string;
    isAdmin: boolean;
  } | null;
  editDisplayName: string;
  setEditDisplayName: (value: string) => void;
  handleUpdateDisplayName: (e: React.FormEvent) => void;
  onBackToThreadList: () => void;
}

export const MyPage: React.FC<MyPageProps> = ({
  user,
  editDisplayName,
  setEditDisplayName,
  handleUpdateDisplayName,
  onBackToThreadList,
}) => {
  // 💡 パスワード変更用のローカル状態（MyPage内だけで管理）
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // 通知メッセージ状態
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  // 💡 パスワード変更の送信処理
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    // 簡易バリデーション
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'すべての項目を入力してください。' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: '新しいパスワードと確認用パスワードが一致しません。' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: '新しいパスワードは6文字以上で入力してください。' });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // 既存の仕組みに合わせて localStorage からトークンを取得
      const token = localStorage.getItem('token');
      
      const response = await customFetch('/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'パスワードの変更に失敗しました。');
      }

      // 成功時
      setPasswordMessage({ type: 'success', text: result.message || 'パスワードが正常に変更されました。' });

      // フォームをリセット
      setCurrentPassword('');
      setNewPassword(''); // 💡 修正：正しく状態更新関数を呼び出す
      setConfirmPassword('');
      
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || '予期せぬエラーが発生しました。' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <button 
        onClick={onBackToThreadList} 
        style={{ marginBottom: '20px', padding: '6px 12px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}
      >
        ⬅ 掲示板に戻る
      </button>
      
      <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h2 style={{ marginTop: 0 }}>👤 マイページ</h2>
        <hr style={{ border: '1px solid #eee', margin: '15px 0' }} />
        
        <div style={{ marginBottom: '15px', fontSize: '15px', lineHeight: '2' }}>
          <p><strong>現在のハンドル名:</strong> {user.username}</p>
          <p><strong>メールアドレス:</strong> {user.email}</p>
          <p><strong>アカウント権限:</strong> {user.isAdmin ? <span style={{ color: 'red', fontWeight: 'bold' }}>管理者</span> : <span>一般ユーザー</span>}</p>
        </div>

        <hr style={{ border: '1px solid #eee', margin: '20px 0' }} />

        {/* 1. 既存のハンドル名変更フォーム */}
        <h3>✏ ハンドル名の変更</h3>
        <form onSubmit={handleUpdateDisplayName} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="新しいハンドル名を入力" 
            value={editDisplayName} 
            onChange={(e) => setEditDisplayName(e.target.value)}
            style={{ padding: '8px', flex: 1, borderRadius: '4px', border: '1px solid #ccc' }}
            required
          />
          <button type="submit" style={{ padding: '8px 15px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            変更を保存
          </button>
        </form>

        <hr style={{ border: '1px solid #eee', margin: '20px 0' }} />

        {/* 2. 新設：パスワード変更フォーム */}
        <h3>🔒 パスワードの変更</h3>
        
        {passwordMessage && (
          <div style={{ 
            color: passwordMessage.type === 'success' ? 'green' : 'red', 
            backgroundColor: passwordMessage.type === 'success' ? '#e6f4ea' : '#fce8e6',
            padding: '10px', 
            marginBottom: '15px',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            {passwordMessage.text}
          </div>
        )}

        <form onSubmit={handleUpdatePassword}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>現在のパスワード:</label>
            <input 
              type="password" 
              value={currentPassword} 
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isSubmitting}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
              required
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>新しいパスワード:</label>
            <input 
              type="password" 
              placeholder="6文字以上"
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isSubmitting}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>新しいパスワード（確認）:</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ 
              padding: '10px 15px', 
              backgroundColor: isSubmitting ? '#ccc' : '#007bff', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '4px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              width: '100%'
            }}
          >
            {isSubmitting ? '変更を処理中...' : 'パスワードを更新'}
          </button>
        </form>
      </div>
    </div>
  );
};