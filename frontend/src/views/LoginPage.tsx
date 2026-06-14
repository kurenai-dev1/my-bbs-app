import React, { useState } from 'react';
import { customFetch } from '../utils/client';

interface LoginPageProps {
  onLoginSuccess: (userData: { id: number; username: string; email: string; isAdmin: boolean }, token: string) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [view, setView] = useState<'login' | 'register'>('login');
  
  // フォーム用ステート（LoginPage内だけで使うのでここに引っ越し）
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 会員登録処理
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      const response = await customFetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '登録に失敗しました。');
      
      setMessage(data.message);
      setView('login');
      setPassword('');
    } catch (err: any) { setError(err.message); }
  };

  // ログイン処理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      const response = await customFetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'ログインに失敗しました。');

      localStorage.setItem('token', data.token);
      
      // 親（App.tsx）にログイン成功とユーザー情報を伝える
      onLoginSuccess(
        { id: data.user.id, username: data.user.username, email: data.user.email || email, isAdmin: data.user.isAdmin },
        data.token
      );
    } catch (err: any) { setError(err.message); }
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      {view === 'login' ? (
        <div style={{ border: '1px solid #ddd', padding: '25px', borderRadius: '8px', backgroundColor: '#fff' }}>
          <h2 style={{ marginTop: 0, textAlign: 'center' }}>🔑 ログイン</h2>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>メールアドレス：</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} required />
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>パスワード：</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} required />
            </div>
            <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              サインイン
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
            アカウントがない方は{' '}
            <button onClick={() => { setView('register'); setError(''); setMessage(''); }} style={{ background: 'none', border: 'none', color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}>
              新規登録へ
            </button>
          </p>
        </div>
      ) : (
        <div style={{ border: '1px solid #ddd', padding: '25px', borderRadius: '8px', backgroundColor: '#fff' }}>
          <h2 style={{ marginTop: 0 }}>📝 会員新規登録</h2>
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>ユーザー名：</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} required />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>メールアドレス：</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} required />
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>パスワード：</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} required />
            </div>
            <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              アカウントを作成する
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
            既に登録済みの方は{' '}
            <button onClick={() => { setView('login'); setError(''); setMessage(''); }} style={{ background: 'none', border: 'none', color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}>
              ログインへ
            </button>
          </p>
        </div>
      )}

      {message && <p style={{ color: 'green', marginTop: '15px', textAlign: 'center', fontWeight: 'bold' }}>{message}</p>}
      {error && <p style={{ color: 'red', marginTop: '15px', textAlign: 'center', fontWeight: 'bold' }}>{error}</p>}
    </div>
  );
}